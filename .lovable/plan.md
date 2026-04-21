

## Block save when Sold Rate / Distribution allocation is invalid

### Scope (exactly the two cases requested)

**A. Loan → Terms & Balances → Sold Rate**
- Error: Sold Rate is checked, **Lenders < 100** and **Origination Vendor is empty**.
- This is already detected in `LoanTermsBalancesForm.tsx` (`allocationIncomplete`) but only displayed visually — `performSave` proceeds.

**B. Loan → Penalties → Late Fee 1 → Distribution** (and other penalties using the same `DistributionFields`)
- Error: **Lenders < 100** and **Origination Vendor is empty** under any penalty's `distribution.*` fields.
- Already detected in `LoanTermsPenaltiesForm.tsx` (`allocationIncomplete`) but not save-blocking.

### Fix (minimal)

Add a tiny shared validator and call it inside `performSave` in `DealDataEntryPage.tsx` before `saveDraft()`. If validation fails, abort save, show a toast, switch the user to the offending tab/sub-section, and set `showValidation(true)` so the inline red error already coded in those forms is revealed.

### Changes

1. **New file: `src/lib/loanAllocationValidation.ts`**
   Two pure helpers reading from `values: Record<string,string>`:
   - `validateBalancesSoldRate(values)` → returns `{ ok: boolean }`. Fails when:
     - `loan_terms.balances.sold_rate_enabled === 'true'`
     - `sold_rate.lenders` parses to a number > 0 and < 100
     - `sold_rate.origination_vendor` is empty/NaN
     (Use the same `FIELD_KEYS` from `LOAN_TERMS_BALANCES_KEYS`.)
   - `validatePenaltyDistributions(values)` → returns `{ ok: boolean, firstPrefix?: string }`. Iterates over the known penalty prefixes already used in `LoanTermsPenaltiesForm.tsx` (late_fee_1, late_fee_2, default_interest, interest_guarantee, prepayment_penalty, maturity). For each prefix, fails when:
     - `${prefix}.distribution.lenders` is non-empty and parses < 100
     - `${prefix}.distribution.origination_vendors` is empty/NaN

2. **`src/pages/csr/DealDataEntryPage.tsx`** — modify `performSave` only:
   ```ts
   const performSave = async () => {
     setShowValidation(true);

     const balancesCheck = validateBalancesSoldRate(values);
     if (!balancesCheck.ok) {
       setActiveTab('loan_terms');
       nav?.setSubSection('loan_terms', 'balances_loan_details');
       toast({
         title: 'Cannot save',
         description: 'Please complete the Sold Rate allocation in Terms & Balances before saving.',
         variant: 'destructive',
       });
       return;
     }

     const penaltyCheck = validatePenaltyDistributions(values);
     if (!penaltyCheck.ok) {
       setActiveTab('loan_terms');
       nav?.setSubSection('loan_terms', 'penalties');
       toast({
         title: 'Cannot save',
         description: 'Please complete the Distribution allocation under Loan → Penalties before saving.',
         variant: 'destructive',
       });
       return;
     }

     computeCalculatedFields();
     const success = await saveDraft();
     // ...rest unchanged
   };
   ```
   Also gate `handleMarkReady` the same way (it currently calls `saveDraft` directly) by reusing the same two checks before `saveDraft`.

### What is NOT changed

- No DB schema changes. No new tables. Existing `saveDraft` API is reused unchanged.
- No UI/layout changes — the inline red borders + helper text already exist; we only ensure they appear (via `setShowValidation(true)` already called) and we navigate to the offending sub-section.
- No change to other tabs, other validations, dirty-tracking, autosave, or grid behavior.
- The visual error already in both forms remains the user-facing prompt to "fix the validation error first".

### Files touched

- `src/lib/loanAllocationValidation.ts` (new, ~40 lines)
- `src/pages/csr/DealDataEntryPage.tsx` (add 2 imports, ~20 lines inside `performSave` and `handleMarkReady`)

