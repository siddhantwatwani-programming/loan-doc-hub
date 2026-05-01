## Goal

Update the RE851D per-property "Property Type" checkbox publisher in `supabase/functions/generate-document/index.ts` so the selected checkbox is determined by **Property Type × Occupancy**, with the expanded fallback list going to **OTHER + text**.

## What's already in place (no work needed)

- All 7 target keys exist in `field_dictionary` (`property_type_sfr_owner`, `property_type_sfr_non_owner`, `property_type_sfr_zoned`, `property_type_commercial`, `property_type_land_zoned`, `property_type_land_income`, `property_type_other`) plus `property_type_other_text`. Confirmed via DB.
- The publisher already handles `_N` indexing, glyph aliases (`☒`/`☐`), bare aliases for index 1, and skips publishing when no source value exists.
- Source resolution chain (`pr_p_propertyTyp_${idx}` → `pr_p_propertyType_${idx}` → `${prefix}.propertyType` → `${prefix}.appraisal_property_type`) is already correct for both Property Type and Occupancy.
- The separate Part 2 generic property-type publisher (lines 985–1039, the `singleFamily/condominium/...` group) is unrelated and stays untouched.

## What needs to change

Single, surgical edit to the **RE851D spec block** (lines ~1041–1133) of `supabase/functions/generate-document/index.ts`:

### 1. Read Occupancy alongside Property Type

Read `${prefix}.occupancyStatus` / `${prefix}.appraisal_occupancy` / `pr_p_occupancySt_${idx}` / `pr_p_occupanc_${idx}` and normalize to `ownerOccupied` vs `vacantOrNA` using the same alias logic already used by the Owner-Occupied Yes/No publisher just below (lines 1135–1159).

### 2. Replace `SPEC_MAP` with a function that takes (propertyType, occupancy)

New mapping per the call:

| Property Type | Occupancy | Target |
|---|---|---|
| SFR 1-4 | Owner Occupied | `property_type_sfr_owner` |
| SFR 1-4 | Vacant / NA (or unset) | `property_type_sfr_non_owner` |
| Land SFR Residential | any | `property_type_sfr_zoned` |
| Multi-family, Commercial, Commercial Income, Mixed-use, Condo / Townhouse | any | `property_type_commercial` |
| Land Residential, Land Commercial | any | `property_type_land_zoned` |
| Land Income Producing | any | `property_type_land_income` |
| Mobile Home, Farm, Restaurant / Bar, Group Housing, *anything else* | any | `property_type_other` (+ `property_type_other_text` = raw value) |

Key behavioral changes vs. current code:
- **Condo / Townhouse** moves from `sfr_non_owner` → `commercial` (matches new spec).
- **SFR 1-4 + Vacant/NA** now selects `sfr_non_owner` (currently nothing maps there from SFR).
- **Mobile Home / Farm / Restaurant / Bar / Group Housing** explicitly fall through to OTHER with the raw label as text (today they already fall through to OTHER, but the text wasn't guaranteed for those values — the change makes the intent explicit in the lookup table).

### 3. Preserve all existing publishing semantics

- Continue to publish booleans + `_glyph` for every target with `_${idx}` suffix.
- Continue to also publish bare (non-`_N`) aliases when `idx === 1`.
- Continue to skip publishing entirely when Property Type source is empty (don't clobber SDT defaults / leave absent property blocks blank — matches the strict per-index rule already documented in the file).
- Continue to publish `property_type_other_text_${idx}` (and bare for idx 1) so OTHER captures the raw label.

## Out of scope (Minimal Change Policy)

- No schema changes — dictionary entries already exist.
- No UI changes — CSR Property Type & Occupancy dropdowns already feed `property{idx}.propertyType` / `property{idx}.occupancyStatus` and the publisher reads from those.
- No changes to the Owner-Occupied Yes/No publisher (lines 1135–1159) — separate concern.
- No changes to the Part 2 generic property-type group (lines 985–1039).
- No changes to Lien encumbrance, address, or any other publisher.

## Files touched

- `supabase/functions/generate-document/index.ts` — one block (~lines 1041–1133) replaced with the cross-referenced version above.

## Memory update

Update `mem://features/document-generation/re851d-multi-property-mapping` to note the new Property Type × Occupancy cross-reference rule and the expanded OTHER fallback list (Mobile Home, Farm, Restaurant / Bar, Group Housing).

## Verification

1. Generate RE851D for a deal with two properties:
   - Property 1: `SFR 1-4` + `Owner Occupied` → only `property_type_sfr_owner_1` checked.
   - Property 2: `SFR 1-4` + `Vacant / NA` → only `property_type_sfr_non_owner_2` checked.
2. Set Property 1 to `Mobile Home` → only `property_type_other_1` checked, `property_type_other_text_1 = "Mobile Home"`.
3. Set Property 1 to `Condo / Townhouse` → only `property_type_commercial_1` checked (regression check vs. previous behavior).
4. Set Property 1 to `Land Income Producing` → only `property_type_land_income_1` checked.
5. Confirm no raw `{{property_type_*_N}}` placeholders remain in the output and exactly one checkbox is selected per property.
