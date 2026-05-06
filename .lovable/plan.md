
## Goal

Strengthen the Lien Management module in CSR → Property → Liens by adding a complete **lien calculation engine** (priority sort, payoff distribution, senior/junior classification, equity totals) and tightening UI behavior for the **Anticipated** and **Existing** dropdowns — without changing the database schema, save APIs, or document generation flow.

All persistence will use the existing `lien{N}.*` JSONB key model in `deal_section_values` via `onValueChange` + `onPersist`. No new tables, no schema changes.

## What Already Exists (Preserve)

- `LienDetailForm.tsx` — form with `Anticipated` dropdown ("This Loan" / "Other") and `Existing` dropdown ("Payoff" / "Paydown" / "Remain"); the latter already auto-computes `newRemainingBalance` on change.
- `LienSectionContent.tsx` — extracts liens via `lien{N}.*` keys, scopes to current property, enforces single "This Loan" per property, persists via `onPersist`.
- `LiensTableView.tsx` — grid with sort/filter/pagination.
- `LienModal.tsx` — add/edit modal.

These remain intact.

## Changes

### 1. New utility: `src/lib/lienCalculationEngine.ts`

Pure, deterministic helpers (no React, no I/O). Inputs are the in-memory `LienData[]` for one property plus `propertyValue`. Outputs are computed values written back via `onValueChange`.

```text
parsePriority(input)  -> number   // "1st"/"2"/"3rd" -> 1,2,3
formatOrdinal(n)      -> string   // 1 -> "1st"
getRemainingBalance(lien) -> number
  Payoff   -> 0
  Paydown  -> max(0, currentBalance - paydownAmount)
  Remain   -> currentBalance
  This Loan / Other (no Existing) -> anticipatedAmount || newRemainingBalance

distributePayoff(liens, propertyValue)
  // sorts by priorityNow asc, walks liens, assigns paidAmount / balanceAfter
  // returns map: lienId -> { paidAmount, balanceAfter, priorityAfter }

classify(liens, thisLoanLien)
  // senior  = priorityNow < thisLoanLien.priorityNow
  // junior  = priorityNow > thisLoanLien.priorityNow

computeEquity(liens, propertyValue, thisLoanLien)
  protectiveEquity = propertyValue - sum(seniorLiens.remainingBalance)
  totalEquity      = propertyValue - sum(allLiens.remainingBalance)
```

### 2. UI wiring in `LienDetailForm.tsx`

Minimal additions (no removals, no layout changes):

- **Anticipated** dropdown: when set to "This Loan", auto-set `thisLoan = 'true'` (existing logic continues to autofill account/balanceAfter/regularPayment from loan terms). When set to "Other", clear `thisLoan`.
- **Existing** dropdown — extend the existing `onValueChange` handler so:
  - Paydown amount input: cap value at `currentBalance` on blur (toast if exceeded), recompute `newRemainingBalance`.
  - When Existing is `Payoff` or unset, disable Paydown Amount input (already partially handled, formalize with `forceDisabled`).
  - When `currentBalance` changes and Existing = Remain/Paydown, recompute `newRemainingBalance` automatically.
- **Lien Priority After**: switch from manual input to read-only computed value sourced from `distributePayoff(...)`. Persisted under existing key `lien{N}.lien_priority_after`.
- **Delinquency / "Will Be Paid By This Loan"** behavior: source-of-payment input becomes required and visible only when `paidByLoan === 'false'` (already conditional, formalize disabled state).

### 3. Calculation orchestration in `LienSectionContent.tsx`

Add a `useEffect` that, whenever `liensForProperty` or property value changes:

1. Reads property value from `values[`property{currentPropertyId}.value`]` (existing key — verified in current values map).
2. Calls `distributePayoff(liensForProperty, propertyValue)`.
3. For each lien with a changed `priorityAfter` / `balanceAfter`, calls `onValueChange(`${lien.id}.lien_priority_after`, ordinal)` and `onValueChange(`${lien.id}.balance_after`, formatted)`.
4. Computes `protectiveEquity` and `totalEquity`, writes to existing summary keys (e.g. `liens.protective_equity`, `liens.total_equity`) — these flow through the same `deal_section_values` JSONB used today, so document generation tags continue to resolve.

The effect is gated by a deep-equality check to prevent save loops, and writes are batched in a single `flushSync` followed by the existing `onPersist`.

### 4. Table view (`LiensTableView.tsx`)

- Add **Anticipated** column (already in `LienData` — just expose in `DEFAULT_COLUMNS`/`renderCellValue`) showing "This Loan" / "Other".
- Fix `balanceAfter` cell which currently shows `lienPriorityAfter` (clear bug — replace with `formatCurrency(lien.balanceAfter)`).
- Add summary row: Property Value | Senior Liens Total | Protective Equity | Total Equity (read-only, computed).

### 5. Validation guards (toasts only, no blocking)

- Duplicate "This Loan" per property — already enforced; keep.
- Paydown > Current Balance — clamp to current balance with toast.
- Priority Now must be unique per property — toast warning (non-blocking) if collision.

## Technical Notes

- **Persistence path**: every computed value is written through the existing `onValueChange(key, value)` → `useDealFields` → `deal_section_values` upsert. No new save endpoint.
- **Field keys reused** (already in `LIEN_FIELD_MAP`): `lien_priority_after`, `balance_after`, `new_remaining_balance`, `existing_payoff/paydown/remain`, `anticipated`, `anticipated_amount`, `paid_by_loan`, `source_of_payment`.
- **Document generation**: untouched. The same lien JSONB keys feed RE851D/RE885 publishers. Computed totals (`liens.protective_equity`, `liens.total_equity`) become available as merge tags automatically because they go through the same field-value pipeline.
- **Reload behavior**: because everything persists through the standard pipeline, refresh restores all fields and recomputes derived values on mount via the same `useEffect`.

## Files Modified

```text
src/lib/lienCalculationEngine.ts          (NEW)
src/components/deal/LienDetailForm.tsx    (wire dropdowns, read-only Priority After)
src/components/deal/LienSectionContent.tsx (orchestration effect, equity writes)
src/components/deal/LiensTableView.tsx    (Anticipated column, balanceAfter fix, summary row)
```

No DB migrations. No edits to: `supabase/functions/generate-document/index.ts`, `LienModal.tsx`, `field_dictionary`, `client.ts`, `types.ts`.

## Acceptance

1. Adding a lien with Anticipated="This Loan" auto-fills loan number / amount / payment from Loan Terms; only one allowed per property (already true; verified).
2. Existing=Payoff → Remaining Balance = 0; =Remain → equals Current Balance; =Paydown → Current − Paydown (clamped).
3. Setting `Lien Priority Now` triggers a recompute that fills `Lien Priority After` and `Balance After` for every lien on the property based on payoff distribution.
4. Senior vs Junior derived from "This Loan" priority; Protective Equity and Total Equity displayed in the table summary row and persisted.
5. Refresh restores every entered and computed field; document generation continues to resolve `pr_li_*` and `ln_p_*` tags using the same stored values.
