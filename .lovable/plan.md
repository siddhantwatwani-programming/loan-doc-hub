Root cause found so far

- The CSR value is being saved and passed through the backend, but it is stored as text: the current deal has `ln_p_subordinationProvision` saved as `value_text: "false"` for the Loan section.
- The document generation logs confirm the payload path is present and normalized correctly:
  - `Derived ln_p_subordinationProvision from "false" (rawType=string): normalized=false`
  - `Subordination Provision safety pass executed: isSubordination=false ... normalizedParas=1`
- Therefore this is not a missing payload problem and not a field mapping problem.
- The remaining issue is in template/rendering behavior: the template can produce a visually incomplete unchecked-state row when the `No` label does not have a reliable checkbox artifact immediately attached, and the current parser only supports simple `{{#if field}}` blocks. It does not currently evaluate explicit helper syntax like `{{#if (eq ln_p_subordinationProvision "true")}}`.

Plan to fix

1. Add explicit equality conditional support in the DOCX tag parser
   - Support these RE851A-safe forms:
     - `{{#if (eq ln_p_subordinationProvision true)}}...{{else}}...{{/if}}`
     - `{{#if (eq ln_p_subordinationProvision "true")}}...{{else}}...{{/if}}`
     - same support for `loan_terms.subordination_provision`
   - Compare booleans safely so string `"false"`, `"0"`, `"No"`, blanks, and unchecked values evaluate as false.
   - Keep existing simple `{{#if field}}` behavior unchanged for other templates.

2. Make the checkbox conditional consolidation handle `eq` expressions
   - Extend the existing checkbox-specific normalizer so Word-split runs like this still collapse correctly:
     ```text
     {{#if (eq ln_p_subordinationProvision "true")}}☐{{else}}☑{{/if}} No
     ```
   - Scope the change to checkbox glyph branches only so other conditional content is not affected.

3. Strengthen the RE851A Subordination Provision safety pass
   - Keep the current anchor scope around `There are subordination provisions.`
   - Ensure the final output in that local section always resolves to exactly:
     - checked CSR value: `☑ Yes` and `☐ No`
     - unchecked CSR value: `☐ Yes` and `☑ No`
   - Include the uploaded/live layout case where `No` is a bare label with no checkbox glyph before it.

4. Add regression tests
   - Add tests for:
     - current simple template logic with `rawValue: "false"`
     - explicit boolean check: `(eq ln_p_subordinationProvision true)`
     - explicit string check: `(eq ln_p_subordinationProvision "true")`
     - live screenshot layout where `Yes` has a glyph but `No` is bare text
   - Assert unchecked renders `☐ Yes` and `☑ No`.

5. Deploy and validate
   - Run the document-generation tests.
   - Deploy the `generate-document` backend function.
   - Regenerate RE851A for the current deal and verify logs show:
     - payload value for `ln_p_subordinationProvision`
     - normalized boolean value
     - final Subordination Provision pass execution.

Expected outcome

- CSR checked: `Yes = ☑`, `No = ☐`
- CSR unchecked: `Yes = ☐`, `No = ☑`
- The fix will cover both the current template syntax and the requested explicit `eq` syntax without requiring database/schema changes.