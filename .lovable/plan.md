# Contacts > Borrower — Additional Guarantor + Authorized Party

## Scope (strictly limited)

Two changes only, all other functionality, schema, APIs, and styles untouched.

### 1. Add "Additional Guarantor" sidebar entry above "Authorized Party"

File: `src/components/contacts/borrower-detail/BorrowerDetailSidebar.tsx`
- Extend the `BorrowerSection` union with `'additional-guarantor'`.
- Insert `{ id: 'additional-guarantor', label: 'Additional Guarantor', icon: UserCheck }` in the `SECTIONS` array immediately before the existing `authorized-party` row (use the existing `Users` or `UserPlus` icon from lucide-react to differentiate).

File: `src/components/contacts/borrower-detail/ContactBorrowerDetailLayout.tsx`
- Add a new `case 'additional-guarantor':` in `renderContent()` that renders the existing `BorrowerAdditionalGuarantorForm` with the standard props (`fields={emptyFields}`, `values`, `onValueChange={handleValueChange}`, `disabled={isReadOnly}`).
- The `NON_BORROWER_PREFIXES` array already includes `'borrower.guarantor.'`, so persistence through `onSave` works without any other change.

No new component is created — the existing `BorrowerAdditionalGuarantorForm` (which already matches the screenshot column layout exactly: Name | Primary Address | Phone | Preferred + Delivery / Send + Borrower Type legend) is simply mounted in the contact view.

### 2. Rebuild the Authorized Party form to match the screenshot layout

File: `src/components/deal/BorrowerAuthorizedPartyForm.tsx`

Refactor the JSX (only the JSX — file imports, hooks, and persistence logic stay) to mirror the column structure used by `BorrowerAdditionalGuarantorForm`:

- **Column 1 — Name**: Borrower ID, Borrower Type (dropdown), Full Name (If Entity, Use Entity), First (If Entity, Use Signer), Middle, Last, Capacity, Email, Tax ID Type (dropdown: 0 - Unknown / 1 - EIN / 2 - SSN), TIN, Issue 1098 (checkbox), Date Authorized (existing EnhancedCalendar — preserved).
- **Column 2 — Primary Address**: Street / City / State / ZIP. Below it **Mailing Address** with "Same as Primary" checkbox, Street / City / State / ZIP. Below it **Delivery**: Online, Mail.
- **Column 3 — Phone**: Home, Home (2nd), Work, Cell, Fax. Below it **Send**: Payment Notification, Borrower Statement, Late Notice, Maturity Notice. Below it **FORD**: 4 dropdown + free-text rows.
- **Column 4 — Preferred**: a checkbox aligned to each phone row.
- Right-side **Borrower Type** legend (read-only list) and **Tax ID Type** legend (read-only) shown to the right of the grid (matches screenshot).
- Existing fields (firstName, middleName, lastName, capacity, email, dateAuthorized, address, phones, preferred*, send*, delivery*, details) are reused with their current `BORROWER_AUTHORIZED_PARTY_KEYS` mappings.
- Bottom **Details** textarea is preserved.

File: `src/lib/fieldKeyMap.ts`
- Extend `BORROWER_AUTHORIZED_PARTY_KEYS` with the new keys required by the new layout. All keys use the `borrower.authorized_party.*` prefix so they are persisted by the existing save flow without schema changes:
  - `borrowerId`, `borrowerType`, `fullName`, `taxIdType`, `tin`, `issue1098`
  - `primaryStreet/City/State/Zip` (alias of existing street/city/state/zip retained)
  - `mailingSameAsPrimary`, `mailingStreet/City/State/Zip`
  - `phoneHome2`, `preferredHome2`, `preferredFax`
  - `sendPaymentNotification`, `sendBorrowerStatement`
  - `ford1`–`ford8`

Existing keys already present (firstName, middleName, lastName, capacity, email, dateAuthorized, deliveryOnline, deliveryMail, deliverySms, sendPaymentConfirmation, sendCouponBook, sendPaymentStatement, sendLateNotice, sendMaturityNotice, preferredHome/Work/Cell, address.*, phone.*) remain unchanged.

## What is NOT changed

- `BorrowerAdditionalGuarantorForm` itself (used as-is).
- Database schema, RLS, edge functions, document templates, document generation flow.
- The deal-level (CSR) `ContactBorrowerSubNav` (already lists Additional Guarantor — untouched).
- Save / update API: persistence flows through the existing `onSave` in `ContactBorrowerDetailLayout`, which already handles the `borrower.guarantor.*` and `borrower.authorized_party.*` prefixes.
- All other borrower forms, banking, 1098, trust ledger, attachments, dashboards.

## Acceptance

- Contacts > Borrower sidebar shows "Additional Guarantor" directly above "Authorized Party".
- Selecting it renders the existing Additional Guarantor form; values persist on Save.
- Selecting "Authorized Party" shows the redesigned form whose column structure matches the attached screenshot (Name / Primary + Mailing Address / Phone / Preferred + Delivery, Send, FORD, Details, plus Borrower Type & Tax ID Type legends).
- All Authorized Party fields persist using the existing contact save API under `borrower.authorized_party.*` keys.
