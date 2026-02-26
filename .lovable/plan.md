

## Fix: Date Field Not Populating in Document

### Root Cause

The `merge_tag_aliases` table has a label alias: `tag_name: "Date"`, `field_key: "notary.date"`, `replace_next: "Date"`, `tag_type: "label"`. This means the label-based replacement should find the word "Date" in the document and replace it with the formatted date value.

However, in the previous fix for the "Date label missing" issue, a colon-detection guard was added at **lines 279-284** of `tag-parser.ts`. This guard skips replacement when the matched word is followed by `:` (e.g., `Date:`). While this correctly preserves the "Date:" label text, it also **prevents the date value from being inserted anywhere**, leaving the date field completely empty in the output.

### Fix - File: `supabase/functions/_shared/tag-parser.ts` (lines 279-284)

Change the colon-protection logic so that instead of skipping the replacement entirely, it:

1. Keeps the label word (e.g., "Date")
2. Looks ahead past the colon and any XML tags for underscores or blank space
3. Inserts the formatted date value after the colon, replacing any placeholder underscores

Specifically, replace the current block:
```
if (immediateAfter.startsWith(':')) {
  return match; // Skip entirely
}
```

With logic that returns `match` unchanged but then does a secondary replacement on the pattern `Label:___` or `Label: ` to append/insert the formatted value after the colon. This preserves both the label text AND inserts the date value.

### No Other Changes

- No changes to date auto-fill logic (already working - logs confirm 96 date fields auto-filled)
- No changes to `generate-document/index.ts`
- No changes to formatting functions (DD/MM/YYYY format already correct via `formatByDataType`)
- No database changes

