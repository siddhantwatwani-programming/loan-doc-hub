## Borrower form & Add Borrower modal updates

Scope: UI reordering and parity additions only. No schema, no API, no new persistence keys (`borrower.vesting`, `borrower.ford.1..8`, `borrower.agreement_on_file_date`, send/delivery keys are already in `BORROWER_PRIMARY_KEYS` / save layer).

### 1. `src/components/deal/BorrowerPrimaryForm.tsx`

**Delivery Options (Column 1)** — already in order Print, Email, SMS. No change.

**Agreement on File row** — reorder so the date input renders BEFORE the checkbox + label. (Currently date is first → keep, but verify checkbox sits after; current code already puts date before checkbox + label, so leave as-is.)

**Send block** — currently inside Column 2 below Mailing Address ZIP. Move it so it renders directly under the **Primary Address ZIP** (i.e., before the `Mailing Address` heading).

### 2. `src/components/contacts/CreateContactModal.tsx` (borrower branch, lines ~914–1107)

a. **Delivery Options order**: already Print, Email, SMS. No change.

b. **Agreement on File row** (lines ~993–1007): swap order so the **date input renders first**, followed by the checkbox + "Agreement on File" label, matching the BorrowerPrimaryForm layout.

c. **Send block** (lines ~1008–1015): remove from Column 1; move into Column 2 directly after the Primary Address ZIP field (before the `Mailing Address` sub-heading).

d. **Add Vesting + FORD to Column 3** — mirror BorrowerPrimaryForm:
   - Add `vesting` (Textarea) and `ford.1..8` (4 rows of Select + Input pairs using `FORD_DROPDOWN_OPTIONS`) below the Phone block in Column 3.
   - Initial form state additions (borrower branch of `getInitialForm`): `vesting: ''`, `'ford.1'..'ford.8': ''`.
   - Add `FORD_DROPDOWN_OPTIONS` constant at top of modal (copy from `BorrowerPrimaryForm.tsx`).
   - Whitelist new optional keys in `hasAtLeastOneFieldFilled` skip list only if they should not satisfy "any field filled" (vesting/ford are real fields so do NOT add to skip list).

e. **Persistence**: `handleCreate` → `crud.createContact(data)` writes `contact_data` as-is. Convert dotted modal keys to `borrower.*` namespace? Check existing path — currently borrower saves use raw keys like `address.street`, `phone.home`, `delivery_print` (without `borrower.` prefix). Vesting/FORD must save with the same convention used for read-back via `BORROWER_PRIMARY_KEYS` (`borrower.vesting`, `borrower.ford.1`). Inspect `useContactsCrud.createContact` & `ContactBorrowerDetailLayout` translation: detail layout adds `borrower.` prefix on read for keys that don't already have one. So the modal can save `vesting` and `ford.1..8` (unprefixed) and they'll be read as `borrower.vesting`, `borrower.ford.1..8` automatically.

### 3. Grid columns (`src/pages/contacts/ContactBorrowersPage.tsx`)

No new columns required — request only mentions reordering Delivery and Agreement, both of which are already represented (`delivery_print`, `delivery_email`, `delivery_sms`, `agreement_on_file`). No change unless missing — leave as-is.

### Out of scope
- No schema changes, no field_dictionary updates.
- No changes to other contact types (lender/broker).
- No changes to save/update API surface; uses existing `createContact` / `updateContact`.
