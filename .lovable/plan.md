

# US Currency & Percentage Formatting in Loan → Servicing Grid

## Summary
Add onBlur/onFocus formatting to the Cost, Lender %, Borrower $, and Borrower % columns in `LoanTermsServicingForm.tsx`. No changes to the Broker column or any other file.

## Approach
Use the existing `formatCurrencyDisplay` / `unformatCurrencyDisplay` from `numericInputFilter.ts`, and add a new `formatPercentageDisplay` / `unformatPercentageDisplay` helper pair to that same utility file.

## Changes

### 1. `src/lib/numericInputFilter.ts` — Add percentage formatting helpers

```typescript
export const formatPercentageDisplay = (value: string): string => {
  if (!value) return '';
  const num = parseFloat(value.replace(/,/g, ''));
  if (isNaN(num)) return '';
  return num.toFixed(2);
};

export const unformatPercentageDisplay = (value: string): string => {
  return value.replace(/%/g, '').trim();
};
```

### 2. `src/components/deal/LoanTermsServicingForm.tsx` — Add formatting behavior

**Imports**: Add `formatCurrencyDisplay`, `unformatCurrencyDisplay`, `formatPercentageDisplay`, `unformatPercentageDisplay`.

**Column classification**: Define which columns are currency (`cost`, `borrower_amount`) and which are percentage (`lender_percent`, `borrower_percent`).

**Input changes** (for both the main rows and the custom row):
- Currency columns (`cost`, `borrower_amount`):
  - Display: prefix `$` via absolute-positioned span, add `pl-4` padding
  - `onFocus`: unformat (strip commas) for editing
  - `onBlur`: format with commas + 2 decimals
  - `text-right` alignment
  - Empty stays empty (no auto-fill)

- Percentage columns (`lender_percent`, `borrower_percent`):
  - Display: suffix `%` via absolute-positioned span, add `pr-5` padding
  - `onFocus`: unformat (strip %)
  - `onBlur`: format to 2 decimal places
  - `text-right` alignment
  - Empty stays empty

- Broker column: no changes whatsoever
- Lenders Split column: no changes (remains Select dropdown)

### What Will NOT Change
- No API, database, or schema changes
- No changes to Broker column
- No changes to any other component or file beyond the two listed

