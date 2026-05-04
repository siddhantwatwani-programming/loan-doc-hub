# Property Details Consistency, Borrower-Filtered Property Owner, and Copy Borrower's Address (Modal Parity)

## Current state (verified)

- **Detail view** — `src/components/deal/PropertyDetailsForm.tsx`
  - **Property Owner** is a searchable combobox sourced from Participants. The list is derived from keys matching `^(borrower\d*)\.` (i.e. Borrower participant prefixes only, excluding `coborrower*`). Already correct per the requirement.
  - **Copy Borrower's Address** is wired to the *primary* borrower (`borrower\d+` with `is_primary === 'true'`, fallback `borrower`). On check it copies `street/city/state/zip`; on uncheck it clears them.
  - Persisted via the standard `onValueChange` → `deal_section_values` path (composite `{prefix}::{field_dictionary_id}` JSONB keys).

- **Modal view** — `src/components/deal/PropertyModal.tsx`
  - **No Property Owner field** at all (mismatch vs. detail view).
  - **Copy Borrower's Address** copies on check only — no clear on uncheck (mismatch vs. detail view).
  - The address it copies comes from `borrowerAddress` prop, which `PropertySectionContent` builds from the *legacy* `borrower.address.street/city/zip` + `borrower.state` keys. Today those keys are populated from the *first* Borrower contact's address only and not from the Participants-resolved primary borrower the detail view uses, so the two views can disagree.

- **Grid view** — `PropertiesTableView` does not display Property Owner; nothing to change there.

- **Round-trip** — `PropertySectionContent` extracts properties via `extractPropertiesFromValues` reading `${prefix}.*` and saves back via `handleSaveProperty` writing the same keys. The grid, modal, and detail form already share the same `values` map; what's missing is **Property Owner in the modal/extractor** and **a single source of truth for the borrower address used by Copy Borrower's Address**.

## Root causes

1. Modal doesn't include `propertyOwner` → Add Property + view-from-grid round-trips lose the owner. Detail view sets it under `${prefix}.property_owner` (already mapped in `fieldKeyMap.PROPERTY_DETAILS_KEYS.propertyOwner`).
2. Modal `Copy Borrower's Address` reads a stale, single-borrower source and does not clear on uncheck.
3. `PropertySectionContent`'s `borrowerAddress` prop wiring is the only way to keep modal/form aligned, but it doesn't resolve the primary Borrower from Participants the same way the detail form does.

## Changes (3 files only — no schema, no API, no UI restructure)

### 1) `src/components/deal/PropertiesTableView.tsx` (PropertyData type) — add field

Add `propertyOwner?: string` to the `PropertyData` interface so the type round-trips through extractor/modal/save without TS errors. **No table column changes.** No UI change.

### 2) `src/components/deal/PropertySectionContent.tsx`

- In `extractPropertiesFromValues`, add: `propertyOwner: values[\`${prefix}.property_owner\`] || ''`.
- In `handleSaveProperty`, add one line: `onValueChange(\`${prefix}.property_owner\`, propertyData.propertyOwner || '')`.
- Build a memoized `borrowerOptions: string[]` and `primaryBorrowerAddress: { street, city, state, zipCode }` using the same logic as `PropertyDetailsForm`:
  - Scan `values` for prefixes matching `^(borrower\d*)\.` (excludes `coborrower*`).
  - For each prefix, compose the display name from `${p}.full_name` or `${p}.first_name + last_name`.
  - Resolve primary by `${p}.is_primary === 'true'`; fallback to base `borrower` if present.
  - Read address from `${primary}.address.street|city|zip` and `${primary}.address.state` (fallback `${primary}.state`).
- Pass both `borrowerOptions` and the resolved `borrowerAddress` to `<PropertyModal />` (replacing the current legacy-key-based borrowerAddress).

### 3) `src/components/deal/PropertyModal.tsx`

- Extend `PropertyModalProps` with `borrowerOptions?: string[]`.
- Render a **Property Owner** searchable combobox in Column 1 (same Popover + Command pattern used in `PropertyDetailsForm`). Bound to `formData.propertyOwner`. If `borrowerOptions` is empty, show "No borrower found." (matches detail view UX).
- Update `handleFieldChange` for `copyBorrowerAddress`:
  - On `value === false`: clear `street/city/state/zipCode` to `''`.
  - On `value === true && !borrowerAddress` (or empty fields): no toast (modal context); just no-op silently to avoid breaking add-flow when participants haven't been entered.
  - On `value === true && borrowerAddress`: existing copy behavior (already in place).
- The "Copy Borrower's Address" label and checkbox stay in the same place — no layout change.

## Validation & non-regression

- Persistence path is unchanged (`onValueChange` + `onPersist`). No new tables or RLS work.
- `propertyOwner` is already a known UI key (`PROPERTY_DETAILS_KEYS.propertyOwner = 'property1.property_owner'`), so it round-trips through the existing dictionary save mechanism with no new field_dictionary entries needed.
- Grid/Modal/Detail will all read from and write to the same `${prefix}.property_owner` and `${prefix}.{street,city,state,zip}` keys — single source of truth in `values`.
- View-only/disabled states already cascade through the existing `disabled` prop.
- No changes to Liens, Insurance, PropertyTax, document generation, or any RLS policy.

## Files touched

- `src/components/deal/PropertyModal.tsx`
- `src/components/deal/PropertySectionContent.tsx`
- `src/components/deal/PropertiesTableView.tsx` (type field only)

## Out of scope

- Adding a Property Owner column to the grid (not requested; would change the table UI).
- Multi-borrower selector in modal beyond the searchable picker (combobox already lets the CSR pick any Borrower; primary is used implicitly for the address copy, matching the detail form).
- Any field_dictionary, RLS, or schema work.
