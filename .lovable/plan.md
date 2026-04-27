Plan: fix RE851A amortization checkbox population without changing template, UI, schema, dropdown behavior, or field mappings

Deep analysis findings
- The CSR Loan → Amortization dropdown persists values such as `fully_amortized`, `partially_amortized`, `interest_only`, `constant_amortization`, `add_on_interest`, and `other` under the existing `loan_terms.amortization` key.
- The document generator already derives boolean keys from that dropdown:
  - `ln_p_amortized`
  - `ln_p_amortizedPartially`
  - `ln_p_interestOnly`
  - `ln_p_constantAmortization`
  - `ln_p_addOnInterest`
  - `ln_p_other`
- The uploaded RE851A mapping document shows the live amortization area uses merge tags directly before the labels:
  - `{{ln_p_amortizedPartially}} AMORTIZED PARTIALLY`
  - `{{ln_p_amortized}} AMORTIZED`
  - `{{ln_p_interestOnly}} INTEREST ONLY`
  - `{{ln_p_other}} Other`
- The likely failure is in the late “label/glyph safety pass”: the broad label pattern for `AMORTIZED` can also match the `AMORTIZED PARTIALLY` line, so a later pass can overwrite the Partially Amortized checkbox state. The earlier rejected approach fixed this in the shared label-replacement regex.

Alternative approach
- Avoid changing the generic/shared label matching behavior.
- Add a narrowly scoped RE851A amortization-only final correction that operates on the visible plain-text sequence after merge tags/conditionals have already rendered.
- The correction will target only the six known amortization labels and only their immediately preceding checkbox glyph/native checkbox.
- It will not touch any other labels, fields, template structure, layout, spacing, or document generation flow.

Implementation steps
1. Update only `supabase/functions/_shared/tag-parser.ts`.
2. Replace the current RE851A amortization safety pass internals with a label-specific, non-overlapping correction strategy:
   - Build exact label entries ordered longest-first.
   - For each label, locate the full label text as a complete phrase.
   - For `AMORTIZED`, explicitly exclude matches that are followed by `PARTIALLY`, so it cannot target the `AMORTIZED PARTIALLY` line.
   - Force the checkbox immediately before that exact label to `☑` only for the selected boolean and `☐` for all others.
3. Add support for native Word checkbox blocks in this same scoped pass:
   - When the checkbox before the label is an existing Word SDT checkbox, update both:
     - `<w14:checked w14:val="1|0">`
     - visible glyph `☑|☐`
   - This preserves document validity and keeps checkboxes interactive.
4. Add/extend regression tests for the RE851A amortization section:
   - Fully Amortized → only `AMORTIZED` checked.
   - Partially Amortized → only `AMORTIZED PARTIALLY` checked, and `AMORTIZED` remains unchecked.
   - Interest Only → only `INTEREST ONLY` checked.
   - Other → only `Other` checked.
   - Constant Amortization and Add-On Interest checked only when their existing derived keys are true.
   - Include a regression case where `AMORTIZED PARTIALLY` appears before `AMORTIZED` to prove there is no label collision.
5. Run the existing document-generation regression tests plus the new amortization tests.

What will not change
- No UI changes.
- No database/schema changes.
- No API changes.
- No dropdown option changes.
- No template upload/replacement.
- No existing field mapping changes.
- No broader document generation refactor.

Expected result
- Generated RE851A documents will always check exactly one amortization checkbox based on CSR → Loan → Amortization.
- All other amortization options remain unchecked.
- The Partially Amortized and Fully Amortized labels will no longer conflict.
- Existing RE851A formatting, spacing, alignment, and checkbox placement remain unchanged.