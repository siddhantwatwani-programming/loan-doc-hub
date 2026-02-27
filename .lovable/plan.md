

## Plan: Fix Account Number Currency Formatting in Generated Documents

### Problem
The `Terms.LoanNumber` field (displayed as "Account Number" in the Personal Guaranty document) has `data_type: "text"` in the field_dictionary. During document generation, `formatByDataType("text")` returns the raw numeric value without currency formatting.

### Solution
Add a post-processing step in `supabase/functions/generate-document/index.ts` (after field values are resolved, around line 183) that overrides the `dataType` to `"currency"` for the `Terms.LoanNumber` field. This ensures `formatByDataType` applies `$1,000,300.00` formatting when the merge tag is replaced in the template.

### File: `supabase/functions/generate-document/index.ts`
**Change (after line 181, before the log on line 183):**
- Add a block that checks if `Terms.LoanNumber` exists in `fieldValues` and overrides its `dataType` from `"text"` to `"currency"`, so the existing `formatByDataType` pipeline applies US currency formatting automatically.

```
// Force currency formatting for Loan/Account Number in generated documents
const loanNumberKeys = ["Terms.LoanNumber", "terms.loannumber"];
for (const lnKey of loanNumberKeys) {
  const existing = fieldValues.get(lnKey);
  if (existing && existing.dataType !== "currency") {
    fieldValues.set(lnKey, { rawValue: existing.rawValue, dataType: "currency" });
  }
}
```

### No other files modified
- No UI changes
- No database schema changes
- No changes to formatting.ts, tag-parser.ts, or any other shared modules

