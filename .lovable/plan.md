

## Swap "%" and "Type" columns in Disbursements grid

In `src/components/deal/AddFundingModal.tsx`, the Disbursements from Lender Proceeds grid currently renders columns in this order: … Debit Through → **Type** → **Percentage (%)** → Comment. Per the request, swap them so **Percentage (%) appears before Type**: … Debit Through → **Percentage (%)** → **Type** → Comment.

### Change

Reorder three matching slots in the table (always in the same place — `<colgroup>`, `<thead>`, and `<tbody>`):

1. **`<colgroup>`** (lines 1012–1013): swap the two `<col>` widths so the percentage column (`w-[60px]`) comes before the type column (`w-[70px]`).
2. **`<thead>`** (lines 1028–1031): render the `Percentage` `<th>` (right‑aligned) before the `Type` `<th>` (left‑aligned).
3. **`<tbody>`** (lines 1063–1066): render the `row.debitPercent` cell (right‑aligned) before the `row.debitOf || row.from` cell.

### What stays exactly the same

- Column visibility logic (`disbColVisibility.type`, `showPercentageCol`), Show/Hide Columns popover order, header labels, alignment classes, cell formatting (`${row.debitPercent}%`, `row.debitOf || row.from || '-'`), data binding, sorting/filtering hooks, and every other column.
- No changes to `LenderDisbursementModal`, calculations, persistence, exports, file naming, permissions, or any other module.
- Identical behavior on empty grid, hidden‑columns states, and when the optional End Date column appears.

### Acceptance verification

- Percentage (%) column header and values appear immediately to the left of Type in the grid.
- Toggling either column from the Columns popover hides/shows only that column; the other remains in its new position.
- Grid layout, alignment, widths, and responsiveness are unchanged.
- All other rows, totals, and the rest of the modal are unaffected.

