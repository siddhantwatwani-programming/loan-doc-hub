## Findings

I reviewed the uploaded mapped template and generated RE851D output, plus the current document-generation code and live CSR data for loan `DL-2026-0235`.

Root cause:

- The template uses `{{#if (eq pr_p_performeBy_N "Broker")}}...{{/if}}` correctly inside each PROPERTY section.
- The `_N -> _1/_2/_3...` preprocessor already includes `pr_p_performeBy_N` in its indexed tag allowlist.
- The live CSR data currently has:
  - `property1` Performed By = `Broker`
  - `property2` Performed By = `Third Party`
  - no saved Performed By value found for properties 3-5 in the database query
- The generator publishes `pr_p_performedBy_1` and mirrors to legacy misspelled `pr_p_performeBy_1`, but it only publishes the misspelled alias when the canonical `pr_p_performedBy_N` exists.
- The CSR field dictionary key is already the legacy key `pr_p_performeBy`, so for composite keys like `property2::field_id`, the bridge creates `property2.appraisal_performed_by` but does not reliably create canonical `pr_p_performedBy_2`. As a result, the mirror path can miss `pr_p_performeBy_2`.
- The anti-fallback shield does not currently include `pr_p_performeBy` / `pr_p_performedBy`, so a missing `pr_p_performeBy_2` can fall back to the base `pr_p_performeBy` value from Property #1 (`Broker`), causing every PROPERTY block to render “BPO Performed by Broker” / “N/A”.

## Plan

1. Update only `supabase/functions/generate-document/index.ts` in the existing RE851D multi-property publisher.

2. Make Performed By publishing explicit and bidirectional per property:
   - For each `propertyK`, read the source value from `propertyK.appraisal_performed_by`.
   - Publish both aliases:
     - `pr_p_performedBy_K`
     - `pr_p_performeBy_K`
   - Do this per index only; no cross-property fallback.

3. Add Performed By to the existing RE851D anti-fallback shield:
   - Add `pr_p_performedBy`
   - Add `pr_p_performeBy`
   - This ensures missing values for Property #K become blank instead of falling back to Property #1/base values.

4. Add Performed By keys to the RE851D `effectiveValidFieldKeys` suffixed-key seed:
   - `pr_p_performedBy_1..5`
   - `pr_p_performeBy_1..5`
   - This makes the conditional resolver treat each indexed tag as an exact field key and prevents resolver fallback to the unsuffixed field.

5. Keep the template logic unchanged:
   - `{{#if (eq pr_p_performeBy_N "Broker")}}BPO Performed by Broker{{/if}}`
   - `{{#if (eq pr_p_performeBy_N "Broker")}}N/A{{/if}}`
   - The preprocessor will continue to rewrite `_N` to `_1`, `_2`, `_3`, `_4`, `_5` based on the PROPERTY section.

6. Update the existing project memory for RE851D Performed By mapping to record the no-fallback requirement.

## Expected result

For loan `DL-2026-0235` with current data:

```text
Property #1 pr_p_performeBy_1 = Broker      -> BPO Performed by Broker / N/A prints
Property #2 pr_p_performeBy_2 = Third Party -> conditional false, blank output
Property #3 pr_p_performeBy_3 = blank/missing -> conditional false, blank output
Property #4 pr_p_performeBy_4 = blank/missing -> conditional false, blank output
Property #5 pr_p_performeBy_5 = blank/missing -> conditional false, blank output
```

If Property #3 is later set to `Broker`, then only Property #3 will print the Broker text; it will not affect any other PROPERTY section.

No UI, schema, API, template, unrelated document-generation logic, or database migration changes are planned.