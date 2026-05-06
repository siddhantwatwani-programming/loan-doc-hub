Plan to fix RE851D field population without changing existing UI, database schema, APIs, or unrelated document flows.

Scope
- Only update the RE851D-specific logic inside the existing `generate-document` backend function and, only if required, shared parser behavior strictly scoped to RE851D template handling.
- Do not modify forms, UI layout, database schema, saved CSR data, or non-RE851D generation behavior.

Findings from inspection
- The uploaded RE851D template uses generic `_N` placeholders throughout Part 1, Part 2, and Property #1-#5 blocks, for example `{{pr_p_address_N}}`, `{{pr_p_appraiseValue_N}}`, `{{ln_p_remainingEncumbrance_N}}`, `{{propertytax.annual_payment_N}}`, and `{{pr_li_*_N}}`.
- The generation logs show a concrete failure before rendering: `RE851D _N preprocessing failed ... sortedPropIndices is not defined`. This means the template `_N` rewrite is failing and the original template continues with literal `_N` tags, which then resolve blank.
- The current RE851D publisher already attempts to emit per-property aliases such as `pr_p_address_1`, `pr_p_address_2`, `ln_p_remainingEncumbrance_1`, etc., but the preprocessing failure prevents template tags from being rewritten to those suffixed keys.
- The current template has mixed tag quality: some tags are correctly `_N`, some are unsuffixed inside property blocks (`{{propertytax.source_of_information}}`, `{{pr_p_squareFeet}}`, `{{pr_p_yearBuilt}}`), and some conditionals/glyphs are malformed. The fix should be defensive and RE851D-scoped.

Implementation steps
1. Repair RE851D `_N` preprocessing variable scope
   - Define the property index list used by the preprocessing block in the same scope where the block runs, derived from the already-built `propertyIndices` set.
   - Ensure the multiple-properties safety pass uses that local list instead of an out-of-scope variable.
   - Keep fallback behavior safe: if no property data exists, only Property #1 can be considered, and no cross-property duplication should occur.

2. Expand RE851D valid-key seeding for all published per-property aliases
   - Add all RE851D suffixed keys that are published by the RE851D mapper to `effectiveValidFieldKeys`, not just encumbrance totals.
   - Include property fields, tax fields, property type flags, delinquency/questionnaire fields, glyph aliases, and loan-to-value aliases.
   - This prevents the resolver from treating `*_1..*_5` as unknown and falling back to unsuffixed/canonical keys.

3. Harden property/lien/tax publishing for strict N logic
   - Confirm/preserve `PROPERTY #1 -> property1`, `PROPERTY #2 -> property2`, etc.
   - Use only each property’s indexed keys for property data.
   - Keep lien rollups filtered by `lienK.property` matching `propertyN` or that property’s address.
   - Keep property tax routed through `propertytaxN` or address-based matching, with no cross-index fallback except the existing Property #1 legacy fallback.

4. Add RE851D-scoped handling for unsuffixed tags inside property blocks
   - Extend the existing RE851D contextual bare-tag rewrite so unsuffixed property/tax tags inside Property #K blocks are rewritten to `_<K>` equivalents.
   - Include the unsuffixed tags seen in the uploaded template, such as `propertytax.source_of_information`, `propertytax.delinquent`, `pr_p_squareFeet`, `pr_p_yearBuilt`, and related property fields.
   - Keep this strictly inside detected Property #K regions so it cannot affect other documents.

5. Add missing per-property boolean/glyph aliases where the template expects them
   - Ensure `pr_li_delinqu60day_N_yes_glyph/no_glyph`, `pr_li_delinquencyPaidByLoan_N_yes_glyph/no_glyph`, and related yes/no aliases are published per property where lien data exists.
   - Preserve existing questionnaire logic and only fill aliases from CSR lien values.

6. Verification
   - Run the existing document-generation path for the current RE851D deal/template if available.
   - Check logs confirm no `_N preprocessing failed` error.
   - Confirm output no longer contains literal `_N` placeholders for RE851D mapped fields.
   - Spot-check Property #1-#5 mapping behavior: each property section uses its own property, lien, and tax values; no duplicate fallback from Property #1 into later sections.

Acceptance criteria covered
- RE851D dynamic fields populate when CSR data exists.
- `_N` tags resolve as property-specific `_1.._5` aliases.
- Property, lien, and property tax values are sourced from the correct CSR sections.
- Lien-derived values are filtered by related property.
- No blank fields caused by unresolved `_N` tags.
- No cross-property duplication from unsuffixed fallback behavior.