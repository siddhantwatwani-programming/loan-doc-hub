Do I know what the issue is? Yes.

The CSR/property data exists. I verified the current deal has indexed property data for Property 1, 2, and 3, including:

- Property 1: Doveson Street, appraised value 5,000,000, occupancy Investor, square feet 636, construction Concrete Block
- Property 2: MG Road, appraised value 323, occupancy Secondary Borrower, square feet 23, construction Stick
- Property 3: MG Ringh, appraised value 87,877, occupancy Tenant, square feet 34, construction Concrete Block

The problem is in the RE851D document preprocessing, not in the CSR data.

Exactly what is going wrong:

1. The RE851D property-detail sections are not being detected.
   - The latest backend log still shows:
     ```text
     PROPS=[]
     PART2=[136073,2427477]
     ```
   - That means the generator sees the entire rest of the document after PART 2 as one giant PART 2 region.
   - Because there are no detected PROPERTY #1/#2/#3 regions, the generator never forces `PROPERTY #1 -> _1`, `PROPERTY #2 -> _2`, etc.

2. Property-detail tags are being handled with the wrong allowlist.
   - Since the detail sections are mistakenly inside PART 2, only these PART 2 tags are eligible for `_N` rewriting:
     ```text
     pr_p_address_N
     pr_p_appraiseValue_N
     ln_p_loanToValueRatio_N
     ```
   - Detail-section tags like these are skipped and remain unresolved:
     ```text
     propertytax.annual_payment_N
     propertytax.delinquent_amount_N
     propertytax.source_of_information_N
     pr_p_occupanc_N
     pr_p_appraiseDate_N
     pr_p_yearBuilt_N
     pr_p_squareFeet_N
     pr_p_construcType_N
     ```
   - This matches the screenshots showing raw conditional text such as:
     ```text
     (eq pr_p_occupanc_N "Owner")
     ```

3. The current section detector is too fragile for the uploaded DOCX.
   - The uploaded template does contain PROPERTY #1, PROPERTY #2, PROPERTY #3, etc.
   - It also contains PROPERTY INFORMATION headings.
   - But Word stores those headings across runs/cells/text boundaries. The current detector strips XML tags without inserting separator spaces, so text that visually appears as `PROPERTY INFORMATION` can become `PROPERTYINFORMATION` internally and fail the regex.
   - Result: no property anchors are found.

4. Some attached-template fields are not actually indexed even though they are inside indexed property sections.
   - Examples from the attached template:
     ```text
     PROPERTY #2 AGE: {{ pr_p_yearBuilt}}
     PROPERTY #3 SQUARE FEET: {{pr_p_squareFeet}}
     PROPERTY #4 SQUARE FEET: {{pr_p_squareFeet}}
     TAX DELINQUENT conditionals: {{#if propertytax.delinquent}}
     ```
   - These bare tags can fall back to Property 1 or remain incorrect unless the RE851D property-section context rewrites them to the current section index.
   - This explains duplicated/missing values even when the CSR has Property 2/3 data.

5. The current rewrite count confirms the bad routing.
   - The log says:
     ```text
     PART1=6, PART2=24, PROPS=[]
     ```
   - PART 2 should not own the property-detail pages. The 24 rewrites show property-detail occurrences are being counted as PART 2 occurrences, causing later fields to become overflow/blank or skipped.

Implementation plan, with minimal scope:

- Only update `supabase/functions/generate-document/index.ts`.
- No UI changes.
- No database schema changes.
- No template upload/edit changes.
- No refactor of the document generation flow.
- Keep all changes scoped to RE851D detection, `_N` binding, and exact field aliases needed for this document.

Plan:

1. Replace the RE851D property-section detector with a Word-XML-tolerant detector
   - Build anchor text with safe separator handling for Word XML boundaries instead of simply deleting tags.
   - Detect all of these heading variants after PART 2:
     ```text
     PROPERTY #1
     PROPERTY #2
     PROPERTY #3
     PROPERTY #4
     PROPERTY #5
     PROPERTY INFORMATION
     PROPERTYINFORMATION
     ```
   - Prefer explicit `PROPERTY #K` when present.
   - If explicit numbers are fragmented or missing, use ordered `PROPERTY INFORMATION` headings after PART 2 and assign indexes 1 through 5 by document order.
   - Set PART 2 to end at the first detected property-detail section.
   - Expected diagnostic after fix:
     ```text
     PROPS=[#1@[...], #2@[...], #3@[...], #4@[...], #5@[...]]
     ```

2. Force `_N` to the property section index for every PROPERTY #K section
   - Once PROPERTY #K ranges are detected, every RE851D property-detail tag inside that range will be rewritten to `_K`.
   - Examples:
     ```text
     PROPERTY #1: pr_p_address_N -> pr_p_address_1
     PROPERTY #2: pr_p_address_N -> pr_p_address_2
     PROPERTY #3: pr_p_address_N -> pr_p_address_3
     ```
   - Same behavior for taxes, occupancy, appraisal, age/year built, square feet, and construction type.

3. Keep PART 1 and PART 2 independent
   - PART 1 will continue to count repeated rows from 1 to 5:
     ```text
     pr_p_appraiseValue_N -> pr_p_appraiseValue_1, _2, _3...
     ln_p_loanToValueRatio_N -> ln_p_loanToValueRatio_1, _2, _3...
     ```
   - PART 2 will continue to count repeated property blocks from 1 to 5:
     ```text
     pr_p_address_N -> pr_p_address_1, _2, _3...
     pr_p_appraiseValue_N -> pr_p_appraiseValue_1, _2, _3...
     ln_p_loanToValueRatio_N -> ln_p_loanToValueRatio_1, _2, _3...
     ```
   - PART 2 will no longer consume tags from the PROPERTY #1-#5 detail pages.

4. Handle the attached template’s non-indexed field mistakes only inside RE851D property sections
   - Because the uploaded template includes some bare tags inside indexed property sections, add a targeted RE851D-only contextual rewrite:
     ```text
     pr_p_yearBuilt -> pr_p_yearBuilt_K
     pr_p_squareFeet -> pr_p_squareFeet_K
     propertytax.delinquent -> propertytax.delinquent_K
     propertytax.source_of_information -> propertytax.source_of_information_K
     ```
   - This prevents bare tags in PROPERTY #2/#3/#4 from reusing Property 1 or staying blank.
   - This rewrite will be limited to detected PROPERTY #K ranges only.

5. Confirm alias publishing for the exact RE851D fields
   - Ensure each property publishes these aliases when data exists:
     ```text
     pr_p_address_1..5
     pr_p_appraiseValue_1..5
     pr_p_appraiseDate_1..5
     pr_p_yearBuilt_1..5
     pr_p_squareFeet_1..5
     pr_p_construcType_1..5
     pr_p_occupanc_1..5
     propertytax.annual_payment_1..5
     propertytax.delinquent_1..5
     propertytax.delinquent_amount_1..5
     propertytax.source_of_information_1..5
     ln_p_loanToValueRatio_1..5
     ```
   - Preserve the existing anti-fallback shield so missing properties stay blank and never duplicate Property 1.

6. Fix checkbox-specific resolution for RE851D
   - Owner occupied:
     ```text
     pr_p_occupanc_K == "Owner" -> YES checked, NO unchecked
     anything else populated -> YES unchecked, NO checked
     ```
   - Tax delinquent:
     ```text
     propertytax.delinquent_K true -> YES checked, NO unchecked
     propertytax.delinquent_K false -> YES unchecked, NO checked
     ```
   - Also handle false boolean values safely so `false` is not lost by `||` fallback logic.

7. Add RE851D-only diagnostics
   - Log detected section regions.
   - Log rewrite counts by PART 1, PART 2, and each PROPERTY #K.
   - Log a concise property alias summary for properties 1-5 showing address/appraisal/date/square feet/occupancy availability.
   - This will make the next generation easy to verify without changing any UI.

Validation after implementation:

- Deploy only the existing document-generation backend function.
- Regenerate RE851D.
- Confirm logs show property regions instead of `PROPS=[]`.
- Confirm:
  - PART 1 row 1/2/3 maps to Property 1/2/3.
  - PART 2 block 1/2/3 maps to Property 1/2/3.
  - PROPERTY #1 shows Doveson Street data.
  - PROPERTY #2 shows MG Road data.
  - PROPERTY #3 shows MG Ringh data.
  - PROPERTY #4/#5 remain blank if no CSR data exists.
  - No Property #2-#5 section reuses Property #1 data.

<lov-actions>
  <lov-open-history>View History</lov-open-history>
</lov-actions>

<lov-actions>
<lov-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</lov-link>
</lov-actions>