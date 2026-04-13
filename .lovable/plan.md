

# Lender History Table Update

## Summary
Update the Lender History table columns and data mapping to match the screenshot format, sourcing data from `loan_history` records (like the recently updated Borrower History) instead of deal-level summaries from `deal_section_values`.

## What Changes

### File: `src/components/contacts/lender-detail/LenderHistory.tsx`

**Data source change**: Replace the current deal_section_values-based approach with `loan_history` table queries (same pattern as BorrowerHistory).

**New columns** (in order):
1. Transaction Date → `loan_history.date_received` (fallback `date_due`)
2. Account Number → `deals.deal_number`
3. Address → `deals.property_address`
4. Borrower → `deals.borrower_name`
5. Status → `loan_history.payment_code` or deal status
6. Total → `loan_history.total_amount_received`
7. Principal → `loan_history.applied_to_principal`
8. Interest → `loan_history.applied_to_interest`
9. Late Fee Paid → `loan_history.applied_to_late_charges`
10. Servicing Fees → `loan_history.servicing_fees`
11. Other → `loan_history.other_amount`
12. Principal Balance → `loan_history.principal_balance`

**Header**: "Lender History" title bar with dark primary background (matching screenshot).

**Preserved**: Search, sort, pagination, export, column toggle functionality. Same toolbar layout and UI patterns.

**Styling**: Dark blue/teal header row matching screenshot. Currency values formatted as `$X.XX`. Alternating row backgrounds.

## No Database Changes
All required columns already exist on `loan_history` from the previous migration. No schema changes needed.

## What Will NOT Change
- No changes to other lender tabs (Dashboard, Portfolio, etc.)
- No changes to BorrowerHistory or BrokerHistory
- No changes to navigation, sidebar, or other components
- No changes to document generation

