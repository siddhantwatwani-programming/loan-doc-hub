## Deep RCA Findings

The CSR value is saved and mapped correctly, but the current template-rendering path can still fail for this specific inline Yes/No conditional.

Evidence found so far:

1. CSR storage key is correct
   - UI checkbox: `CSR -> Loan -> Details -> Subordination Provision`
   - UI key: `loan_terms.subordination_provision`
   - Legacy/template key: `ln_p_subordinationProvision`

2. Database field dictionary is correct
   - `field_key`: `ln_p_subordinationProvision`
   - `id`: `e7be2147-6f7a-4295-b558-88216de7ae0b`
   - `data_type`: `boolean`
   - `section`: `loan_terms`

3. RE851A mapping exists
   - Template: `re851a`
   - Template id: `bb09b1c8-aead-4ec6-876e-15e3e54b3f38`
   - Mapped field: `ln_p_subordinationProvision`

4. Current deal payload contains the value
   - Deal: `81c791a4-d988-4afb-b902-d4b600e0c86e`
   - Section: `loan_terms`
   - Stored under field id `e7be2147-6f7a-4295-b558-88216de7ae0b`
   - Stored value: `value_text = "true"`
   - So the backend receives a string boolean, not a native boolean.

5. Existing backend normalization already converts string booleans for this key
   - `"true"`, `"yes"`, `"y"`, `"1"`, `"checked"`, `"on"` => true
   - It republishes both:
     - `ln_p_subordinationProvision`
     - `loan_terms.subordination_provision`

6. The remaining likely root cause is renderer/template structure, not CSR storage
   - The RE851A template uses inline Handlebars blocks beside checkbox glyphs:
     - `{{#if ln_p_subordinationProvision}}☑{{else}}☐{{/if}} Yes`
     - `{{#if ln_p_subordinationProvision}}☐{{else}}☑{{/if}} No`
   - Word often fragments those tokens/glyphs across multiple XML runs or separate paragraphs/table cells.
   - The current engine evaluates simple `{{#if KEY}}...{{else}}...{{/if}}`, but it does not support the proposed helper syntax `{{#if (eq KEY true)}}...`.
   - Prior safety passes are too broad/narrow in the wrong places: they try to force glyphs or native Word controls after rendering, but they may not match the exact RE851A row shape shown in the screenshot where labels/glyphs are split around the sentence and Yes/No labels.

## Minimal Fix Plan

No UI changes. No database schema changes. No template structure changes. No global checkbox refactor.

1. Add a narrowly scoped RE851A pre-render normalizer in `supabase/functions/_shared/tag-parser.ts`
   - Only activate when the XML contains both:
     - `ln_p_subordinationProvision`
     - `There are subordination provisions`
   - Replace only the two known inline conditional blocks for this field with deterministic glyphs before generic conditional cleanup can corrupt or strip them.
   - Use the already-normalized payload value from:
     - `ln_p_subordinationProvision`
     - fallback `loan_terms.subordination_provision`
   - Result:
     - checked/true => `☑ Yes` and `☐ No`
     - unchecked/false => `☐ Yes` and `☑ No`

2. Make the existing row-scoped safety pass more exact, not broader
   - Limit the pass to the paragraph/table-row window containing `There are subordination provisions`.
   - Do not scan the next ~3000 characters blindly if the row/paragraph boundary is available.
   - This prevents accidental changes to other RE851A Yes/No checkbox logic.

3. Preserve the current template logic as the supported final logic

```handlebars
There are subordination provisions.

{{#if ln_p_subordinationProvision}}☑{{else}}☐{{/if}} Yes
{{#if ln_p_subordinationProvision}}☐{{else}}☑{{/if}} No
```

Do not switch to `{{#if (eq ln_p_subordinationProvision true)}}`, because this engine currently strips/does not evaluate sub-expression conditionals.

4. Add targeted logging for verification only
   - Log the resolved value and type for `ln_p_subordinationProvision` during RE851A generation.
   - Example expected log for the current checked case:
     - raw source: `"true"`
     - normalized boolean: `true`
     - output glyphs: Yes=`☑`, No=`☐`

5. Test both cases on the current deal/template
   - Case A: stored `value_text = "true"`
     - Generate RE851A.
     - Inspect generated DOCX XML and confirm near `There are subordination provisions`:
       - Yes checkbox/glyph is checked.
       - No checkbox/glyph is unchecked.
   - Case B: stored `value_text = "false"` or unchecked UI value
     - Generate RE851A after toggling/saving unchecked or by using a safe test path.
     - Inspect generated DOCX XML and confirm:
       - Yes checkbox/glyph is unchecked.
       - No checkbox/glyph is checked.

## Deliverable After Implementation

I will provide:

- Exact root cause with the confirmed payload value/type.
- The final corrected Handlebars logic to keep in the template.
- The minimal backend rendering correction made.
- Testing proof for checked and unchecked output.
- Confirmation that no other RE851A checkbox logic was changed.