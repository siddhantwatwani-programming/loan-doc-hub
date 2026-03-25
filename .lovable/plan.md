

# Fix: Borrower History Grid — Remove Click Navigation

## Problem
The Borrower History table rows are clickable (`cursor-pointer`, `onClick` navigates to `/deals/:dealId`). The requirement is that this grid should **not** be clickable.

Data population is already working — the component fetches from `deal_participants`, `deals`, and `deal_section_values` on mount. No backend or persistence changes are needed.

## Changes

### `src/components/contacts/borrower-detail/BorrowerHistory.tsx`

1. **Remove `handleRowClick` function** (line 388-390) and the `useNavigate` import
2. **Remove click behavior from `<TableRow>`** (line 547-550): Remove `className="cursor-pointer hover:bg-muted/60"` and `onClick={() => handleRowClick(r)}`, replace with a plain `<TableRow key={r.id}>`

No other files, components, APIs, or schema are modified.

