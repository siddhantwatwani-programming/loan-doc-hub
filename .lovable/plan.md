

## Problem Analysis

The edge function logs from the latest generation (2026-03-17 14:03) confirm that `bk_p_firstName` = "Abhijit " and `bk_p_lastName` = "Gadge" are both successfully replaced. Yet the user reports the entire "Broker's Representative:" line is missing from the rendered document.

The critical clue is the brace count mismatch: **7 `{{` vs 6 `}}`** after normalization. One `{{` has no matching `}}`. This orphaned `{{` is cleaned, but the root issue is deeper.

**Root cause**: The template likely wraps `{{bk_p_firstName}}` inside a Word field code structure (fldChar begin → instrText → fldChar end) **without a `separate` marker**. The current `flattenMergeFieldStructures` function only handles field codes WITH a `separate` marker (Pattern A: begin → instrText → separate → display → end). When there's no `separate`, the complex pattern doesn't match. The `instrTextFallback` converts the instrText to visible `<w:t>`, but the surrounding fldChar `begin` and `end` markers remain. Word interprets all content between begin/end as invisible field code content — so the replaced text "Abhijit " is present in the XML but **hidden by Word**.

The extra `{{` comes from literal braces in the template text that surrounded the field code structure — they survive because the field code wasn't fully flattened.

## Plan

### 1. Add Pattern C to `flattenMergeFieldStructures` (`tag-parser.ts`)

Handle field codes WITHOUT a `separate` marker: `begin → instrText → end`. This pattern should:
- Match: `<w:r>fldChar begin</w:r> ... instrText runs ... <w:r>fldChar end</w:r>`
- Extract the field name from instrText
- Replace the entire structure with a single `<w:r><w:t>{{fieldName}}</w:t></w:r>`

Place this AFTER Pattern A (which handles begin/separate/end) and BEFORE the instrTextFallback.

### 2. Add orphaned fldChar cleanup pass (`tag-parser.ts`)

After the instrTextFallback, add a cleanup pass that removes orphaned fldChar begin/end pairs that no longer contain instrText. Pattern: `<w:r>...fldChar begin...</w:r>` immediately followed by `<w:r>...fldChar end...</w:r>` with no instrText between them — remove both runs entirely.

### 3. No other changes

- No database changes
- No UI changes
- No changes to generate-document/index.ts

### Files Modified

| File | Change |
|------|--------|
| `supabase/functions/_shared/tag-parser.ts` | Add Pattern C for no-separate field codes; add orphaned fldChar cleanup |

