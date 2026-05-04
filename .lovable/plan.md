## Problem

Two related issues:

1. CSR's "Property Details" Occupancy dropdown still uses the old 3-value list `['Owner Occupied', 'Vacant', 'N/A']`, which doesn't match the spec's 4-value list and saves `"N/A"` instead of `"NA"`.
2. The RE851D template Owner-Occupied YES/NO checkboxes are sometimes wrong because the template authored `{{#i(eq …)}}` (typo) and/or compares to `"Owner"` instead of `"Owner Occupied"`. The data layer already publishes `pr_p_occupanc_N` correctly, but a typo'd template token won't render.

## Fix

### 1. UI dropdown — `src/components/deal/PropertyDetailsForm.tsx` (line 45)

Change to the 4-value canonical list to match `PropertyModal.tsx`:

```ts
const OCCUPANCY_OPTIONS = ['Owner Occupied', 'Tenant / Other', 'Vacant', 'NA'];
```

No other UI changes.

### 2. Backend safety pass — `supabase/functions/generate-document/index.ts`

Inside the existing RE851D-gated block (the same area where `Do any of these payments remain unpaid?` and Amortization safety passes already live), add a per-property safety pass for the Owner Occupied question:

- For each PROPERTY #K region detected by the existing `regions.props`, find the literal anchor text **"Owner Occupied"** (the question label in the RE851D form).
- Walk forward in a bounded window (~4 KB) to the next two `<w:r>` runs that each contain exactly one ☐/☑/☒ glyph.
- Read `fieldValues.get('pr_p_occupanc_' + K)?.rawValue`. If it equals `"Owner Occupied"` (case-insensitive), set first run = ☑ / second = ☐. Otherwise first = ☐ / second = ☑.
- Queue rewrites through the existing `rewrites[]` mechanism.
- Increment a debug counter and log per occurrence.

Also normalize a legacy `"N/A"` value to `"NA"` so older property records map to NO without UI re-save:

```ts
// in the existing per-property occupancy block (~line 1179)
const occRawNorm = occRaw === "n/a" ? "na" : occRaw;
const isYes = occRawNorm === "owner occupied";
```

This guarantees exactly one of YES / NO is checked per property regardless of whether the template tag used a typo (`{{#i(eq …)}}`) or compared to `"Owner"`.

### Strict scoping

- All backend edits live inside the existing `if (/851d/i.test(template.name || ""))` block.
- No schema, dictionary, or other template changes.
- The dropdown change is the only UI edit; existing saved values continue to work.

## Files to change

- `src/components/deal/PropertyDetailsForm.tsx` — line 45 dropdown values.
- `supabase/functions/generate-document/index.ts` — `N/A` → `NA` normalization in the existing occupancy block, plus a new per-property safety pass for the Owner Occupied YES/NO glyph runs.

## Expected outcome

- CSR Occupancy dropdown lists exactly: Owner Occupied / Tenant / Other / Vacant / NA.
- RE851D Owner Occupied YES is checked iff the property's occupancy is "Owner Occupied"; NO is checked otherwise. Never both. Works for every property index.
