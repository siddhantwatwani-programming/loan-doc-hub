

## Plan: Add Missing Property Fields to Modal and Detail View

### Summary
Add new fields to the Property Add/Edit modal and Property Detail section to match the screenshots. This involves updating the `PropertyData` interface, adding new field keys, creating field dictionary entries, and updating both the modal and detail form UIs.

### Files to Modify

1. **`src/components/deal/PropertiesTableView.tsx`** — Add new properties to `PropertyData` interface:
   - `primaryCollateral?: boolean`
   - `purchaseDate?: string`
   - `propertyGeneratesIncome?: boolean`
   - `netMonthlyIncome?: string`
   - `fromRent?: string`
   - `fromOtherDescribe?: string`
   - `valuationDate?: string`
   - `valuationType?: string`
   - `thirdPartyFullName?: string`, `thirdPartyStreet?: string`, `thirdPartyCity?: string`, `thirdPartyState?: string`, `thirdPartyZip?: string`
   - `protectiveEquity?: string`
   - `cltv?: string`

2. **`src/lib/fieldKeyMap.ts`** — Add new keys to `PROPERTY_DETAILS_KEYS`:
   - `primaryCollateral`, `purchaseDate`, `propertyGeneratesIncome`, `netMonthlyIncome`, `fromRent`, `fromOtherDescribe`, `valuationDate`, `valuationType`, `thirdPartyFullName`, `thirdPartyStreet`, `thirdPartyCity`, `thirdPartyState`, `thirdPartyZip`, `protectiveEquity`, `cltv`

3. **`src/components/deal/PropertyModal.tsx`** — UI changes:
   - Rename "Description" label → "Description (Nick Name)"
   - Add "Primary Collateral" checkbox below Description
   - Add "Purchase Information" section header below Address with: Purchase Date (date picker), Purchase Price (existing), Down Payment (existing)
   - Change "Flood Zone" from dropdown to checkbox
   - Add "Property Generates Income" checkbox below Flood Zone, then Net Monthly Income, From Rent, From Other (Describe) as currency fields
   - Add "Valuation:" section below Recording Number with: Valuation Date, Valuation Type dropdown (Broker BPO / Appraisal), Performed By dropdown (Broker / Third Party — already exists, relocate), conditional Third Party fields (Full Name, Street, City, State, ZIP Code), Protective Equity (currency), Loan to Value (% — already exists, relocate), CLTV (%)
   - Update `getEmptyProperty()`, `CURRENCY_MODAL_FIELDS`, and save logic for new fields

4. **`src/components/deal/PropertyDetailsForm.tsx`** — Mirror same UI changes as the modal:
   - Same label rename, new sections, field additions, and Flood Zone → checkbox change
   - Add Valuation section with conditional Third Party fields

5. **`src/components/deal/PropertySectionContent.tsx`** — Update `extractPropertiesFromValues` and `handleSaveProperty` to include all new field keys for persistence roundtrip.

6. **Database Migration** — Add field dictionary entries for all new keys so values persist via `deal_section_values`.

### Detailed UI Layout Changes

**Left column (Property Information) — Modal & Detail Form:**
```text
Property Details (header)
  Description (Nick Name)        [text input]
  ☐ Primary Collateral
  Address (header)
    ☐ Copy Borrower's Address
    Street / City / State / ZIP Code / County
  Purchase Information (header)
    Purchase Date                [date picker]
    Purchase Price               [$ currency]
    Down Payment                 [$ currency]
```

**Right column (Appraisal Information) — existing fields remain, changes:**
```text
  ...existing fields...
  ☐ Flood Zone                  (changed from dropdown to checkbox)
  ☐ Property Generates Income
    Net Monthly Income           [$ currency]
    From Rent                    [$ currency]
    From Other (Describe)        [$ currency]
```

**Below existing sections — Valuation section:**
```text
Valuation: (header)
  Valuation Date                 [date picker]
  Valuation Type                 [dropdown: Broker BPO, Appraisal]
  Performed By                   [dropdown: Broker, Third Party]
  If Third Party:
    Full Name / Street / City / State / ZIP Code
  Protective Equity              [$ currency]
  Loan to Value                  [% input]
  CLTV (If a Junior Lien)        [% input]
```

### Validation
- All currency fields: `$` prefix, numeric-only input, US comma formatting on blur
- Percentage fields: numeric with `%` suffix
- ZIP Code: existing `ZipInput` component
- State: existing `US_STATES` dropdown
- Date fields: `EnhancedCalendar` with MM/DD/YYYY format

### Backend Persistence
- New field dictionary entries will be created via migration for each new key
- `PropertySectionContent` extraction/save will be updated to handle all new fields
- Existing currency field handling pattern (strip commas on save, format on load) will be applied to new currency fields

