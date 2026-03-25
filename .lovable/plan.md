

# Fix: Read-Only Users Should Not Add/Delete Charges

## Problem
The Lender and Broker Charges components have "Add Charge" and "Delete" buttons that are always visible regardless of the user's read-only status. The components don't accept a `disabled` prop, and the parent layouts don't pass one.

Borrower Charges is unaffected — it's a read-only aggregation view with no add/delete actions.

## Changes

### 1. LenderCharges (`src/components/contacts/lender-detail/LenderCharges.tsx`)
- Add optional `disabled?: boolean` prop to the interface
- Hide the "Add Charge" button when `disabled` is true
- Hide the "Delete" button when `disabled` is true
- Guard `handleAddCharge` and `handleDeleteSelected` to no-op when disabled
- Hide row selection checkboxes when disabled

### 2. BrokerCharges (`src/components/contacts/broker-detail/BrokerCharges.tsx`)
- Add optional `disabled?: boolean` prop to the interface
- Same guards as LenderCharges above

### 3. ContactLenderDetailLayout (`src/components/contacts/lender-detail/ContactLenderDetailLayout.tsx`)
- Pass `disabled={isReadOnly}` to `<LenderCharges>` (line ~109)

### 4. ContactBrokerDetailLayout (`src/components/contacts/broker-detail/ContactBrokerDetailLayout.tsx`)
- Pass `disabled={isReadOnly}` to `<BrokerCharges>` (line ~151)

### 5. BrokerDetailLayout (`src/components/contacts/broker-detail/BrokerDetailLayout.tsx`)
- This secondary layout also renders `<BrokerCharges>` — need to check if it has `isReadOnly` and pass `disabled` accordingly

No other files, UI layouts, or functionality are modified.

