

## Goal
Align all input fields uniformly across the three columns (Terms / Payments / Balances) in **Loan → Terms & Balances** so inputs start and end at the same horizontal position. Long labels should wrap to two lines instead of pushing inputs out of alignment.

## Root cause
- `LABEL_CLASS` is fixed at `w-[140px]` (correct), but many label cells override it with `min-w-fit ... whitespace-nowrap`, causing inputs to shift left/right based on label text length.
- Checkbox+label combo rows (Prepaid Payments, Impounded Payments, Funding Holdback, Accept Short Payments, Override Funds Held) also use `min-w-fit shrink-0 whitespace-nowrap`, breaking alignment.
- Result: inputs in column 1 (Terms) don't line up with columns 2 and 3, and long labels like "Estimated Balloon Payment" expand the label cell instead of wrapping.

## Changes (single file: `src/components/deal/LoanTermsBalancesForm.tsx`)

1. **Standardize all label cells to `LABEL_CLASS` (140px fixed, wrap-enabled)** — replace `min-w-fit ... whitespace-nowrap` with `LABEL_CLASS` while preserving the primary-color/cursor-pointer/underline styling for the clickable labels:
   - Other Sched. Pmts
   - To Escrow Impounds
   - Amount to Reinstate
   - Reserve Balance
   - Escrow Balance
   - Suspense Funds
   - Total Balance Due
   - Estimated Balloon Payment
   
   Build the className as `cn(LABEL_CLASS, "text-primary font-medium cursor-pointer hover:underline")` for clickable ones, and `cn(LABEL_CLASS, "text-primary font-medium")` for read-only highlighted ones.

2. **Fix checkbox+label combo rows** (Prepaid Payments, Impounded Payments, Funding Holdback, Override Funds Held, Accept Short Payments) — change wrapper div from `min-w-fit shrink-0 whitespace-nowrap` to fixed width `w-[140px] min-w-[140px] max-w-[140px] shrink-0` and remove `whitespace-nowrap` so labels wrap naturally to two lines (e.g., "Impounded Payments / Months" already stacks correctly; this just enforces fixed width).

3. **Fix Sold Rate header row** — same treatment for the inline checkbox label cell so its width matches the rest.

4. **Sold Rate sub-fields (Lenders / Origination / Vendor Company)** — these are nested under `pl-5` indentation. Reduce their label width so input right-edge still aligns with siblings: keep current `w-[120px]` (correct, since `pl-5` adds 20px → 120 + 20 = 140px total). No change needed here.

5. **Standalone "Accept Post-maturity" and "Auto-post Enabled" rows** — these are checkbox-only with no input; leave as-is (they don't affect input alignment).

6. **Helper for "Percent of Servicing Fees" caption** — its `paddingLeft` already aligns under the input; leave as-is.

## Out of scope
- No data/persistence changes
- No schema/API changes
- No behavior changes to validation, calculation, or Sold Rate logic
- Sub-navigation, modals, and click handlers remain identical

## Result
All inputs in the three columns will start at the same `x` position (label cell = exactly 140px wide) and inputs flex to fill remaining width uniformly. Long labels like "Estimated Balloon Payment" wrap to two lines within the 140px label cell instead of stretching the row.

