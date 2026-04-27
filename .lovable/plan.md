## Goal

Restructure the **Borrower → Authorized Party** form to match the attached screenshot exactly. Persist via existing `deal_section_values` JSONB save flow (no new tables, no schema changes).

## Layout target (from screenshot)

Two stacked bands inside the existing card:

```text
┌───────────────────────────────────────────────────────────────────────────────────┐
│ Band 1: 4 columns                                                                 │
│ ┌─────────────────┬─────────────────┬───────────────────────┬──────────┐          │
│ │ Name            │ Address         │ Phone                 │ Preferred│          │
│ │  First [____]   │  Street [____]  │  Home [_________]     │   [ ]    │          │
│ │  Middle [____]  │  City   [____]  │  Work [_________]     │   [ ]    │          │
│ │  Last  [____]   │  State  [▼]     │  Cell [_________]     │   [ ]    │          │
│ │  Capacity [▼]   │  ZIP    [____]  │  Fax  [_________]     │          │          │
│ │  Email [____]   │                 │                       │          │          │
│ │  Date Auth [📅] │                 │                       │          │          │
│ └─────────────────┴─────────────────┴───────────────────────┴──────────┘          │
│                                                                                   │
│ Band 2: 3 columns                                                                 │
│ ┌────────────────────┬────────────────────────────────┬──────────────────────┐    │
│ │ Delivery Options:  │ Send                           │ Details              │    │
│ │  [ ] Online        │  [ ] Payment Confirmation      │  ┌──────────────┐    │    │
│ │  [ ] Mail          │  [ ] Coupon Book               │  │              │    │    │
│ │  [ ] SMS           │  [ ] Payment Statement         │  │  (textarea)  │    │    │
│ │                    │  [ ] Late Notice               │  └──────────────┘    │    │
│ │                    │  [ ] Maturity Notice           │                      │    │
│ └────────────────────┴────────────────────────────────┴──────────────────────┘    │
└───────────────────────────────────────────────────────────────────────────────────┘
```

## Changes to existing form

Edit only `src/components/deal/BorrowerAuthorizedPartyForm.tsx`. No file additions, no key map changes, no save-flow changes.

### Remove from rendering (keys remain in `BORROWER_AUTHORIZED_PARTY_KEYS` for backward compatibility / no schema impact)
- Borrower ID, Borrower Type, Full Name fields
- Tax ID Type, TIN, Issue 1098
- Entire **Mailing Address** block + "Same as Primary" checkbox (and its sync `useEffect` / handler)
- Home2 phone row
- FORD section (8 dropdowns/inputs)

### Keep / restructure
- **Name column**: First, Middle, Last, Capacity (dropdown), Email, Date Authorized (date picker — uses existing `EnhancedCalendar`)
- **Address column**: Street, City, State (dropdown via `STATE_OPTIONS`), ZIP — labels use `min-w-[60px]`
- **Phone column**: Home, Work, Cell, Fax (4 rows only — drops Home2)
- **Preferred column**: 3 checkboxes aligned with Home/Work/Cell rows; Fax row has empty spacer (matches screenshot — no checkbox next to Fax)
- **Delivery Options**: Online, Mail, SMS (add SMS using existing `deliverySms` key already in the map)
- **Send**: Payment Confirmation, Coupon Book, Payment Statement, Late Notice, Maturity Notice (uses existing `sendPaymentConfirmation`, `sendCouponBook`, `sendPaymentStatement`, `sendLateNotice`, `sendMaturityNotice` keys — all already present)
- **Details**: existing textarea, moved to be the 3rd column of Band 2 instead of full-width below

### Capacity dropdown
Already matches screenshot exactly: Corporate Officer, Attorney, Power of Attorney, Accountant / CPA, Family, Bankruptcy Trustee, Other. No change.

## Persistence

- All field bindings continue to use `BORROWER_AUTHORIZED_PARTY_KEYS` and `onValueChange` → existing `deal_section_values` save pipeline.
- No keys added or removed from the map.
- Removed UI fields: their keys stay in the map; if any historical values exist in JSONB they remain untouched (per minimal-change policy).

## Out of scope

- No changes to `fieldKeyMap.ts`, sidebar, layout wrapper, save APIs, Additional Guarantor form, or any document templates.
- No new database tables, columns, or migrations.
- No styling changes to the surrounding card / section header.

## Files touched

- `src/components/deal/BorrowerAuthorizedPartyForm.tsx` (only)
