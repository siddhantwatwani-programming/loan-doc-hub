# Plan: Fix RE851A Balloon Payment checkbox logic

## What will be changed
1. Keep the existing data mapping exactly as-is.
   - Continue using the Loan UI checkbox source.
   - Continue using `ln_p_balloonPayment` in the RE851A logic.
   - Do not change UI, database, API, or unrelated field mappings.

2. Correct the RE851A Part 3 checkbox rendering at the template/parser layer only.
   - The uploaded RE851A reference shows the Balloon Payment row currently authored as a single conditional block that only outputs one side of the choice.
   - Replace that logic with a true two-option render so both choices are always present:
     - `{{#if ln_p_balloonPayment}}☑{{else}}☐{{/if}} YES`
     - `{{#if ln_p_balloonPayment}}☐{{else}}☑{{/if}} NO`
   - Preserve the exact cell, spacing, labels, and document structure.

3. Keep null and missing values treated as false.
   - `true` => YES checked, NO unchecked
   - `false` / `null` / `undefined` => YES unchecked, NO checked

4. Verify parser compatibility for fragmented Word tags.
   - If the live template already contains the correct Handlebars syntax but still fails, harden the existing conditional-tag consolidation in `tag-parser.ts` only for this rendering path.
   - Do not introduce new helpers unless the current parser already supports them.

5. Validate no regression in RE851A.
   - Confirm the Balloon Payment row renders correctly with no raw tags, no misalignment, and no impact on other sections.

## What this means for your question
You should not change the field mapping.

The mapping/derivation path is already in place in the document generator:
- UI value is stored under `loan_terms.balloon_payment`
- Legacy alias exists as `ln_p_balloonPaymen`
- The generator already derives `ln_p_balloonPayment` as a boolean for template conditionals

So the likely fix is:
- template logic correction if the live RE851A matches the uploaded reference, or
- parser hardening if Word is fragmenting otherwise-correct tags

## Technical details
- Keep `generate-document/index.ts` balloon boolean derivation intact unless a very small normalization adjustment is needed.
- Apply the fix only in the RE851A Balloon Payment rendering path.
- Do not touch other checkbox logic, document sections, field keys, schema, or UI components.
- If needed, extend the existing tag-parser control-tag consolidation rather than adding a new helper or new mapping.

## Expected result
- Checked in Loan UI -> `☑ YES` and `☐ NO`
- Unchecked or empty -> `☐ YES` and `☑ NO`
- No layout or formatting changes
- No regression in other RE851A fields