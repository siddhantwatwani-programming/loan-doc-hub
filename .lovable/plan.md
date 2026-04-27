# Plan: Participant Capacity Removal + Borrower Form Updates

## 1. Remove Capacity dropdown from Add Participant (all types)

**File:** `src/components/deal/AddParticipantModal.tsx`

- Delete the entire "Capacity Dropdown" JSX block (lines ~414–429) so it no longer renders for any participant type.
- Remove the `CAPACITY_OPTIONS` constant (lines ~71–88) — no longer referenced.
- Keep the existing `capacity` state and the `resolvedCapacity = capacity || EXTENDED_TYPE_LABELS[type] || type` fallback so persistence still writes a sensible value (capacity will simply default to the extended type label / participant type). No save/update API changes.
- Keep the `setCapacity('')` resets so behavior is unchanged.

No DB / API / schema changes.

## 2. Update deal Borrower form per screenshot annotations

**Files (apply identical edits to all three so the screenshot's "Co-borrower and Additional Guarantor screens should be identical to Borrower screen" rule holds):**

- `src/components/deal/BorrowerPrimaryForm.tsx`
- `src/components/deal/CoBorrowerPrimaryForm.tsx`
- `src/components/deal/BorrowerAdditionalGuarantorForm.tsx`

### Field changes

| Change | Action |
|---|---|
| Rename "Full Name" → "Entity Name - If Applicable" | Update the `<Label>` text only; field key (`fullName`) unchanged |
| Add "Capacity" dropdown | New `InlineField` bound to existing `FIELD_KEYS.capacity` using a `Select` with the options below |
| Add SMS to Delivery | Already present in BorrowerPrimaryForm; verify and add to Co-borrower & Additional Guarantor if missing |
| Remove "Credit Score" | Delete the `InlineField` for `creditScore` |
| Remove "Hold" checkbox | Delete the Hold checkbox block |
| Remove "ACH" checkbox | Delete the ACH checkbox block |
| Remove "Tax ID Type" dropdown | Delete the Tax ID Type `InlineField` and its `TAX_ID_TYPE_OPTIONS` constant |
| Remove "TIN" input | Delete the TIN `InlineField` |
| Remove "TIN Verified" checkbox | Delete the TIN Verified block (TIN/EIN now lives on the 1098 tab — already implemented) |
| Fax: remove "Preferred" radio | In the `phoneRows` array, drop the Fax row's preferred-radio rendering (keep the Fax phone input). Simplest: filter Fax out of the Preferred RadioGroup column while still rendering it in the Phone column |

### Capacity dropdown options (per screenshot)

```
Trustee, Successor Trustee, Authorized Signer, President, CEO,
Power of Attorney, Member, Manager, Partner, Attorney
```

Place the new "Capacity" `InlineField` directly under "Borrower Type" (Column 1), matching the screenshot's red arrow.

### Persistence

All affected fields (`capacity`, `fullName`, `deliverySms`, etc.) already exist in `BORROWER_PRIMARY_KEYS` / `BORROWER_GUARANTOR_KEYS` and the co-borrower equivalent in `src/lib/fieldKeyMap.ts`, and are already routed through the existing `onValueChange` save pipeline. Removing UI for `creditScore`, `hold`, `ach`, `taxIdType`, `tin`, `tinVerified` simply hides them — no schema change, no key-map change, existing values stay in `deal_section_values` untouched.

## Out of scope (per minimal-change policy)

- No changes to APIs, edge functions, document generation, or DB schema.
- No changes to other participant types' forms (Lender, Authorized Party, etc.) beyond the Add-Participant Capacity removal.
- No changes to the contact-level (`ContactBorrowerDetailForm`) screen.
