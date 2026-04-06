

## Plan: Add "Unpaid Other" Field + Auto-Calculated Fields in Loan Terms Balances

### Summary
Add a new "Unpaid Other" currency field below "Charges Interest" in the Balances column, then make 4 fields auto-calculated and read-only: Total Payment, Amount to Reinstate, Total Balance Due, and Estimated Balloon Payment.

### New Field

**Unpaid Other** — currency field placed below "Charges Interest" in the Balances column.
- Field key: `loan_terms.unpaid_other`
- Legacy key: `ln_p_unpaidOther`

### Calculation Formulas

| Field | Formula (sum of field keys) |
|---|---|
| **Total Payment** | Regular Payment + Additional Principal + Servicing Fees + Other Sched. Pmts + To Escrow Impounds + Default Interest |
| **Amount to Reinstate** | Principal + Unpaid Late Charges + Accrued Late Charges + Unpaid Interest + Accrued Interest + Interest Guarantee + Unpaid Def. Interest + Accrued Def. Interest + Charges Owed + Charges Interest + Unpaid Other |
| **Total Balance Due** | Principal + (Unpaid Interest + Accrued Interest) + (Charges Owed + Charges Interest) + Unpaid Other |
| **Estimated Balloon Payment** | Total Balance Due + (Loan Amount × Note Rate / 12 / 100) — i.e. Total Balance Due + 1 month interest |

All 4 calculated fields will be **read-only** and **auto-updated in real-time** as users change input values.

### Technical Changes

**1. Database migration** — INSERT 1 new row into `field_dictionary`:
- `ln_p_unpaidOther`, label "Unpaid Other", section `loan_terms`, form_type `balances_loan_details`, data_type `currency`

**2. `src/lib/fieldKeyMap.ts`** — Add `unpaidOther: 'loan_terms.unpaid_other'` to `LOAN_TERMS_BALANCES_KEYS`

**3. `src/lib/legacyKeyMap.ts`** — Add `'loan_terms.unpaid_other': 'ln_p_unpaidOther'`

**4. `src/components/deal/LoanTermsBalancesForm.tsx`** — 3 changes:
- Add `unpaidOther` currency field below "Charges Interest" (after line 688)
- Add real-time calculation logic using `useEffect` or inline computation that sums the relevant fields for Total Payment, Amount to Reinstate, Total Balance Due, and Estimated Balloon Payment
- Make those 4 fields read-only (disabled inputs with computed values)

**5. `src/lib/calculationEngine.ts`** — No changes needed. The calculations will be done inline in the form component (like existing patterns) since they involve summing many fields, which is simpler than defining complex multi-dependency formulas in the calculation engine.

### UI Layout (Balances Column — field order)

```text
Principal
Unpaid Late Charges
Accrued Late Charges
Unpaid Interest
Accrued Interest
Interest Guarantee
Unpaid Def. Interest
Accrued Def. Interest
Charges Owed
Charges Interest
Unpaid Other          ← NEW
Amount to Reinstate   ← NOW CALCULATED, READ-ONLY
Reserve Balance
Escrow Balance
Suspense Funds
Total Balance Due     ← NOW CALCULATED, READ-ONLY
Estimated Balloon Pmt ← NOW CALCULATED, READ-ONLY
```

Payments column — Total Payment becomes calculated and read-only.

### Behavior
- All 4 calculated fields display formatted currency with `$` prefix
- Values update instantly as any input field changes
- Fields are visually distinguished (primary styled labels, as they already are)
- Empty/missing input values treated as `0` in calculations

