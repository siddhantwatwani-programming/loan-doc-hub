Plan to fix the RE851D property population issue, limited to `supabase/functions/generate-document/index.ts` only.

Scope constraints:
- No UI changes.
- No database schema changes.
- No template changes.
- No refactor of the document generation flow.
- Only targeted RE851D `_N` placeholder mapping and per-property alias publishing changes.

What I found:
- The deal does have property data for Property 1, 2, and 3, including street, appraisal value/date, year built, square feet, construction type, and occupancy.
- Property 2 and Property 3 values are stored with UI/indexed keys like `property2.square_feet`, `property3.year_built`, etc.
- The current alias publisher expects camelCase keys like `property2.squareFeet` / `property2.yearBuilt`, so some indexed values are not being published to `pr_p_*_2` / `pr_p_*_3` aliases.
- The latest generation log still shows `PROPS=[]`, meaning the Property #1–#5 section detector is still not finding the property detail sections. As a result, all remaining `_N` tags after Part 2 are being handled as Part 2 instead of being forced to the section index.
- The uploaded screenshots show raw conditional text such as `(eq pr_p_occupanc_N "Owner")`, which means `_N` is not being rewritten inside conditionals/control tags. This must be handled so checkbox logic can evaluate indexed values.

Implementation plan:

1. Fix per-property alias publishing for stored indexed UI keys
   - Extend the existing RE851D alias publisher to read both current camelCase variants and the actual stored snake_case variants:
     - `yearBuilt` and `year_built`
     - `squareFeet` and `square_feet`
     - `construction_type` and existing construction variants
     - `appraised_date`, `appraised_value`, `appraisal_occupancy`, etc.
   - Publish aliases like:
     - `pr_p_street_1`, `pr_p_street_2`, `pr_p_street_3`
     - `pr_p_squareFeet_1`, `pr_p_squareFeet_2`, `pr_p_squareFeet_3`
     - `pr_p_yearBuilt_1`, `pr_p_yearBuilt_2`, `pr_p_yearBuilt_3`
     - `pr_p_construcType_1`, `pr_p_construcType_2`, `pr_p_construcType_3`
     - `pr_p_appraiseValue_1`, `pr_p_appraiseValue_2`, `pr_p_appraiseValue_3`
   - Preserve the anti-fallback shield so missing properties remain blank and never duplicate Property 1.

2. Make RE851D property section detection robust against Word XML fragmentation
   - Replace the current fragile `PROPERTY #K` text-offset detector with a DOCX/XML-aware detector that can identify the actual section headings even when Word splits `PROPERTY`, `#`, and the number across runs/cells.
   - Keep the rule that Property detail sections must start after Part 2.
   - Keep filtering to avoid inline prose mentions like “secured by Property #1”.
   - The expected log after this should show property regions, for example:
     ```text
     PROPS=[#1@[...], #2@[...], #3@[...]]
     ```

3. Rewrite `_N` inside conditional/control tags as well as normal merge fields
   - Extend the RE851D `_N` rewrite allowlist to include the conditional patterns used in the template, especially:
     - `pr_p_occupanc_N` inside `(eq pr_p_occupanc_N "Owner")`
     - `propertytax.delinquent_N` inside tax delinquency conditionals
   - Ensure Property #K sections force `_N` to `_K`, so:
     - Property #1 uses `_1`
     - Property #2 uses `_2`
     - Property #3 uses `_3`
     - Property #4 uses `_4`
     - Property #5 uses `_5`

4. Add missing checkbox aliases for exact template variants
   - Owner occupied:
     - Source from `pr_p_occupanc_<index>` / `property<index>.appraisal_occupancy`.
     - `Owner` means YES true / NO false.
     - Any other populated value means YES false / NO true.
   - Tax delinquent:
     - Source from `propertytax.delinquent_<index>`.
     - `true` means YES true / NO false.
     - `false` means YES false / NO true.
   - Keep existing checkbox logic intact and only add the indexed aliases needed for RE851D.

5. Add targeted diagnostics only for RE851D
   - Log detected property region offsets and rewrite counts per region.
   - Log a concise indexed-alias summary for properties 1–5 so it is clear whether data exists before template processing.

Validation after implementation:
- Deploy only the `generate-document` backend function.
- Ask you to regenerate RE851D.
- Confirm from logs that:
  - Property regions are detected.
  - Rewrites occur in Part 1, Part 2, and each Property # section.
  - Indexed property aliases exist for Property 1, 2, and 3.

Expected result:
- Part 1 maps row 1/2/3 to Property 1/2/3.
- Part 2 maps block 1/2/3 to Property 1/2/3.
- Property #1 shows Doveson Street data.
- Property #2 shows MG Road data.
- Property #3 shows MG Ring/MG Ringh data.
- Property #4–#5 remain blank if no CSR data exists.
- No Property #2–#5 section reuses Property #1 data.