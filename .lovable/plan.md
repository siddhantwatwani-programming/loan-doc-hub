## Goal
Fix only the RE851A row:

"There are subordination provisions. Yes / No"

so it reflects the CSR Loan → Detail checkbox value:
- CSR checked → Yes checked, No unchecked
- CSR unchecked → Yes unchecked, No checked

No UI, database schema, permissions, or unrelated document checkbox logic will be changed.

## Findings from analysis
- The CSR value is saving correctly for the current deal.
- The RE851A template mapping exists for `ln_p_subordinationProvision`.
- The generated document still shows both Yes and No unchecked, which means the current generation pass is not reliably reaching/toggling the live RE851A checkbox controls.
- The likely failure is in the generated DOCX XML shape: the row uses Word checkbox controls / split XML, and the existing post-processing is too narrow for the live template structure.

## Correct Handlebars logic to preserve/use
```handlebars
{{#if ln_p_subordinationProvision}}☑{{else}}☐{{/if}} Yes
{{#if ln_p_subordinationProvision}}☐{{else}}☑{{/if}} No
```

If the template uses the database-style alias, it should resolve to the same boolean:
```handlebars
{{#if loan_terms.subordination_provision}}☑{{else}}☐{{/if}} Yes
{{#if loan_terms.subordination_provision}}☐{{else}}☑{{/if}} No
```

Target key for RE851A will remain:
```text
ln_p_subordinationProvision
```

## Implementation plan
1. Keep the existing value normalization in `generate-document/index.ts`:
   - Read from `ln_p_subordinationProvision` and `loan_terms.subordination_provision`.
   - Normalize truthy values like `true`, `yes`, `1`, `checked`, `on`.
   - Publish the resolved boolean back under both keys.

2. Replace the current narrow Subordination Provision safety pass in `supabase/functions/_shared/tag-parser.ts` with a more reliable row-scoped version:
   - Locate only the row/paragraph containing the literal text `There are subordination provisions`.
   - Expand to the containing Word table row when available, otherwise use the smallest local paragraph/window fallback.
   - Do not scan or modify the rest of RE851A.

3. Within that single scoped row, toggle only the two checkboxes associated with `Yes` and `No`:
   - Support static glyphs: `☐`, `☑`, `☒`.
   - Support native Word checkbox SDTs: `<w:sdt>` / `<w14:checkbox>`.
   - Handle both self-closing and non-self-closing checked state XML.
   - If a native checkbox is missing `<w14:checked>`, insert the correct checked state inside its checkbox definition.
   - Update both the internal checked state and the displayed glyph.

4. Add a tight fallback for label order/layout variation:
   - Prefer checkbox immediately before `Yes` / `No`.
   - Also support checkbox immediately after the labels if the template XML orders controls differently from the visual layout.
   - Still remain scoped to the one Subordination Provision row only.

5. Validate after deployment:
   - Regenerate RE851A for the current deal.
   - Confirm the saved value is `true` and the output should show:
     ```text
     ☑ Yes
     ☐ No
     ```
   - Confirm no other RE851A checkbox rows are touched by the new logic.

## Expected result
The generated RE851A document will correctly populate the Subordination Provision Yes/No checkboxes from the CSR checkbox while leaving all other template mappings and checkbox behavior unchanged.