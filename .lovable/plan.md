## Implemented — RE851A Subordination Provision Yes/No fix

- Added the missing RE851A → `ln_p_subordinationProvision` row in `template_field_maps`, so the field is included in the RE851A generation payload.
- Extended the existing Subordination Provision row safety pass in `supabase/functions/_shared/tag-parser.ts` to also toggle native Word `<w:sdt>` checkbox controls (sets `w14:checked` and the displayed glyph) immediately preceding the literal "Yes" and "No" labels, in addition to the existing static-glyph handling. Strictly scoped to the row anchored on "There are subordination provisions" — no other RE851A checkbox logic is touched.
- Kept the existing `generate-document/index.ts` normalization that republishes the boolean under both `ln_p_subordinationProvision` and `loan_terms.subordination_provision` and accepts truthy variants (true/yes/y/1/checked/on).
- The Handlebars condition remains:
  - `{{#if ln_p_subordinationProvision}}☑{{else}}☐{{/if}} Yes`
  - `{{#if ln_p_subordinationProvision}}☐{{else}}☑{{/if}} No`
- Edge function `generate-document` redeployed.
