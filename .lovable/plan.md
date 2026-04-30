## Goal

Make RE851D populate up to 5 properties (PART 1 LTV table, PART 2 Property Type checkbox blocks, and PROPERTY #1–#5 sections) sequentially from the CSR Property table, while leaving every other template, form, schema, and pipeline stage untouched.

CSR property data is already stored per-index as `property1.*`, `property2.*`, … The duplication you see today is purely because the RE851D `.docx` uses the same un-indexed tag (e.g. `{{pr_p_address}}`) in every block, so the engine resolves all 5 to property #1.

## Approach (additive, fully backwards-compatible)

1. Template tags inside each PROPERTY #N block carry an `_N` suffix (`_1` … `_5`).
2. Backend gains an indexed-suffix resolver that maps `{{pr_p_address_2}}` → `property2.address`, returns empty string when the index has no CSR record, and is only triggered when an `_1`…`_5` suffix is present.
3. Per-index computed values (`pr_p_totalSenior_N`, `ln_p_loanToValueRatio_N`, `pr_p_totalSeniorPlusLoan_N`) are emitted alongside the existing un-indexed ones.
4. The existing label-anchored checkbox safety pass (already used for Servicing/Amortization/Payable in RE851A) is extended to scope each "Property Type" checkbox group to its own `PROPERTY #N` paragraph range, so checkboxes never leak across blocks.

No schema changes. No `field_dictionary` rows added. No CSR UI changes. Other templates (RE851A, RE851B, RE885, HUD-1, etc.) are untouched and behave exactly as today because they don't use `_N` suffixed tags.

## Files to edit

- `supabase/functions/_shared/tag-parser.ts`
  - Inside merge-tag resolution, detect a trailing `_<digit 1-5>` on the tag name. Strip it, resolve via existing `pr_p_*` short-suffix map, look up `property{N}.<short>`. Fall through to empty string if absent.
  - Mirror the same suffix handling inside `processEachBlocks` so `{{pr_p_address_2}}` works inside or outside `{{#each}}`.
  - Extend label-anchored Property Type checkbox safety: for each `PROPERTY #N` heading, scope ticking of Single-Family / Commercial / Land / etc. glyphs to that block based on `property{N}.property_type`.

- `supabase/functions/generate-document/index.ts`
  - Inside the existing `propertyIndices` loop (~line 725), for each present index N additionally publish:
    - Aliases: `pr_p_address_N`, `pr_p_street_N`, `pr_p_city_N`, `pr_p_state_N`, `pr_p_zip_N`, `pr_p_county_N`, `pr_p_apn_N`, `pr_p_owner_N`, `pr_p_legalDescri_N`, `pr_p_propertyTyp_N`, `pr_p_occupancySt_N`, `pr_p_yearBuilt_N`, `pr_p_lotSize_N`, `pr_p_squareFeet_N`, `pr_p_numberOfUni_N`, `pr_p_appraiseValue_N`, `pr_p_marketValue_N`, `propertytax_annual_payment_N`, `pr_p_delinquHowMany_N`.
    - Computed: `pr_p_totalSenior_N` (sum of property{N} lien current balances), `pr_p_totalSeniorPlusLoan_N` (= totalSenior + loan amount), `ln_p_loanToValueRatio_N` (= loan_amount / property{N}.appraise_value, formatted %).
  - Indices not present in CSR get **no** alias set, so the resolver fall-through yields an empty string and the block stays blank.

That's it — two files, both edits are additive and gated on the `_N` suffix.

## Tags to use in the RE851D template (`N` = 1…5)

Replace the un-indexed tags currently in each PROPERTY #N block with the indexed version:

```text
PROPERTY #N block
─────────────────
Street Address (full)        {{pr_p_address_N}}
Street / City / State / Zip  {{pr_p_street_N}} {{pr_p_city_N}} {{pr_p_state_N}} {{pr_p_zip_N}}
County                       {{pr_p_county_N}}
APN                          {{pr_p_apn_N}}
Owner / Vesting              {{pr_p_owner_N}}
Legal Description            {{pr_p_legalDescri_N}}
Year Built / Lot / SqFt      {{pr_p_yearBuilt_N}} {{pr_p_lotSize_N}} {{pr_p_squareFeet_N}}
Number of Units              {{pr_p_numberOfUni_N}}
Occupancy Status (text)      {{pr_p_occupancySt_N}}
Property Type (text)         {{pr_p_propertyTyp_N}}
Annual Property Taxes        {{propertytax_annual_payment_N}}
How many delinquent          {{pr_p_delinquHowMany_N}}
Estimate / Market Value      {{pr_p_appraiseValue_N}}   {{pr_p_marketValue_N}}
Total Senior Encumbrances    {{pr_p_totalSenior_N}}
Total Senior + Loan          {{pr_p_totalSeniorPlusLoan_N}}
LTV Ratio                    {{ln_p_loanToValueRatio_N}}

PART 1 multi-row LTV table
──────────────────────────
Row 1 → use _1 suffix for appraiseValue / totalSenior / loanToValueRatio
Row 2 → use _2 suffix
... up to Row 5

PART 2 Property Type #N checkbox blocks
───────────────────────────────────────
Keep the static ☐ glyphs as-is. Engine ticks the matching one
based on property{N}.property_type, scoped to each block.
Optional text print: {{pr_p_propertyTyp_N}}
```

## Behaviour after change

| CSR property count | Blocks populated | Blocks left blank |
|---|---|---|
| 1 | #1 | #2–#5 (text empty, checkboxes off) |
| 2 | #1, #2 | #3–#5 |
| 3 | #1–#3 | #4–#5 |
| 4 | #1–#4 | #5 |
| 5 | #1–#5 | — |
| 6+ | first 5 | extras ignored |

## Out of scope (per your constraints)

- No CSR UI / Property entry form changes
- No DB schema or `field_dictionary` / `merge_tag_aliases` row changes
- No edits to other templates (RE851A, RE851B, RE885, HUD-1, etc.)
- No edits to dropdown values, document generation pipeline stages, PDF conversion, or storage layer
- Existing un-indexed tags continue to resolve to property #1 exactly as today

## Validation

- Existing `tag-parser.*.test.ts` continue to pass (un-indexed paths unchanged).
- After backend deploy + template tag update: regenerate RE851D for deals with 1, 2, 3, 4, 5, and 6 properties — confirm correct sequential population, blank trailing blocks, and that no Property Type checkbox is ticked in blocks without a CSR property.
- Smoke-test RE851A generation to confirm no regression on un-indexed property tags.