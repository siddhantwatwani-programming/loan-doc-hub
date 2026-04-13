

# Property Details Form — Match Screenshot Layout

## Summary
Rearrange the Property Details form from its current 2-column + separate Valuation layout to a **3-column layout** matching the screenshot, and add the new **"Information Provided By"** dropdown field.

## Changes Required

### 1. Add field_dictionary entry (migration)
Insert one new row for `pr_p_infoProvidedBy` (label: "Information Provided By", section: property, data_type: dropdown) so the field persists via the existing save flow.

### 2. File: `src/lib/fieldKeyMap.ts`
Add `informationProvidedBy: 'property1.info_provided_by'` to `PROPERTY_DETAILS_KEYS`.

### 3. File: `src/components/deal/PropertyDetailsForm.tsx`
Rearrange into a **3-column grid** matching the screenshot:

**Column 1 — Property Details:**
- Information Provided By (new dropdown: Broker, Borrower, Third Party, Other)
- Primary Property (checkbox — uses existing `primaryCollateral` key, label changed)
- Description (Nickname)
- Address block (Copy Borrower's Address, Street, City, State, ZIP, County)
- Purchase Information (Purchase Date, Purchase Price, Down Payment)

**Column 2 — Middle:**
- Property Type, Occupancy, Year Built, Square Feet, Type of Construction, Zoning
- Flood Zone (checkbox)
- Property Generates Income (checkbox) + conditional fields (Net Monthly Income, From Rent, From Other)

**Column 3 — Valuation:**
- Estimate of Value ($)
- Valuation Date, Valuation Type, Performed By
- Conditional Third Party block: Full Name, Street, City, State, ZIP, Phone, Email
- Pledged Equity ($), Protective Equity ($)
- Loan to Value (%), CLTV (If a Junior Lien) (%)

Fields currently on the form but not in the screenshot (Delinquent Taxes, Generates Monthly Income, Annual Income, Lien Protective Equity, Source of Lien Info) will be removed from the visible form layout — they remain in the database and field dictionary and are not deleted.

### 4. File: `src/components/deal/PropertySectionContent.tsx`
- Add `informationProvidedBy` to `extractPropertiesFromValues` and `handleSaveProperty`

### 5. File: `src/components/deal/PropertiesTableView.tsx` (if needed)
- Add `informationProvidedBy` to the `PropertyData` type

### 6. File: `src/components/deal/PropertyModal.tsx` (if needed)
- Add `informationProvidedBy` to modal data extraction if the modal also uses PropertyData type

## What Will NOT Change
- No database schema changes (only one field_dictionary row insert)
- No changes to save/load APIs, document generation, or other sections
- No changes to navigation, sidebar, or other property sub-tabs
- No changes to PropertyLegalDescriptionForm, PropertyInsuranceForm, etc.

