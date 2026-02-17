

## Fix: Empty Row in Borrowers Table During Document Generation

### Problem
When generating the "ASSIGNMENT OF RENTS RIDER TO DEED OF TRUST" document, an extra empty row appears in the Borrowers table section.

### Root Cause
The DOCX template contains a merge tag `{{borrower.borrower_description}}` which is designed to hold a textual description of all borrowers (e.g., "Adwait and Abhijit"). However, this field is never auto-computed during document generation. Since the user does not manually enter a value for `borrower.borrower_description`, the tag resolves to an empty string, leaving a visible blank row in the generated document.

The underlying data confirms:
- Deal DL-2026-0115 has two borrowers: borrower1 ("Adwait") and borrower2 ("Abhijit")
- Both have `full_name` values stored with indexed keys `borrower1.full_name` and `borrower2.full_name`
- `borrower.borrower_description` has no stored value in `deal_section_values`
- The template tag `{{borrower.borrower_description}}` resolves to empty, producing the blank row

### Fix (Single File Change)

**File**: `supabase/functions/generate-document/index.ts`

After the `fieldValues` map is built (after line 179), add logic to auto-compute `borrower.borrower_description` if it is not already set:

1. Collect all `borrowerN.full_name` values from `fieldValues` by scanning for keys matching the pattern `borrower{N}.full_name`
2. Sort them by index number (borrower1, borrower2, etc.)
3. Join them with " and " to produce a description string (e.g., "Adwait and Abhijit")
4. Set `fieldValues["borrower.borrower_description"]` to this computed value
5. Only compute if the field is not already explicitly set by the user

### Technical Detail

```text
Location: supabase/functions/generate-document/index.ts, after line 179

Logic:
  - Check if fieldValues.has("borrower.borrower_description") is falsy or empty
  - Scan fieldValues for keys matching /^borrower(\d+)\.full_name$/
  - Collect names in index order
  - Join with " and "
  - Set into fieldValues as { rawValue: joinedString, dataType: "text" }
```

### What Will NOT Change
- No UI changes
- No database schema changes
- No changes to tag-parser, field-resolver, or docx-processor
- No changes to template_field_maps or merge_tag_aliases
- No changes to any other edge function
- No changes to how other merge tags are resolved
