## Problem

Template RE851D's "NAME OF APPRAISER (IF KNOWN TO BROKER)" / "ADDRESS OF APPRAISER" rows use:
```
{{#if (eq pr_p_performeBy_N "Broker")}}BPO Performed by Broker{{/if}}
{{#if (eq pr_p_performeBy_N "Broker")}}N/A{{/if}}
```
But the edge function (`supabase/functions/generate-document/index.ts`) never publishes the `pr_p_performeBy_N` (or correctly-spelled `pr_p_performedBy_N`) alias for any property index. The CSR value is stored at `property{N}.appraisal_performed_by` (see `PropertySectionContent.tsx:71` and `prKeyToSuffix` map lines 224–257) but no entry maps a `pr_p_performe…` prefix to the `appraisal_performed_by` short suffix, so the conditional silently fails for every property.

Per the user's "do not change any logic" constraint and the existing memory `re851d-multi-property-mapping` (strict per-index publisher, no cross-bleed), the fix must publish the alias **per property index** through the same RE851D publisher loop, not via global broadcast.

## Fix (single edge-function change, additive)

In `supabase/functions/generate-document/index.ts`:

1. **Add to `prKeyToSuffix` map (lines 224–257):**
   ```ts
   'pr_p_performedBy': 'appraisal_performed_by',
   ```
   This causes the existing RE851D per-index loop (`for (const idx of sortedPropIndices)` at line 984, calling `suffixToPrKey` mirror at lines 996–1001) to automatically publish `pr_p_performedBy_${idx}` from `property${idx}.appraisal_performed_by` for each property that has a CSR value — and to omit the alias for indices without one (matching the strict per-index contract).

2. **Mirror to legacy misspelling inside the same loop** (immediately after lines 996–1001), so the existing template tag `pr_p_performeBy_N` resolves without requiring a template edit:
   ```ts
   const pb = fieldValues.get(`pr_p_performedBy_${idx}`);
   if (pb && pb.rawValue) {
     fieldValues.set(`pr_p_performeBy_${idx}`, { rawValue: pb.rawValue, dataType: pb.dataType || "text" });
   }
   ```

## What this delivers

- `pr_p_performedBy_1..5` and `pr_p_performeBy_1..5` resolve to each property's "Performed By" dropdown value (e.g. `"Broker"`, `"Appraiser"`, `"Other"`).
- Template `{{#if (eq pr_p_performeBy_N "Broker")}}…{{/if}}` now renders "BPO Performed by Broker" / "N/A" only for properties whose dropdown = `Broker`; all other properties render blank.
- Indices without a CSR property record never get the alias set → row stays blank (no cross-bleed from property #1).
- Template `.docx`, UI, schema, and field-dictionary unchanged.

## Files Modified

- `supabase/functions/generate-document/index.ts` — two small additions inside the existing RE851D publisher (no removals, no logic changes elsewhere).

## Memory update

Append a new line to `mem://index.md` referencing a new memory file `mem://features/document-generation/re851d-performed-by-mapping` describing the per-index `pr_p_performedBy_N` / legacy `pr_p_performeBy_N` publisher derived from `property{N}.appraisal_performed_by`.
