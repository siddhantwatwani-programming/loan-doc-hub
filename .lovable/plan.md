# RE851D – Fix OWNER OCCUPIED YES/NO Checkbox

## Root Cause

The RE851D template uses:
```
{{#if (eq pr_p_occupanc_N "Owner Occupied")}}☒{{else}}☐{{/if}} Yes
{{#if (eq pr_p_occupanc_N "Owner Occupied")}}☐{{else}}☒{{/if}} No
```

But the per-property publisher in `supabase/functions/generate-document/index.ts` (lines 1217–1226) writes the literal value `"Owner"` (not `"Owner Occupied"`) for `pr_p_occupanc_${idx}` and `pr_p_occupanc`. The handlebars `eq` comparison therefore never matches, so YES never renders correctly through the template, and NO behaves inconsistently. CSR dropdown values are: `Owner Occupied`, `Tenant / Other`, `Vacant`, `NA`.

(The downstream "safety pass" at lines 3527–3588 already correctly anchors the two glyph runs after an "Owner Occupied" label using a case-insensitive comparison that accepts `"owner occupied"` or `"owner"`. That path is not the bug — the bug is the template-resolved value.)

## Fix (single edit, backend only)

In `supabase/functions/generate-document/index.ts`, lines 1217–1226: change the `rawValue` written from `"Owner"` to `"Owner Occupied"` so the template `eq` comparison matches exactly.

```ts
fieldValues.set(`pr_p_occupanc_${idx}`, {
  rawValue: isYes ? "Owner Occupied" : "",
  dataType: "text",
});
if (idx === 1) {
  fieldValues.set("pr_p_occupanc", {
    rawValue: isYes ? "Owner Occupied" : "",
    dataType: "text",
  });
}
```

`isYes` is already computed correctly (true only when normalized value equals `"owner occupied"`; `Tenant / Other`, `Vacant`, `NA`, and empty all yield `false`). No other logic changes needed.

## Why this is sufficient for all 5 properties

The publisher loops per property index (`_1` … `_5`), so updating the emitted string fixes PROPERTY #1–#5 simultaneously. The safety-pass fallback already handles both `"owner occupied"` and `"owner"`, so it remains compatible.

## Out of scope (per minimal-change policy)

- No template/document file edits.
- No UI, schema, dictionary, or API changes.
- No changes to `pr_p_occupancySt_${idx}_yes/no/_glyph` aliases (already correct).
- Safety-pass logic at lines 3527–3588 left unchanged (still works).

## Acceptance

- Selecting **Owner Occupied** → YES ☑, NO ☐ for that property.
- Selecting **Tenant / Other**, **Vacant**, **NA**, or leaving empty → YES ☐, NO ☑.
- Works for PROPERTY #1 through #5.
- No regression in other RE851D mappings.

## Files To Change

- `supabase/functions/generate-document/index.ts` (lines 1217–1226 only)
