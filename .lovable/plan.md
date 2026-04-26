I found an important clue in the current generated output screenshot and backend logs:

- The backend is receiving the CSR checkbox as checked and deriving `isBrkBorrower=true` correctly.
- The current latest generation log says: `Derived broker capacity checkboxes from "true": agent=false, principal=true, isBrkBorrower=true`.
- The remaining failure is therefore in the RE851A DOCX rendering/label matching layer, not in the CSR save value.
- The screenshot shows the B label as `B. *Principal...` with an asterisk before `Principal`. The current fallback label bindings only cover `B. Principal...` without the asterisk, so the B checkbox can remain as its static unchecked glyph even though the data is true.

Plan to fix, with minimal scope only for this issue:

1. Add exact RE851A B-label variants that include the asterisk
   - Extend only the runtime RE851A Part 2 label map in `generate-document`.
   - Add variants such as:
     - `B. *Principal as a borrower on funds from which broker will directly or indirectly benefit`
     - `B. *Principal as a borrower on funds from which broker will benefit`
     - `B. *Principal as a borrower on funds`
     - `B. *Principal as a borrower`
   - Map those variants only to `or_p_brkCapacityPrincipal`.
   - Do not change any UI, database schema, permissions, or unrelated template mappings.

2. Add a final RE851A-only safety pass for the two broker-capacity lines
   - After conditionals and label replacements, before checkbox glyph conversion, force only these two label-adjacent glyphs to the derived state:
     - A line: checked when broker is not also borrower.
     - B line: checked when broker is also borrower.
   - Scope this by literal A/B label text, including optional `*` before `Principal`, so no other RE851A checkbox logic is affected.
   - If the template contains both a static unchecked glyph and a generated conditional glyph, collapse that local pair to one correct glyph instead of letting the static glyph win.

3. Keep the condition truthy logic intact and confirm it supports all required checked values
   - Preserve the existing accepted true values:
     - `true`, `"true"`, `"Yes"`, `"Y"`, `1`, plus `checked` and `on`.
   - Confirm the field aliases still resolve from:
     - `origination_app.doc.is_broker_also_borrower_yes`
     - `or_p_isBrokerAlsoBorrower_yes`
     - `or_p_isBrkBorrower`
     - `or_p_brkCapacityPrincipal`

4. Provide the corrected Handlebars template condition
   - The safe template condition is:

```handlebars
{{#if or_p_isBrkBorrower}}☐{{else}}☑{{/if}} A. Agent in arranging a loan on behalf of another
{{#if or_p_isBrkBorrower}}☑{{else}}☐{{/if}} B. *Principal as a borrower on funds from which broker will directly or indirectly benefit...
```

   - If we want it to bind directly to the CSR persistence key, the equivalent is:

```handlebars
{{#if origination_app.doc.is_broker_also_borrower_yes}}☐{{else}}☑{{/if}} A. Agent in arranging a loan on behalf of another
{{#if origination_app.doc.is_broker_also_borrower_yes}}☑{{else}}☐{{/if}} B. *Principal as a borrower on funds from which broker will directly or indirectly benefit...
```

5. Validate both states
   - Test with the CSR checkbox checked: A = `☐`, B = `☑`.
   - Test with the CSR checkbox unchecked: A = `☑`, B = `☐`.
   - Add targeted regression coverage for the exact `B. *Principal...` label so this does not regress.
   - Deploy the updated `generate-document` backend function after the fix.