# RE851D Owner Occupied Yes/No — Per-Property Mapping Fix

## Problem
The RE851D template uses `(eq pr_p_occupanc_N "Owner Occupied")` per property, but the edge function never publishes `pr_p_occupanc_${idx}`. Result: every property falls into the `else` branch → "No" is always checked across all properties.

## Fix (single, surgical edge-function change)

In `supabase/functions/generate-document/index.ts`, inside the existing per-property occupancy alias block (around lines 1162–1176 — the same block that already publishes `pr_p_occupancySt_${idx}_yes/_no/_glyph`), also publish the exact key the template reads:

```ts
// Per-property normalized occupancy string for template
//   (eq pr_p_occupanc_N "Owner Occupied")
// Owner Occupied  => "Owner Occupied"  (Yes ☒)
// Tenant/Vacant/NA/empty => "" (else branch => No ☒)
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

`isYes` is already computed in that block as `occRaw === "owner occupied"`, sourced strictly per-property from `pr_p_occupancySt_${idx}` / `pr_p_occupanc_${idx}` / `${prefix}.occupancyStatus` / `${prefix}.appraisal_occupancy` (no cross-index fallback — preserves the multi-property isolation rule).

## Why this works
- Template stays untouched (no Word/SDT/XML risk).
- Each property index gets its own normalized value → checkboxes render independently per property.
- All non-"Owner Occupied" values (Tenant / Other, Vacant, NA, empty, legacy values) yield `""`, so `(eq ... "Owner Occupied")` is false → "No" checked.
- `_yes/_no/_glyph` aliases already published remain available for any future template variant.

## What does NOT change
- Field dictionary entries
- UI dropdown key (`pr_p_occupancySt`) and the 4-value option list (already restricted earlier)
- RE851D template
- `legacyKeyMap.ts`
- Any other section, form, or document

## Files touched
- `supabase/functions/generate-document/index.ts` — append ~12 lines inside one existing block.
