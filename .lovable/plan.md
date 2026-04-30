Plan to fix RE851D property data not populating correctly

Scope constraints I will follow:
- Only update document-generation mapping logic.
- No UI changes.
- No database schema changes or new tables.
- No changes to save/update APIs.
- No broad refactor of the document generation flow.

What I found:
- The uploaded template still contains generic placeholders like `{{pr_p_address_N}}`, `{{pr_p_appraiseValue_N}}`, and `{{ln_p_loanToValueRatio_N}}` rather than resolved indexed placeholders such as `_1`, `_2`, `_3`.
- Current generation code publishes aliases like `pr_p_address_1`, `pr_p_address_2`, etc., but the parser treats literal `_N` as a normal key and therefore logs “No data for pr_p_address_N”.
- Some CSR property values are saved under actual field keys such as `pr_p_propertyType`, `pr_p_occupanc`, `pr_p_ltv`, `pr_p_appraiseDate`, `pr_p_squareFeet`, etc. The existing bridge is missing several of these suffix mappings, so indexed aliases for all fields are not being generated.
- For the current deal, the database does contain separate Property 1, Property 2, and Property 3 values, so this is a mapping/aliasing issue, not a persistence issue.

Implementation plan:

1. Extend RE851D property field bridging in `supabase/functions/generate-document/index.ts`
- Add missing property source mappings for existing saved CSR keys, including:
  - `pr_p_propertyType` -> `appraisal_property_type`
  - `pr_p_occupanc` -> `appraisal_occupancy`
  - `pr_p_appraiseDate` -> `appraised_date`
  - `pr_p_ltv` -> `ltv`
  - `pr_p_cltv` -> `cltv`
  - `pr_p_descript` -> `description`
  - `pr_p_purchasePrice` -> `purchase_price`
  - `pr_p_construcType` -> `construction_type`
  - `pr_p_protectiveEquity` -> `protective_equity`
  - appraiser name/address component fields already stored by the UI.
- Keep strict index sourcing: `property2.*` only populates `_2`, `property3.*` only populates `_3`, etc.

2. Publish multiple alias variants per property index
- For each property 1–5, publish both naming styles where needed:
  - Template/short-form aliases: `pr_p_address_1`, `pr_p_appraiseValue_2`, `ln_p_loanToValueRatio_3`
  - Existing CSR-style aliases where applicable: `pr_p_propertyType_1`, `pr_p_occupanc_2`, `pr_p_ltv_3`
- This preserves compatibility with both old and updated RE851D templates.

3. Handle literal `_N` placeholders in the uploaded template safely
- Add a narrow RE851D-only preprocessing step before DOCX processing that expands repeated generic placeholders by occurrence order inside the document:
  - first `{{pr_p_address_N}}` becomes `{{pr_p_address_1}}`
  - second becomes `{{pr_p_address_2}}`
  - and so on up to 5
- Apply the same for related `_N` placeholders such as appraisal value and LTV.
- This directly addresses the currently uploaded template without requiring a database or UI change.
- The logic will only run for RE851D templates and only for known `_N` property placeholders.

4. Fix Part 2 property type checkboxes by index
- Source property type from the correct per-index field:
  - `property1.appraisal_property_type`
  - `property2.appraisal_property_type`
  - etc.
- Normalize existing UI values such as:
  - `SFR 1-4`
  - `Multi-family`
  - `Condo / Townhouse`
  - `Commercial`
  - `Land`
  - `Mobile Home`
- Publish boolean/glyph aliases per index so only the correct checkbox is checked for each property block.

5. Preserve missing-field behavior
- If a field is missing for Property 4 or Property 5, do not borrow from Property 1.
- Leave the corresponding indexed alias blank/absent so the output section remains blank.

Validation after implementation:
- Generate RE851D for the current deal with the existing three properties.
- Confirm logs show `pr_p_address_1`, `pr_p_address_2`, and `pr_p_address_3` resolving to different values.
- Confirm `_N` placeholders no longer produce “No data” for known indexed property fields.
- Confirm no other document generation code path is intentionally changed.