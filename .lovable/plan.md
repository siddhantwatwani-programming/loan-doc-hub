## RE851D Multi-Property Population

### What exists today (no change needed)
- CSR Property table records are already stored as composite JSONB keys `propertyN::{field_dictionary_id}` in `deal_section_values` (1st property → `property1::…`, 2nd → `property2::…`, etc., up to N).
- The generate-document edge function already loads these and bridges them into `propertyN.<suffix>` field values (e.g., `property1.address`, `property2.address`, …, `property2.appraise_value`, `property2.propertyType`).
- The merge-tag engine resolves any tag whose name matches a key in `fieldValues`, so `property2.address` would already resolve.
- The Re851D template you uploaded uses the same single-property tags (`{{pr_p_address}}`, `{{pr_p_appraiseValue}}`, `{{ln_p_loanToValueRatio}}`) repeated identically in every PROPERTY block — so all 5 blocks currently show Property #1's data. That is the root cause.

### What we will change
A single, surgical addition to the merge-tag resolver: recognize an `_1`..`_5` suffix on any tag and route it to the correct property record. The template author then replaces the duplicated tags in PART 2 and in PROPERTY #1–#5 with index-suffixed tags (e.g., `{{pr_p_address_1}}` in block 1, `{{pr_p_address_2}}` in block 2, …).

#### Resolution rule (engine side)
For a tag `<base>_<N>` where N is 1..5:

1. If `propertyN.*` field values exist for that index:
   - Map `pr_p_*` base keys to their bridged `propertyN.<suffix>` counterpart using the existing `prKeyToSuffix` table already in `generate-document/index.ts` (street, city, state, zip, county, address, apn, marketValue, legalDescription, propertyType, occupancyStatus, yearBuilt, lotSize, squareFeet, numberOfUnits, country) plus `appraiseValue → appraise_value`.
   - For derived/calculated property tags also expose per-index variants computed from that same `propertyN.*` data (see "Calculated per-index values" below).
2. If property index N does **not** exist in the CSR table:
   - Render the tag as empty string (blank).
   - For checkbox tags tied to that index, leave all options unchecked (no glyph state change).
3. If CSR has more than 5 properties: indices 6+ are ignored (engine never resolves `_6`, `_7`, …).

#### Calculated per-index values
The engine will compute, per index N (when `propertyN.*` exists), and expose as field values:
- `propertyN.appraise_value` (already bridged from `pr_p_appraiseValue`)
- `propertyN.loan_to_value_ratio` = `ln_p_loanAmount / propertyN.appraise_value * 100` (blank if appraise value missing or 0)
- Total Senior Encumbrances per property: sum of `propertyN.remaining_senior_encumbrance` + `propertyN.expected_senior_encumbrance` (blank if both missing)
- Total (Senior Encumbrances + Loan Amount) per property: above + `ln_p_loanAmount`

These mirror the existing single-property auto-computations already in `generate-document/index.ts` lines 763–796, just per-index.

#### Property Type checkboxes per index
For block N, the existing label-anchored checkbox safety pass (used by RE851A) will be reused with `propertyN.propertyType` as the source. Only one of the six type options gets the ☑ glyph; the others stay ☐. If `propertyN` is missing, all stay ☐.

The mapping from the dropdown value stored in `pr_p_propertyTyp` to the six template labels:
- "Single-Family Residence (Owner Occupied)" → SINGLE-FAMILY RESIDENCE (owner occupied)
- "Single-Family Residence (Not Owner Occupied)" → SINGLE-FAMILY RESIDENCE (not owner occupied)
- "Single-Family Residentially Zoned Lot/Parcel" → SINGLE-FAMILY RESIDENCE (zoned residential lot/parcel)
- "Commercial & Income-Producing" → COMMERCIAL & INCOME-PRODUCING
- "Land (Zoned Commercial/Residential)" → LAND (zoned commercial/residential)
- "Land (Income-Producing)" → LAND (income-producing)
- anything else → OTHER

The label scope is constrained to the single PROPERTY block paragraph range so block N's checkbox state never bleeds into block N+1 — same anchoring strategy already used for Servicing/Amortization/Payable.

### Mapping dictionary — Property 1–5 tags to use in the template

For each block `N ∈ {1,2,3,4,5}` the template uses these tags:

```text
PART 2 (Securing Properties) — block N
  Property Type checkboxes  →  driven by propertyN.propertyType (no tag, label-anchored)
  Property Owner            →  {{pr_p_owner_N}}            → propertyN.owner
  Property Address          →  {{pr_p_address_N}}          → propertyN.address
  Remaining Senior Encum.   →  {{pr_p_remainSenior_N}}     → propertyN.remaining_senior_encumbrance
  Expected Senior Encum.    →  {{pr_p_expectSenior_N}}     → propertyN.expected_senior_encumbrance
  Total Senior Encum.       →  {{pr_p_totalSenior_N}}      → computed
  Total (Senior + Loan)     →  {{pr_p_totalSeniorPlusLoan_N}} → computed
  Current Market Value      →  {{pr_p_appraiseValue_N}}    → propertyN.appraise_value
  Loan To Value Ratio       →  {{ln_p_loanToValueRatio_N}} → computed per-index

PROPERTY #N section
  Street Address            →  {{pr_p_address_N}}
  Owner Occupied            →  driven by propertyN.occupancyStatus (label-anchored)
  Annual Property Taxes     →  {{propertytax_annual_payment_N}}
  Estimated/Actual          →  driven by propertytax tracking type (label-anchored)
  Are Taxes Delinquent?     →  driven by propertyN tax delinquent flag
  …and the remaining single-property tags already used in PROPERTY #1, just suffixed _N
```

Any tag not yet present in field values resolves to blank — no schema change required.

### Files to change

- `supabase/functions/_shared/tag-parser.ts`
  - In `replaceMergeTags` (line 2118): before the existing key resolution, detect `_1..5` trailing suffix; if present, attempt to resolve against `propertyN.<bridged-suffix>` first and only fall back to the suffix-stripped base if no `propertyN` data is found at all (so blocks for absent properties render blank, not duplicated).
  - In the existing `replaceLabelBasedFields` and label-anchored checkbox passes that already key off label proximity (Servicing/Amortization/Payable patterns), add a per-block scope for "PROPERTY #N" anchors so checkbox safety passes operate within one block.

- `supabase/functions/generate-document/index.ts`
  - Extend the existing per-index auto-compute loop (line 725 `for idx of propertyIndices`) to also publish per-index calculated values:
    - `propertyN.loan_to_value_ratio`
    - `propertyN.total_senior_encumbrance`
    - `propertyN.total_senior_plus_loan`
  - Extend `prKeyToSuffix` (line 217) with any property-table fields the template needs but isn't yet bridged (owner, remaining_senior_encumbrance, expected_senior_encumbrance, appraise_value, occupancyStatus already covered).

- No changes to:
  - Database schema, tables, RLS, field_dictionary entries, or migrations.
  - The Property table UI, save/update APIs, or any other form/component.
  - Other templates (RE851A/B/C, RE885, etc.) — they don't use `_1..5` suffixes so behaviour is unchanged.
  - The packet, generation-job, or storage flow.

### Template update (out of code-scope, doc author task)
For RE851D specifically, the merge tags inside each of the 5 PART 2 blocks and each of the 5 PROPERTY #N blocks must be replaced with the index-suffixed names listed above. Once the template uses `_1`..`_5`, the engine populates correctly and unused blocks render blank.

### Validation
- 1 property in CSR → block 1 populated, blocks 2–5 blank, no checkboxes checked in 2–5.
- 3 properties → blocks 1–3 populated with their distinct data, blocks 4–5 blank.
- 5 properties → all blocks populated with distinct data.
- 6+ properties → blocks 1–5 populated from records 1–5; record 6+ is ignored.
- Existing single-property templates (RE851A) unaffected because they don't use `_N` suffixes.
- Existing tag-parser tests continue to pass (no signatures changed).

### Out of scope
- No new tables, no schema migrations, no field_dictionary inserts.
- No UI changes in CSR Property table.
- No changes to other documents' generation behaviour.
- No edits to `processSdtCheckboxes`, `processEachBlocks`, or merge-tag alias table.
