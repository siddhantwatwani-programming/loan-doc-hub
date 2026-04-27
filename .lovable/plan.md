Findings from the uploaded generated DOCX

Root cause
- The CSR value is being saved and passed into generation correctly, but the generated RE851A layout separates the Subordination Provision anchor text from the Yes/No checkboxes across a page break / paragraph boundary.
- The current backend safety pass only scans a fixed window after the text "There are subordination provisions". In the uploaded v5 DOCX, the Yes/No pair appears later on Page 2, so the safety pass does not reliably reach or target those checkboxes.
- The template engine’s normal `{{#if ln_p_subordinationProvision}}...{{else}}...{{/if}}` logic is not the failing layer for the uploaded file; the rendered output shows plain unchecked Word checkboxes, meaning the relevant Yes/No checkbox blocks survived as static/native checkbox UI instead of being driven by the conditional result.

Evidence already verified
- Database/template mapping is correct:
  - RE851A template id: `bb09b1c8-aead-4ec6-876e-15e3e54b3f38`
  - mapped field key: `ln_p_subordinationProvision`
  - data type: `boolean`
  - label: `SUBORDINATION PROVISION`
- CSR stored value for the user’s deal is present:
  - deal id: `81c791a4-d988-4afb-b902-d4b600e0c86e`
  - `ln_p_subordinationProvision` stored under `deal_section_values.loan_terms`
  - stored value: `value_text = "true"` as a JSON string
- Runtime request generated v5 successfully, and logs confirm `ln_p_subordinationProvision` is included in the resolved field key set.
- Uploaded DOCX visual proof:
  - Page 1 contains: “There are subordination provisions...”
  - Page 2 contains: unchecked `Yes` and unchecked `No`
  - Expected for stored `true`: `Yes` checked, `No` unchecked

Minimal implementation plan

1. Keep all existing UI, schema, APIs, template structure, and other checkbox logic unchanged.

2. Modify only the RE851A Subordination Provision safety pass in `supabase/functions/_shared/tag-parser.ts`:
   - Keep the current value normalization for `ln_p_subordinationProvision` / `loan_terms.subordination_provision`.
   - Replace the fragile fixed-size anchor window with a tightly scoped section window:
     - start at the literal anchor `There are subordination provisions`
     - end before the next major RE851A section marker, e.g. `PART 4 MULTI-LENDER TRANSACTIONS`, or a conservative maximum fallback if the marker is missing
   - Within only that section, force the checkbox next to `Yes` and `No` to the expected state.
   - Preserve the existing single-SDT matcher so adjacent checkboxes are processed independently.
   - Support the uploaded DOCX layout where the checkbox is in a separate paragraph immediately before the text run containing `Yes` / `No`.

3. Add a targeted diagnostic log in `supabase/functions/generate-document/index.ts` for RE851A generation only:
   - log raw source value and normalized boolean for `ln_p_subordinationProvision`
   - log as non-sensitive evidence for future debugging
   - do not change payload shape or field storage

4. Add focused regression tests for the helper behavior, not a broad refactor:
   - checked case: stored `"true"` results in `Yes = checked`, `No = unchecked`
   - unchecked case: stored `"false"` results in `Yes = unchecked`, `No = checked`
   - include a fixture that mimics the uploaded DOCX structure: anchor text, page/paragraph separation, then separate checkbox blocks before `Yes` and `No`

5. Deploy the `generate-document` backend function and validate:
   - regenerate RE851A for the existing deal where stored value is `true`
   - inspect the resulting DOCX XML / parsed visual output to confirm `Yes` is checked and `No` is unchecked
   - if possible without mutating the user’s current deal, run the same rendering helper/test fixture for `false` to prove the inverse behavior

Final working fix direction
- This is a backend rendering correction, not a database/schema/UI/template rewrite.
- The field mapping is correct. The fix is to make the existing RE851A-specific checkbox finalizer section-scoped instead of fixed-window scoped, so it reaches the Yes/No checkboxes even when Word pushes them onto the next page/paragraph.