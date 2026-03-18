

## Plan: Fallback for `li_gd_interestRate` from Loan Terms

### Problem
The template placeholder `{{li_gd_interestRate}}` is not populating because:
1. The lien bridging code correctly maps `lien1.interest_rate` → `li_gd_interestRate`, but only when lien data has an `interest_rate` value stored
2. The deal's liens section currently has no `interest_rate` data entered
3. There is no fallback to the loan-level interest rate fields (`ln_p_interestRate` or `ln_p_noteRate`)

### Root Cause
After lien bridging completes, if no lien record contains `interest_rate`, `li_gd_interestRate` remains unset. There is no fallback to populate it from the loan terms interest rate (`ln_p_interestRate`) or note rate (`ln_p_noteRate`).

### Fix
**File:** `supabase/functions/generate-document/index.ts`

After the lien bridging block (after line 822, `console.log("Lien field bridging complete")`), add a fallback:

```typescript
// Fallback: if li_gd_interestRate is still empty, populate from loan terms
if (!fieldValues.has("li_gd_interestRate") || !fieldValues.get("li_gd_interestRate")?.rawValue) {
  const loanInterestRate = fieldValues.get("ln_p_interestRate") || fieldValues.get("ln_p_noteRate");
  if (loanInterestRate?.rawValue) {
    fieldValues.set("li_gd_interestRate", loanInterestRate);
    console.log(`[generate-document] Fallback: li_gd_interestRate populated from loan terms = "${loanInterestRate.rawValue}"`);
  }
}
```

### What this does
- After lien bridging, checks if `li_gd_interestRate` is still empty
- Falls back to `ln_p_interestRate` first, then `ln_p_noteRate`
- Only sets the value if it doesn't already exist (no override of lien-specific data)

### What is NOT changed
- No template changes
- No UI changes
- No database changes
- No changes to tag-parser, field-resolver, or any other files
- No impact on other documents or fields
- Lien bridging logic remains untouched

