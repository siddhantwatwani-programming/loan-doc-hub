## RE851D Multi-Property Mapping Fix (Part 2 + Property Sections)

### Goal

Each PROPERTY #N block in the generated RE851D document must read its own indexed CSR property data, and the Part 2 “Property Type” checkbox group inside each block must reflect that property’s type only. No fallback from one property to another. Indices 2–5 must populate when present, stay blank when absent.

### Root cause (in current code)

`supabase/functions/generate-document/index.ts` already discovers property indices and publishes per-index aliases (lines 751–860), but the publishing pass is incomplete for RE851D v5:

1. The per-index alias loop only re-publishes a few computed fields (`pr_p_appraiseValue_N`, `pr_p_owner_N`, `pr_p_totalSenior_N`, `pr_p_totalSeniorPlusLoan_N`, `ln_p_loanToValueRatio_N`, `propertytax_annual_payment_N`, `pr_p_delinquHowMany_N`) plus whatever has a short suffix in `prKeyToSuffix` (lines 217–230). Several fields the user listed — Property Owner, Remaining Senior Encumbrance, Expected Encumbrance, Total Encumbrances, Market Value, Lien/Encumbrance text, Owner-Occupied flag — currently have no `_N` alias for N>1, so blocks 2–5 silently fall back to empty (or, in templates that defaulted to the un-suffixed key, to property #1).
2. The Part 2 “Property Type” block has only the string alias `pr_p_propertyTyp_N`. RE851D Part 2 uses **one checkbox per type per property block** (Single Family, Condominium, Multi-Unit, Commercial, Land, Other …), so each property needs boolean aliases like `pr_p_propertyTyp_N_singleFamily = true/false`, mirroring the RE851A checkbox-automation pattern already documented in memory (`features/document-generation/re851a-checkbox-automation`).
3. No safety pass forces exactly one Part 2 property-type checkbox per property block.

### Plan

All edits stay inside `supabase/functions/generate-document/index.ts` (no schema, UI, API, or document layout changes). The existing per-index pass is extended; nothing else is refactored.

#### 1. Extend the per-index alias loop (≈ lines 791–859)

For every discovered property index `idx ∈ {1..5}` add aliases for the remaining RE851D fields, sourced strictly from `property{idx}.*` — never from `property1` or any other index:

| RE851D placeholder family | Source key | Notes |
|---|---|---|
| `pr_p_owner_N` | `property{N}.owner` ‖ `property{N}.vesting` | already partial; keep |
| `pr_p_marketValue_N` | `property{N}.marketValue` ‖ `property{N}.market_value` ‖ `property{N}.appraised_value` | currency |
| `pr_p_remainingSenior_N` | `property{N}.remaining_senior` ‖ `property{N}.remainingSenior` | currency |
| `pr_p_expectedSenior_N` | `property{N}.expected_senior` ‖ `property{N}.expectedSenior` | currency |
| `pr_p_totalEncumbrance_N` | computed: `remainingSenior_N + expectedSenior_N` (fallback to existing `pr_p_totalSenior_N` when components missing) | currency |
| `pr_p_address_N`, `pr_p_street_N`, `pr_p_city_N`, `pr_p_state_N`, `pr_p_zip_N`, `pr_p_county_N`, `pr_p_country_N` | `property{N}.*` | already partly published via `prKeyToSuffix`; verify all exist for N>1 |
| `pr_p_legalDescri_N`, `pr_p_yearBuilt_N`, `pr_p_squareFeet_N`, `pr_p_lotSize_N`, `pr_p_numberOfUni_N`, `pr_p_apn_N` | `property{N}.*` | text/number |
| `pr_p_occupancySt_N` (string) plus boolean aliases `pr_p_occupancySt_N_yes` / `pr_p_occupancySt_N_no` | derived from `property{N}.occupancyStatus` | for the Owner-Occupied Yes/No checkboxes per block |
| `pr_p_appraiseValue_N`, `pr_p_appraiseDate_N`, `pr_p_appraiserName_N`, `pr_p_appraiserAddr_N` | `property{N}.appraised_value`, `property{N}.appraisal_date`, `property{N}.appraiser_name`, `property{N}.appraiser_address` | currency/date/text |
| `pr_p_lienInfo_N` | concatenated description from `lien*` rows whose `lien*.property` matches `property{N}.address` or `property{N}` | text join existing data, no new schema |

All assignments use `if (!fieldValues.has(key)) fieldValues.set(...)` so explicitly authored values are never overwritten, and missing source values produce no alias (block stays blank — matches the spec’s edge-case rule).

#### 2. Property Type checkboxes per index (Part 2)

Add a small loop, mirroring the RE851A amortization/servicing checkbox automation:

```text
For each idx in property indices (1..5):
  raw = property{idx}.propertyType   // dropdown value, e.g. "single_family"
  TYPES = [singleFamily, condominium, multiUnit, commercial, land, mobileHome, other]
  For each t in TYPES:
    fieldValues.set(`pr_p_propertyTyp_${idx}_${t}`, { rawValue: (normalize(raw)===t ? "true" : "false"), dataType: "boolean" })
  // Safety pass: if raw resolves to a known type, also publish a glyph alias
  // (☒/☐) under `pr_p_propertyTyp_${idx}_${t}_glyph` so SDT fallbacks render.
```

Normalization handles common variants (`Single Family`, `single-family`, `SingleFamily` → `singleFamily`). Unknown types publish all-false plus an `pr_p_propertyTyp_${idx}_other = true` fallback only when the user explicitly selected an "other" option — never when the property is missing entirely.

#### 3. Auto-address consistency

The existing auto-compute loop at lines 730–749 already builds `property{N}.address` from components for every discovered index. Add `pr_p_address_N` as a mirror in the same loop so RE851D blocks that bind directly to `pr_p_address_N` always get a value identical to the address shown by the indexed `Property{N}.Address` alias.

#### 4. Strict no-fallback guarantee

Audit every place in `index.ts` that previously wrote `pr_p_*` un-suffixed keys (e.g. lines 863–922 for `pr_p_address`, `pr_p_appraiseValue`, `pr_p_loanToValue`, `pr_pd_estimateValue`). For RE851D:

- Keep these single-property writes unchanged for backward compatibility with single-property templates.
- Do NOT propagate property #1 values into `_2`/`_3`/`_4`/`_5` slots under any circumstance. The new per-index loop (#1) only writes a `_N` alias when `property{N}.<source>` is present.

This satisfies the “If any field is missing: do NOT fallback to another property’s data” acceptance criterion.

#### 5. Logging

Extend the existing `debugLog` line at 860 to list, per index, the count of aliases published. Useful for diagnosing future template-binding mismatches without changing behaviour.

### Files touched

- `supabase/functions/generate-document/index.ts` — extend the per-index alias publisher block (≈ lines 730–860); add property-type checkbox boolean aliasing loop; mirror `pr_p_address_N`. No other files.

### Out of scope (explicitly preserved)

- No DB schema changes, no new tables, no migrations.
- No UI changes (CSR Property table, PropertyDetailsForm, dashboards untouched).
- No template file changes.
- Save/update APIs unchanged.
- Single-property generation flow (RE851A/B/C) unchanged: those templates rely on un-suffixed `pr_p_*` keys, which keep their current writers.

### Validation

After deploy, regenerate RE851D on a deal with 1, 3, and 5 properties:

- 1 property → only PROPERTY #1 populated, blocks #2–#5 blank, only one Part 2 checkbox ticked in block #1.
- 3 properties → blocks #1/#2/#3 each show their own street, owner, market value, encumbrances, LTV; blocks #4/#5 stay blank; Part 2 checkboxes tick the correct type in each populated block only.
- 5 properties → all five blocks unique, no value repeats unless source data is genuinely identical.
