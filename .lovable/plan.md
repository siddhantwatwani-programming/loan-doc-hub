## Goal
Bring Enter File Data → Property → **Property Details** screen in line with the attached reference image, without changing schema or save APIs. New fields persist through the existing field-dictionary–driven save flow.

## Gap analysis vs. attached image

Current `src/components/deal/PropertyDetailsForm.tsx` already has most layout. Missing / different from spec:

1. **Fire Zone** checkbox — not present. Should sit in column 2 right after Flood Zone.
2. **Pledged Equity** currency field — not present. Should sit in column 3 above Protective Equity.
3. **Net Monthly Income** — currently hidden behind a "Property Generates Income" checkbox. Spec shows it as an always-visible currency field in column 2 directly under Fire Zone.
4. **Zoning** — currently a free-text input. Spec shows it as a dropdown using the Zoning reference list.
5. **Type of Construction options** — currently `['Wood/Stucco', 'Stick', 'Concrete Block']`. Spec list: `Wood Frame`, `Wood Frame / Stucco`, `Modular`, `Steel Frame`, `Brick / Block`, `NA`.
6. **Property Type options** — currently missing `Commercial Income`, and has a single `Land` entry instead of the 4 land subtypes (`Land SFR Residential`, `Land Residential`, `Land Commercial`, `Land Income Producing`). Spec list: `SFR 1-4`, `Multi-family`, `Condo / Townhouse`, `Mobile Home`, `Commercial`, `Commercial Income`, `Mixed-use`, `Land SFR Residential`, `Land Residential`, `Land Commercial`, `Land Income Producing`, `Farm`, `Restaurant / Bar`, `Group Housing`.
7. **Zoning options** (new dropdown): `R1 SFR`, `R2 SFR`, `R3 Multi-family`, `R-M Multi-family`, `PUD`, `Residential Lot / Parcel`, `Mixed Use`, `C Commercial`, `Agriculture`, `NA`.
8. **Occupancy** — already corrected to spec values in prior task. Leave as-is.
9. **Third Party panel** (Full Name / Street / City / State / ZIP / Phone / Email) — already present, conditionally rendered when Performed By = "Third Party". Leave as-is.
10. **Land Classification** sub-row in column 1 — leave as-is (existing functionality, not removed by spec).

Everything else (Information Provided By, Primary Property, Description, Property Owner, Copy Borrower's Address + address fields, County, Purchase Date / Price / Down Payment, Estimate of Value, Valuation Date / Type, Performed By, Protective Equity, LTV, CLTV) already matches the spec.

## Changes

### A. UI — `src/components/deal/PropertyDetailsForm.tsx` (single file)

1. Replace `CONSTRUCTION_TYPES` constant with the 6-value spec list.
2. Replace `PROPERTY_TYPE_OPTIONS` with the 14-value spec list.
3. Add new `ZONING_OPTIONS` constant with the 10-value spec list.
4. In column 2 JSX:
   - Change Zoning from `renderInlineField` to `renderInlineSelect(FIELD_KEYS.zoning, 'Zoning', ZONING_OPTIONS, 'Select...')`.
   - Immediately after the Flood Zone checkbox, add `renderCheckboxField(FIELD_KEYS.fireZone, 'Fire Zone')`.
   - Replace the conditional `Property Generates Income` block with an unconditional `renderCurrencyField(FIELD_KEYS.netMonthlyIncome, 'Net Monthly Income')` (per spec — only Net Monthly Income is shown; the From Rent / From Other sub-fields and the toggle checkbox are removed from this screen but their existing field keys are left untouched in `fieldKeyMap.ts` so any other consumers/templates continue to work).
5. In column 3 JSX, insert `renderCurrencyField(FIELD_KEYS.pledgedEquity, 'Pledged Equity')` directly above the Protective Equity row.

### B. Field key map — `src/lib/fieldKeyMap.ts`

Add two new entries to `PROPERTY_DETAILS_KEYS`:
- `fireZone: 'property1.fire_zone'`
- (Pledged Equity already mapped as `pledgedEquity: 'property1.pledged_equity'` — reuse.)

No removals.

### C. Persistence — field_dictionary rows (data, not schema)

Per existing rule "Data persistence is strictly governed by field_dictionary entries; missing UI keys are skipped", insert the missing dictionary rows so the existing save/update API persists the new values. This is a data INSERT against the existing `field_dictionary` table — no schema change, no new table.

Migration adds two rows:

| field_key | canonical_key | section | form_type | data_type |
|---|---|---|---|---|
| `property1.fire_zone` | `pr_p_fireZone` | property | property_details | boolean |
| `property1.net_monthly_income` | `pr_p_netMonthlyIncome` | property | property_details | currency |

(`property1.pledged_equity` → `pr_p_pledgedEquity` already exists in the dictionary, confirmed via DB inspection.)

No other DB changes. Existing deal save/update API (`deal_section_values` JSONB) already handles `property1.*` keys.

### D. Out of scope

- No changes to PropertySubNavigation, PropertyModal, PropertyTaxForm, PropertyLiensForm, or any document-generation code.
- No changes to the Land Classification dropdown contents.
- No changes to existing Occupancy options (already updated previously).
- No refactor of save flow, dirty-tracking, or permission gating.

## Expected outcome

- Property Details screen renders Fire Zone (checkbox), Pledged Equity (currency), Net Monthly Income (currency, always visible), Zoning (dropdown), corrected Type of Construction and Property Type dropdowns.
- Entering values and saving the deal persists Fire Zone, Pledged Equity and Net Monthly Income through the existing save API; values reload after refresh.
- All previously working fields, Third-Party conditional panel, address-copy logic, and LTV/CLTV/Protective-Equity calculations behave exactly as before.
