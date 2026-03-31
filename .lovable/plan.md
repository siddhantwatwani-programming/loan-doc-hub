

# Add Numeric Input Validation to Loan Terms Servicing Grid

## Summary

The Loan Terms → Servicing grid has 6 data columns. One (`lenders_split`) is already a dropdown. The remaining 5 columns are plain text inputs that need numeric validation:

- **Cost** — currency/decimal
- **Lender(s) %** — percentage/decimal
- **Borrower $** — currency/decimal
- **Borrower %** — percentage/decimal
- **Broker** — currency/decimal

## Change

**File: `src/components/deal/LoanTermsServicingForm.tsx`**

1. Import `numericKeyDown` and `numericPaste` from `@/lib/numericInputFilter`
2. Add `onKeyDown={numericKeyDown}` and `onPaste` handler to all `<Input>` elements in the grid (both the main SERVICE_ROWS loop and the custom row at the bottom) — excluding the custom label input which should remain text
3. Add `inputMode="decimal"` to these inputs for mobile keyboard support

This applies the same proven numeric filter pattern already used in OriginationFeesForm and OriginationInsuranceConditionsForm.

## What Will NOT Change
- No database, API, or schema changes
- No layout or visual changes
- No changes to the Select dropdown column
- No changes to any other file
- Existing saved string values still display (backward compatible)

