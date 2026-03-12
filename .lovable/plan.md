

# Plan: Extend Broker Detail Page with Sidebar Modules

## Overview
Replace the current flat `ContactBrokerDetailForm` detail view with a full detail page featuring a left sidebar with 11 modules. When a user clicks a broker row, they see a sidebar-driven layout instead of the current single form.

## Architecture

```text
ContactBrokersPage
├── Table View (existing, unchanged)
└── Detail View (when broker selected)
    ├── Header: Back button + Broker Name
    └── Flex container
        ├── Left Sidebar (180px, matching CSR sub-nav pattern)
        │   ├── Dashboard
        │   ├── Portfolio
        │   ├── History
        │   ├── Charges
        │   ├── Trust Ledger
        │   ├── Conversation Log
        │   ├── Banking
        │   ├── 1099
        │   ├── Authorized Party
        │   ├── Attachments
        │   └── Events Journal
        └── Main Content Area (renders selected module)
```

## Files to Create

### 1. `src/components/contacts/broker-detail/BrokerDetailSidebar.tsx`
Vertical sidebar nav with 11 items. Active item uses left accent border (matches existing CSR sub-nav style). Props: `activeSection`, `onSectionChange`.

### 2. `src/components/contacts/broker-detail/BrokerDetailLayout.tsx`
Wrapper component combining sidebar + content area. Manages active section state. Renders the correct module based on selection.

### 3. `src/components/contacts/broker-detail/BrokerDashboard.tsx`
Displays broker summary: name, ID, type, contact info, address, hold/verified/ACH status. Read-only overview cards.

### 4. `src/components/contacts/broker-detail/BrokerPortfolio.tsx`
Table with columns: Loan Account, Borrower Name, Note Rate, Lender Rate, Regular Payment, Principal Balance, Next Payment, Maturity Date, Term Left, Days Late, Percent Owned, Property Description. Supports sorting, pagination, horizontal scroll. Local state placeholder data (no schema changes allowed).

### 5. `src/components/contacts/broker-detail/BrokerHistory.tsx`
Table with columns from Excel reference: Date, Account, Reference, Principal, Interest, Default Interest, Late Fee, Prepayment Penalty, Servicing Fees, Charges, Charges Interest, Charges Reference, To Trust, From Trust. Date filter (All Dates, Month to Date, Last Month, Quarter to Date, Last Year, Custom). Local state placeholder.

### 6. `src/components/contacts/broker-detail/BrokerCharges.tsx`
Table for broker-related charge records. Columns based on existing Charges pattern. Empty state with placeholder.

### 7. `src/components/contacts/broker-detail/BrokerTrustLedger.tsx`
Table for trust ledger transactions. Matches existing Trust Ledger UI pattern (Date, Reference, From Whom, Memo, Payment, CLR, Deposit, Balance).

### 8. `src/components/contacts/broker-detail/BrokerConversationLog.tsx`
Placeholder that mirrors the deal Conversation Log component structure, filtered by Broker ID.

### 9. `src/components/contacts/broker-detail/BrokerBanking.tsx`
Form with ACH, bank details, check/mailing, credit card sections. Reuses the field layout from the existing `ContactBrokerDetailForm` Financial section, expanded with full banking fields.

### 10. `src/components/contacts/broker-detail/Broker1099.tsx`
Tax reporting form: TIN Type, TIN, Account Number, Address fields, Send 1099 checkbox, Tax Exempt checkbox.

### 11. `src/components/contacts/broker-detail/BrokerAuthorizedParty.tsx`
Table + modal for managing authorized contacts linked to the broker. Fields: Name, Email, Phone, Role/Title.

### 12. `src/components/contacts/broker-detail/BrokerAttachments.tsx`
File upload/management area. Table showing uploaded documents with name, date, type. Upload button.

### 13. `src/components/contacts/broker-detail/BrokerEventsJournal.tsx`
Reuses the Events Journal table structure, filtered by Broker ID. Shows event number, date, section, user, details.

## Files to Modify

### `src/pages/contacts/ContactBrokersPage.tsx`
- Replace the detail view section (lines 127-144) to render `BrokerDetailLayout` instead of `ContactBrokerDetailForm`
- Pass `selectedBroker` and callbacks to the new layout

## Data Persistence
Per instructions (no schema changes), all new module data uses local React state. The existing broker fields (from `ContactBroker` interface) continue working as-is.

## UI Consistency
- Sidebar: 180px width, `border-r`, items use left accent border when active (matching existing CSR sub-nav)
- Content area: `flex-1`, `p-6` padding
- Tables: Reuse existing `Table` components with `GridToolbar` pattern where applicable

