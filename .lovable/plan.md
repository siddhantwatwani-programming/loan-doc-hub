

# Plan: Fix Field Code Flattening for "With Field Codes" Templates

## Root Cause

The template uses Word field codes (begin/instrText/separate/displayText/end structures). Two problems prevent correct flattening:

1. **Attribute order dependency**: The `complexFieldPattern` regex requires `w:fldCharType` as the first attribute on `<w:fldChar>`. Word can output `<w:fldChar w:dirty="true" w:fldCharType="begin"/>` — the regex silently fails to match.

2. **MERGEFIELD-only extraction**: Line 36 returns `fullMatch` unchanged if instrText doesn't contain the `MERGEFIELD` keyword. Templates "With Field Codes" may have instrText containing `{{bk_p_brokerLicens}}` or just `bk_p_brokerLicens` without the `MERGEFIELD` prefix. These field codes are never flattened.

**Consequence**: The field code display text ("Apurv Verma") remains in `<w:t>` elements. The `curlyFragmentedPattern` then matches from `{{` (literal text before the field code) through the display text to `}}` (literal text after), producing a corrupted tag like `{{bk_p_brokerLicensApurvVerma}}`. This destroys both the `bk_p_brokerLicens` tag and the surrounding content including the "Broker's Representative" line.

## Implementation (Single File: `tag-parser.ts`)

### Change 1: Fix attribute-order sensitivity in complexFieldPattern (line 31)

Replace the three `<w:fldChar\s+w:fldCharType="TYPE"[^/]*\/>` fragments with `<w:fldChar\s+[^>]*?w:fldCharType="TYPE"[^/]*\/>` to allow any attributes before `w:fldCharType`.

### Change 2: Extend instrText extraction to handle non-MERGEFIELD field codes (lines 33-46)

After the existing `MERGEFIELD` check at line 35, add a fallback that:
- Checks if instrText contains a curly brace pattern `{{fieldName}}`  → extract fieldName, flatten to `{{fieldName}}` (not chevrons, since the template uses curly syntax)
- Checks if instrText contains a bare field key matching `[A-Za-z0-9_.]+` → extract it, flatten to `«fieldName»`

This ensures field codes with non-standard instructions are still flattened, removing the stale display text.

### What This Does NOT Change
- No UI/component changes
- No database/schema changes
- No template file changes
- No changes to tag parsing, field resolution, formatting, or label replacement logic
- Only the `flattenMergeFieldStructures` function is modified

