## Implemented — RE851A Subordination Provision Yes/No fix (v2)

- Strengthened the existing `tag-parser.ts` row-scoped safety pass anchored on `There are subordination provisions`:
  - Toggles native Word `<w:sdt>` checkboxes with `<w14:checkbox>` whether the checkbox sits BEFORE or AFTER the literal `Yes` / `No` label.
  - Updates self-closing AND open/close `<w14:checked>`; injects `<w14:checked w14:val="…"/>` when missing.
  - Updates the displayed glyph inside `<w:sdtContent>` to match.
  - Still toggles static glyphs (☐/☑/☒) before AND after `Yes` / `No` for templates that use plain glyphs.
  - All work strictly bounded to a local ~3000-char window from the anchor — no other RE851A checkboxes are affected.
- Kept the existing `generate-document/index.ts` normalization that republishes the boolean under both `ln_p_subordinationProvision` and `loan_terms.subordination_provision` and accepts truthy variants (true/yes/y/1/checked/on).
- Kept the existing template_field_maps row mapping RE851A → `ln_p_subordinationProvision`.
- Edge function `generate-document` redeployed.

Handlebars logic preserved:
- `{{#if ln_p_subordinationProvision}}☑{{else}}☐{{/if}} Yes`
- `{{#if ln_p_subordinationProvision}}☐{{else}}☑{{/if}} No`
