I found why the last change can still leave the RE851D questionnaire checkboxes unselected:

- The latest generation logs show only the `remain unpaid` safety pass fired: `1 pairs forced`.
- There are no logs for the `cure-delinquency` or `encumbrance-of-record` safety passes, which means those anchors/controls were not found in the actual stored template variant.
- The current logic publishes glyph fields, but the stored RE851D template appears to rely on a mix of static YES/NO labels, conditionals, and/or native checkbox controls. Publishing `_yes_glyph` alone is not enough when the template does not directly reference those exact tags or when Word converts glyphs into SDT checkbox controls after rendering.
- I also verified the deal data exists for the current deal: lien1 and lien2 are attached to property1/property2, both have `paid_by_loan=true`, `delinquencies_how_many>0`, `slt_paid_off=true`, and remaining balances. So this is a rendering/template-anchor issue, not missing CSR data.

Plan:

1. Inspect the stored RE851D template DOCX from the `templates` bucket and the latest generated DOCX from `generated-docs`.
   - Extract `word/document.xml` read-only.
   - Identify the exact checkbox structures around:
     - `Are there any encumbrances of record`
     - `60 days or more delinquent`
     - `Do any of these payments remain unpaid`
     - `cure the delinquency`
   - Confirm whether each pair is authored as merge tags, inline `{{#if}}` blocks, static glyphs, or Word SDT checkboxes.

2. Update `supabase/functions/generate-document/index.ts` with a generalized RE851D post-render questionnaire safety pass.
   - Reuse the existing property-region detection.
   - For each PROPERTY #K block, force all questionnaire YES/NO pairs from the published per-property values:
     - Q1 `pr_li_encumbranceOfRecord_K`
     - Q2 `pr_li_delinqu60day_K`
     - Q4 `pr_li_currentDelinqu_K`
     - Q5 `pr_li_delinquencyPaidByLoan_K`
   - Support all observed template shapes:
     - native Word SDT checkbox before label
     - native Word SDT checkbox after label
     - bare checkbox glyph before/after label
     - inline label text like `☐ YES` / `YES ☐`
   - Update both the visible glyph and `<w14:checked>` state so Word displays the selected checkbox correctly.

3. Fix anchor matching so the pass is resilient to the stored template wording.
   - Use flexible text matching instead of one exact phrase.
   - Include likely variants for Q2 and Q5, such as:
     - `60 days or more delinquent`
     - `60 day` / `60-day`
     - `paid by this loan`
     - `cure the delinquency`
   - Keep matching bounded inside each property block to avoid cross-property leakage.

4. Add focused diagnostics for RE851D questionnaire rendering.
   - Log one line per question/property showing:
     - property index
     - source boolean value
     - whether the YES/NO controls were found
     - whether the pair was forced
   - This will make the next generation immediately show which question, if any, still does not match the stored template structure.

5. Preserve the existing UI, field keys, schema, and template layout.
   - No database changes.
   - No frontend changes.
   - No field key renames.
   - No layout/design edits to the document template unless inspection proves a template-only malformed control is impossible to fix safely in code.

After approval, I’ll implement this in the document-generation backend function and then you can regenerate RE851D to verify the YES/NO checkboxes populate per property.