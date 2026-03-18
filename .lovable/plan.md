

## Plan: Remove Incorrect Loan Terms Fallback for `li_gd_interestRate`

### Problem
The fallback logic added at lines 824-831 of `generate-document/index.ts` populates `li_gd_interestRate` from `ln_p_interestRate` or `ln_p_noteRate` (Loan Terms) when no lien-specific interest rate exists. This causes the wrong value to appear in the generated document.

### Fix
**File:** `supabase/functions/generate-document/index.ts`

Remove lines 824-831 (the entire fallback block):

```typescript
// DELETE THIS BLOCK:
// Fallback: if li_gd_interestRate is still empty, populate from loan terms
if (!fieldValues.has("li_gd_interestRate") || !fieldValues.get("li_gd_interestRate")?.rawValue) {
  const loanInterestRate = fieldValues.get("ln_p_interestRate") || fieldValues.get("ln_p_noteRate");
  if (loanInterestRate?.rawValue) {
    fieldValues.set("li_gd_interestRate", loanInterestRate);
    console.log(`[generate-document] Fallback: li_gd_interestRate populated from loan terms = "${loanInterestRate.rawValue}"`);
  }
}
```

The existing lien bridging logic (lines 803-821) already correctly maps `lien1.interest_rate` → `li_gd_interestRate` from Liens tab data. The fallback was overriding this with wrong data.

### What is NOT changed
- No template changes
- No UI changes
- No database changes
- No other files modified
- Lien bridging logic untouched
- No impact on other documents or fields

