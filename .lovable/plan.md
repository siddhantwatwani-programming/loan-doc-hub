

# Borrower History Table Update

## Summary
Replace the current loan-level summary table in Contacts → Borrower → History with a payment-level history table matching the screenshot layout. This requires database schema changes (new columns on `loan_history`, new `loan_history_lenders` table) and a full rewrite of the `BorrowerHistory.tsx` component.

## Database Changes

### 1. Add missing columns to `loan_history`
- `description` (text) — maps to the "Description" column
- `next_due_date` (date) — maps to "Next Due Date"
- `servicing_fees` (numeric, default 0) — maps to "Servicing Fees"
- `other_amount` (numeric, default 0) — maps to "Other"
- `principal_balance` (numeric, default 0) — running principal balance after this payment
- `account_number` (text) — to display the Account Number header

### 2. Create `loan_history_lenders` table
For the expandable lender sub-rows shown in the screenshot:
- `id` (uuid, PK)
- `loan_history_id` (uuid, FK → loan_history.id ON DELETE CASCADE)
- `lender_name` (text)
- `percentage` (numeric)
- `release_date` (date)
- `status` (text) — e.g. "Pending"
- `principal_balance` (numeric, default 0)
- `created_at` (timestamptz, default now())

RLS policies: Same pattern as `loan_history` — CSRs/Admins can CRUD, external users can view via `has_deal_access` on the parent `loan_history` row's `deal_id`.

## UI Changes — `BorrowerHistory.tsx`

### 3. Replace the component
- **Remove** the current loan-level summary cards and loan-summary grid
- **New data source**: Query `loan_history` joined with `loan_history_lenders` for all deals linked to this borrower (via `deal_participants`)
- **Header bar**: Show "Account Number: {deal_number}" and "Borrower: {name}" above the table (per screenshot)
- **Table columns**: Lenders, Due Date, Date Received, Description, Next Due Date, Total, Principal, Interest, Late Fee Paid, Servicing Fees, Reserves, Other, Principal Balance
- **Column mappings**:
  - Lenders → expand/collapse arrow (▶/▼)
  - Due Date → `date_due`
  - Date Received → `date_received`
  - Description → `description` (fallback to `payment_code` or `reference`)
  - Next Due Date → `next_due_date`
  - Total → `total_amount_received`
  - Principal → `applied_to_principal`
  - Interest → `applied_to_interest`
  - Late Fee Paid → `applied_to_late_charges`
  - Servicing Fees → `servicing_fees`
  - Reserves → `applied_to_reserve`
  - Other → `other_amount`
  - Principal Balance → `principal_balance`
- **Expandable sub-rows**: Clicking the arrow expands to show lender breakdown from `loan_history_lenders` with columns: Lender, Percentage, Release Date, Status, and Principal Balance
- **Styling**: Dark blue/teal header row matching screenshot; currency values in standard format; `$0.00` styling in red for zero/special values as shown
- **Pagination**: "Items per page" selector + "X - Y of Z" display at bottom right (matching screenshot pattern)
- **Preserve**: Search, sort, filter, and export toolbar functionality

## Files Modified
1. **Migration SQL** — Add columns to `loan_history`, create `loan_history_lenders` table with RLS
2. **`src/components/contacts/borrower-detail/BorrowerHistory.tsx`** — Full rewrite to payment-level history grid with expandable lender rows

## What Will NOT Change
- No changes to other borrower detail tabs
- No changes to the deal-level `LoanHistoryViewer.tsx`
- No changes to navigation, sidebar, or other components
- No changes to document generation or APIs

