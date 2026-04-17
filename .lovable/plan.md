

## Goal
Enhance the **Lender Disbursement** modal (Add Funding → Add Disbursement) and the disbursement table inside Add Funding with: smart Payee search, calculated Amount with caps, new Maximum field, new Start Date, Debit Through dropdown w/ dynamic UI, restructured table columns, Type filter and hidden Percentage column, plus inline editable Comment with auto-save in state.

## Files to modify
1. `src/components/deal/LenderDisbursementModal.tsx`
2. `src/components/deal/AddFundingModal.tsx` (DisbursementRow type, table headers/cells, modal submit mapping, payment row handlers stay same)
3. `src/components/deal/LoanFundingGrid.tsx` (only the row mapping in `handleRowClick` to include `startDate`, `maximumAmount`, `comments`, `debitThrough` dropdown selection — payee/comments persist via the existing `disbursements` JSONB save path; no schema change)

No new tables, no schema changes. Persistence reuses the existing `disbursements` array on the funding record (already JSONB).

## 1. LenderDisbursementModal.tsx changes

**Form data additions:**
- `maximumAmount: string` (after Minimum, currency, optional)
- `startDate: string` (date, accepts past/future)
- `comments: string` (carried for table inline edit, but modal does not need to show it; keep field on form for round-trip)
- `calculatedAmount: string` (computed read-only, stored final capped value)

**Smart Payee search:**
- Replace current `AccountIdSearch` with same component but increase debounce to 500ms — update `AccountIdSearch.tsx` debounce from 300 → 500 (only one numeric change).
- On selection, autofill `accountId` and `name` (already wired).

**Calculation block (live):**
- Need `lenderShare` values for Payment / Interest / Principal — pass three numbers as new props from `AddFundingModal`:
  - `paymentShare` = `formData.regularPayment` (lender share of monthly payment)
  - `interestShare` = principalBalance × lenderRate / 12 / 100
  - `principalShare` = paymentShare − interestShare
- Formula: `base = shareForType(debitOf); calc = base * (debitPercent/100) + plus; if(min) calc = max(calc, min); if(max) calc = min(calc, max);`
- Show a small read-only "Calculated Amount" line under Minimum/Maximum.
- Store `calculatedAmount` in form data on every change → flows to row.

**New Maximum field:** placed right after Minimum (same currency input pattern, `formatCurrencyDisplay` on blur).

**Debit Through section:**
- Add **Start Date** field (Popover + EnhancedCalendar, MM/DD/YYYY display, accepts past/future).
- Convert Debit Through from radio group → Select dropdown with options: Date, Amount, Number of Payments, Payoff.
- Below the dropdown, render only the field matching the selection:
  - Date → date picker
  - Amount → currency input
  - Number of Payments → numeric input
  - Payoff → no extra field
- Keep storing the existing `debitThrough` / `debitThroughDate` / `debitThroughAmount` / `debitThroughPayments` keys (no schema change).

**Validation (block Save when invalid):**
- Payee required, debitOf (Type) required, debitPercent ≥ 0, startDate required & valid, debitThrough selection required.
- If both Minimum and Maximum present → Min ≤ Max (inline error).

## 2. AddFundingModal.tsx changes

**`DisbursementRow` interface:** add `maximumAmount: string` and rename intent for `startDate` (already exists, now used). `comments` already exists.

**Pass new props to `LenderDisbursementModal`:**
- `paymentShare`, `interestShare`, `principalShare` — derived inside AddFundingModal from `regularPayment`, `principalBalance`, `lenderRate`.

**`handleDisbursementModalSubmit`:** map all new fields including `startDate`, `maximumAmount`, `calculatedAmount` → row.amount.

**Table (inside Add Funding):** restructure columns per spec:
| Column | Source |
|---|---|
| Account ID | `row.accountId` |
| Name | `row.name` |
| Amount | `row.amount` (final calculated) |
| Debit Through | dynamic display: date / `$amount` / `N Payments` / `Payoff` |
| Type | `row.debitOf` (renamed from "From") |
| Comment | inline `<Input>` editable, `onChange` updates row in state (auto-save in modal form, persisted on Save Funding) |

- Remove "Debit %", "Debit Of", "Plus", "Minimum", "From" columns from default table.
- Add "Percentage" column hidden by default, shown via existing `ColumnConfigPopover` pattern… but this table is a simple inline `<table>`, not `useTableColumnConfig`. **Simpler approach:** add a small toggle button "Show %" beside the "Add Disbursement" button that flips a local `showPercentage` boolean; when true, render an extra `Percentage` column showing `row.debitPercent + '%'`. Matches "Hidden by default, available in column filter, show when enabled" intent without restructuring the inline table.

## 3. LoanFundingGrid.tsx — `handleRowClick` mapping
Add the new fields when rebuilding `disbursements` for editing:
- `startDate`, `maximumAmount`, `comments` (already there), and pass through.
No other changes here.

## 4. AccountIdSearch.tsx
- Change debounce from `300` → `500` ms (one literal). Component already returns `(accountId, name)`, used everywhere.

## Persistence
- All new fields ride inside the existing `disbursements: JSONB[]` column on the funding record.
- Save uses the existing `onSubmit → onAddFunding / onUpdateRecord` flow — no API/schema change.
- Inline Comment changes update local row state; persisted when user clicks Save Funding (auto-save within the modal session — no separate save button per spec).

## Out of scope
- No history/random-payment recalcs.
- No changes to lender funding calculations, rate selection, broker/company fee blocks.
- No DB migration.

## Visual reference match
- Modal layout stays close to current (image-349) with: Payee, Name, Debit __% of [Type], Plus, Minimum, **Maximum (NEW)**, **Start Date (NEW)**, Debit Through [Dropdown] + dynamic field, plus a small read-only "Calculated Amount" footer line.
- Table matches image-348 column order: Account ID · Name · Start Date · Amount · Debit Through · Type · Comment · (Percentage hidden) · edit/delete.

