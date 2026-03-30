

# Multi-Capacity Loan Display in Borrower Portfolio

## Problem

Line 78 of `BorrowerPortfolio.tsx` filters participants with `.eq('role', 'borrower')`, so loans where the contact is linked as a lender or broker are invisible. Additionally, capacity resolution relies only on `deal_section_values` participant data, missing the capacity stored in `contact_data` during the Add Participant flow. There is no way to see who else is on a loan.

## Solution

Two changes to `BorrowerPortfolio.tsx` only:

### 1. Remove the role filter to show all linked loans

Change line 78 from:
```
.eq('role', 'borrower')
```
to fetching ALL participants for this `contact_id` (remove the `.eq('role', 'borrower')` call). This ensures loans where the contact is an Additional Guarantor, Trustee, etc., all appear.

Update capacity resolution to also check `contact_data.capacity` from the `contacts` table via `deal_participants` data, and fall back to the participant's `role` field when no capacity is found in section values.

### 2. Add info icon per row showing all parties on that loan

After fetching the contact's own participant rows, collect all `deal_id`s, then make one additional query to `deal_participants` for ALL participants across those deals. For each loan row, group participants by their capacity/role into a structured map.

Add a non-sortable utility column at the end of each row with a `Users` icon. Clicking it opens a `Popover` (already imported) showing participants grouped by capacity:

```
Borrower(s): Rakesh Kumar
Additional Guarantor(s): Mohan Singh
Lender(s): ABC Lending
```

If no other participants exist, the popover shows "No other participants."

### Technical Details

**File**: `src/components/contacts/borrower-detail/BorrowerPortfolio.tsx`

1. **Extend `PortfolioLoan` interface** — add `participants: { name: string; capacity: string }[]`

2. **Remove `.eq('role', 'borrower')` on line 78** — fetch all deal_participants for this contact_id regardless of role

3. **Capacity resolution enhancement** — after getting participant section values, also check the contact's `contact_data.capacity` field from the contacts table for each deal's participant record. Priority: section values capacity > contact_data capacity > role name fallback.

4. **Fetch all participants per deal** — one additional query: `deal_participants` where `deal_id in dealIds`, selecting `deal_id, name, role, contact_id`. Also fetch their contact records to get `contact_data.capacity`. Group by deal_id into a map.

5. **Add info column** — append a `Users` icon `TableCell` after the last column in each row. Not part of `ALL_COLUMNS` (non-toggleable, non-sortable). Clicking opens a `Popover` with participants grouped by capacity label.

6. **Import `Users` from lucide-react** (already available in the project).

### What Will NOT Change
- No database schema changes or migrations
- No changes to existing columns, summary cards, filters, sorting, or export logic
- No changes to the Add Participant modal or participant assignment flow
- No layout or sidebar changes
- No changes to other portfolio components (Lender, Broker)

