

## Plan: Fix Re851a Checkbox Label Matching

### Root Cause (2 issues)

1. **Wrong label**: The `merge_tag_aliases` entry for `ln_p_amortized` has `tag_name = 'AMORTIZED'`, but the Re851a template uses `FULLY AMORTIZED` next to the checkbox. So the label never matches correctly.

2. **Substring collision**: The regex in `replaceStaticCheckboxLabel` matches `AMORTIZED` as a substring inside `AMORTIZED PARTIALLY`, causing the wrong checkbox to be checked. The regex needs a word boundary or end-of-match guard after the label.

### Fix

**1. Database migration** — Update the `merge_tag_aliases` entry:
```sql
UPDATE merge_tag_aliases
SET tag_name = 'FULLY AMORTIZED'
WHERE field_key = 'ln_p_amortized' AND tag_type = 'label';
```
This aligns the label with what the Re851a template actually contains.

**2. `supabase/functions/_shared/tag-parser.ts`** — Add word boundary after label in regex (line 567):
```
Change:  `([☐☑☒])((?:\\s|<[^>]+>)*)(${labelEscaped})`
To:      `([☐☑☒])((?:\\s|<[^>]+>)*)(${labelEscaped})(?![A-Za-z])`
```
The negative lookahead `(?![A-Za-z])` prevents `AMORTIZED` from matching inside `AMORTIZED PARTIALLY` (the `P` that follows would block the match). This is a minimal, safe change — it only rejects matches where the label is immediately followed by another letter.

### No Other Changes
- No UI changes
- No template formatting changes
- No changes to the derivation logic (lines 736-747 in generate-document already correct)
- No schema changes

### Files Changed
| File | Change |
|---|---|
| Database migration | UPDATE tag_name from `AMORTIZED` to `FULLY AMORTIZED` |
| `supabase/functions/_shared/tag-parser.ts` | Add `(?![A-Za-z])` to checkbox label regex (line 567) |

