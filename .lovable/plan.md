## Deep analysis summary

I verified the live deal and generation logs for the current document page.

Findings:
- The CSR checkbox value is being saved correctly for the current deal:
  - `origination_app.doc.is_broker_also_borrower_yes = "true"`
  - `origination_app.doc.is_broker_also_borrower_no = "false"`
- The document-generation payload is deriving the broker capacity correctly:
  - log shows: `agent=false, principal=true, isBrkBorrower=true`
- Therefore the remaining failure is not the UI value, not database persistence, and not the initial field derivation.
- The likely failure point is in the DOCX render phase: the RE851A template condition uses `{{#if or_p_isBrkBorrower}}...{{else}}...{{/if}}`, but field-key resolution can canonicalize `or_p_isBrkBorrower` to the field-dictionary key `or_p_isBrkBorrower`. That can prevent fallback to the checked UI key when both keys exist in the dictionary but only the UI key has saved deal data.

## Corrected Handlebars condition

The safe RE851A template condition should use the checked UI/canonical key directly:

```handlebars
{{#if origination_app.doc.is_broker_also_borrower_yes}}☐{{else}}☑{{/if}} A. Agent in arranging a loan on behalf of another

{{#if origination_app.doc.is_broker_also_borrower_yes}}☑{{else}}☐{{/if}} B. Principal as a borrower on funds from which broker will directly or indirectly benefit...
```

Because the engine already treats `true`, `"true"`, `"Yes"`, `"Y"`, `1`, `"checked"`, and `"on"` as checked values, this condition will render:
- checked CSR value -> A = `☐`, B = `☑`
- unchecked CSR value -> A = `☑`, B = `☐`

## Implementation plan

1. Make a narrow document-generation fix only for this RE851A checkbox.
   - Do not change UI layouts, components, permissions, schema, field mappings, or broad document pipeline behavior.

2. Update conditional alias resolution in `supabase/functions/_shared/tag-parser.ts` so `{{#if or_p_isBrkBorrower}}` resolves from the actual CSR checkbox source when available:
   - Prefer `origination_app.doc.is_broker_also_borrower_yes`
   - Also support `or_p_isBrokerAlsoBorrower_yes`
   - Keep the derived `or_p_brkCapacityPrincipal` fallback
   - Keep `or_p_isBrkBorrower` support for backward compatibility

3. Tighten truthy coercion for this conditional path only.
   - Treat these checked values as true: `true`, `"true"`, `"Yes"`, `"Y"`, `1`, `"1"`, `"checked"`, `"on"`
   - Treat unchecked/empty values as false: `false`, `"false"`, `"No"`, `"N"`, `0`, `"0"`, empty, null

4. Add a precise RE851A A/B fallback immediately after condition processing, scoped only to the broker-capacity labels.
   - If the rendered XML still contains the A/B labels, force the glyph next to A from `or_p_brkCapacityAgent` and the glyph next to B from `or_p_brkCapacityPrincipal`.
   - This protects against Word template fragmentation without changing other checkbox logic.

5. Validate with the current deal/template after implementation.
   - Regenerate RE851A for the current deal.
   - Inspect logs for the derived value and final render path.
   - Confirm the generated DOCX XML has:
     - checked case: A unchecked, B checked
     - unchecked case remains supported by the same logic.

## Scope guard

This will not modify:
- CSR UI
- database schema
- permissions/RLS
- document template storage records
- other document templates
- general checkbox behavior outside the RE851A broker-capacity A/B labels