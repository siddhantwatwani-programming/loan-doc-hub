

## Fix Plan: Broker Name Mapping and Date Label

### Issue 1: `{{Broker.Name}}` Not Rendering

**Root Cause**: The field `Broker.Name` exists in `field_dictionary` but is never populated. The broker form stores individual fields (`broker1.first_name`, `broker1.middle_name`, `broker1.last_name`). Unlike `borrower.borrower_description` and `property1.address`, there is no auto-computation step for `Broker.Name`.

**Fix — File: `supabase/functions/generate-document/index.ts`**

Add an auto-compute block (after the existing `property1.address` block, ~line 256) that:
1. Checks if `Broker.Name` (or `broker.name`) already has a value
2. If not, iterates over `fieldValues` looking for `broker1.first_name`, `broker1.middle_name`, `broker1.last_name` (and `broker1.company` as fallback)
3. Concatenates the name parts into a full name string
4. Sets both `Broker.Name` and `broker.name` in `fieldValues`
5. Follows the same pattern as the existing `borrower.borrower_description` auto-compute

### Issue 2: Date Label Missing

**Root Cause**: The template likely has a line like `Date: {{date}}` or similar. When the date merge tag resolves, it produces the formatted date value. However, looking at the user's screenshot, the output shows `26/02/2026: ___` — the "Date" text has been replaced by the date value, suggesting a label-based replacement is incorrectly replacing the word "Date" with the date value.

**Fix — File: `supabase/functions/generate-document/index.ts`**

After the existing date auto-fill logic, also ensure the `date` field key is populated in fieldValues so `{{date}}` resolves. The `date` field already exists in `field_dictionary` (`field_key: 'date'`, `data_type: 'date'`). The existing auto-fill logic should handle this, but the label "Date" in the template text may be getting consumed by a label alias.

**Additional investigation needed**: Check `merge_tag_aliases` for any label alias that maps "Date" to a field key — if one exists, it could be replacing the static "Date:" text with the date value, removing the label.

**Fix — File: `supabase/functions/_shared/tag-parser.ts` (if needed)**

If the label replacement is consuming the "Date:" prefix, the fix would be in the `replaceLabelBasedFields` function to ensure word-boundary matching doesn't replace the label text when a merge tag for the same field exists in the same context.

### Summary of Changes

| File | Change |
|------|--------|
| `generate-document/index.ts` | Add `Broker.Name` auto-compute from `broker1.first_name/middle_name/last_name` |
| `generate-document/index.ts` | Verify date field resolution for the `date` field key |
| `tag-parser.ts` | If label alias causes "Date:" removal, add protection (only if confirmed) |

