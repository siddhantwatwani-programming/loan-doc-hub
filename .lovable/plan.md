# Update Borrower → Authorized Party Form to Match Screenshot

## Scope
Update only the `Contacts > Borrower > Authorized Party` form to match the attached layout. No schema changes, no new tables, no changes to any other form, save flow, or API.

## What Changes vs. The Current Form

| Area | Current | New (from screenshot) |
|---|---|---|
| Name column | First, Middle, Last, Capacity, Email | First, Middle, Last, **Capacity**, **Email**, **Date Authorized** (new) |
| Capacity dropdown | Attorney, CFO/CPA, Broker, Family, Bankruptcy Trustee, Other | **Corporate Officer, Attorney, Power of Attorney, Accountant / CPA, Family, Bankruptcy Trustee, Other** |
| Address column | Street, City, State, ZIP | unchanged |
| Phone column | Home, Work, Cell, Fax | unchanged |
| Preferred column | not present | **NEW 4th column** with Preferred checkbox aligned to Home, Work, Cell rows (no checkbox for Fax) |
| Send section | Payment Notification, Borrower Statement, Late Notice, Maturity Notice | **Payment Confirmation, Coupon Book, Payment Statement, Late Notice, Maturity Notice** |
| Delivery section | Email, Mail, SMS | **Online, Mail, SMS** (renamed "Delivery Options") |
| Layout (bottom row) | 3 cols: Send / Delivery / Details | 2 zones: left panel combines `Delivery Options` (Online/Mail/SMS, stacked left) with `Send` checkboxes (5 items) flowing to its right; `Details` textarea on the right |

## Field Keys (added to `BORROWER_AUTHORIZED_PARTY_KEYS`)
All persist into `contacts.contact_data` JSONB through the existing `onSave` path — no schema/dictionary work required.

```
dateAuthorized        : borrower.authorized_party.date_authorized
preferredHome         : borrower.authorized_party.preferred.home
preferredWork         : borrower.authorized_party.preferred.work
preferredCell         : borrower.authorized_party.preferred.cell
sendPaymentConfirmation : borrower.authorized_party.send_pref.payment_confirmation
sendCouponBook          : borrower.authorized_party.send_pref.coupon_book
sendPaymentStatement    : borrower.authorized_party.send_pref.payment_statement
deliveryOnline          : borrower.authorized_party.delivery.online
```

Existing keys reused unchanged: firstName, middleName, lastName, capacity, email, street, city, state, zip, phoneHome, phoneWork, phoneCell, phoneFax, sendLateNotice, sendMaturityNotice, deliveryMail, deliverySms, details.

Removed (UI-only — no DB cleanup): `sendPaymentNotification`, `sendBorrowerStatement`, `deliveryEmail`. (Old persisted values for these keys remain in JSONB harmlessly; they simply stop being rendered.)

## Implementation
Two files touched:

1. **`src/lib/fieldKeyMap.ts`** — extend `BORROWER_AUTHORIZED_PARTY_KEYS` with the 8 new entries listed above (drop the 3 deprecated ones).
2. **`src/components/deal/BorrowerAuthorizedPartyForm.tsx`** — restructure to the 4-column top row + 2-zone bottom row exactly as shown:
   - Add `Date Authorized` row in Name column using the standard `EnhancedCalendar` popover pattern (MM/dd/yyyy display, `yyyy-MM-dd` storage), per the project's date-format standard.
   - Update `CAPACITY_OPTIONS` to the new list.
   - Add 4th `Preferred` column: small heading + 3 right-aligned checkboxes vertically aligned with Home/Work/Cell rows; Fax row has no checkbox.
   - Replace bottom row with the new layout: `Delivery Options` (3 stacked checkboxes) + `Send` (5 checkboxes in a 2-col mini-grid) inside a single left panel, with `Details` textarea on the right.
   - Continue wrapping each input in `DirtyFieldWrapper` and use the existing `Checkbox`, `Select`, `Popover` patterns already used in `BorrowerBankingForm` for the date picker.

## What Is NOT Changing
- No change to `ContactBorrowerDetailLayout.tsx`, save logic, dirty tracking, permissions, RLS, or any API.
- No schema migrations, no `field_dictionary` rows, no `templates`/document-generation changes.
- No changes to any other form (Lender Authorized Party, Broker Authorized Party, Deal Borrower form, etc.).

## Acceptance
- Form layout visually matches the attached screenshot (4-col top row, Delivery Options + Send merged left panel, Details right).
- New Capacity options appear and persist.
- Date Authorized opens the standard date popover; selected date persists and re-renders MM/DD/YYYY.
- Preferred Home/Work/Cell checkboxes persist independently.
- Send: Payment Confirmation / Coupon Book / Payment Statement / Late Notice / Maturity Notice each persist as booleans.
- Delivery Options: Online / Mail / SMS each persist as booleans.
- Save uses the existing `onSave` flow; no schema or RLS changes.
