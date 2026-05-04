## Problem

In RE851D, the question **"Do any of these payments remain unpaid?"** renders both ☑ YES and ☑ NO. The RE851D template uses paired Yes/No checkbox tags (e.g. `pr_li_currentDelinqu_N_yes` / `pr_li_currentDelinqu_N_no`, plus `_glyph` variants — same pattern as `propertytax_delinquent_N_yes`/`_no` at index.ts:1387 and `pr_p_occupancySt_N_yes`/`_no` at index.ts:1172).

The current generator (`supabase/functions/generate-document/index.ts` lines 2237–2311) only publishes the single boolean `pr_li_currentDelinqu_<N>` (and bare). It never emits the `_yes` / `_no` / `_yes_glyph` / `_no_glyph` aliases. As a result, the template's Yes and No checkbox SDTs are not flipped by the resolver, and both retain their static/default checked state — producing ☑ YES ☑ NO regardless of the CSR value.

## Fix (single, minimal change)

In `supabase/functions/generate-document/index.ts`, inside the existing RE851D lien-delinquency block (the same block that currently sets `pr_li_currentDelinqu_*`), additionally publish Yes/No aliases for the `currentDelinq` boolean — mirroring the established pattern used for `propertytax_delinquent` and `pr_p_occupancySt`.

For each lien index `lienIdx` (after line 2258) and each property index `pIdx` (after line 2293), and for the bare alias (after line 2307), emit:

```
pr_li_currentDelinqu_<i>_yes        = "true" if currentDelinq else "false"   (boolean)
pr_li_currentDelinqu_<i>_no         = "true" if !currentDelinq else "false"  (boolean)
pr_li_currentDelinqu_<i>_yes_glyph  = "☒" if currentDelinq else "☐"          (text)
pr_li_currentDelinqu_<i>_no_glyph   = "☐" if currentDelinq else "☒"          (text)
```

Always publish (never conditional on truthiness) so an unchecked CSR value (`false`) explicitly resolves to ☐ YES / ☒ NO and overrides any default-checked SDT in the template.

Also add `pr_li_currentDelinqu_N_yes`, `pr_li_currentDelinqu_N_no`, `pr_li_currentDelinqu_N_yes_glyph`, `pr_li_currentDelinqu_N_no_glyph` to the `_N`-family expansion list near line 2796 so the rewrite/resolution layer expands them per property index.

The existing `pr_li_currentDelinqu_<N>` boolean publisher is **unchanged** (kept for backward compatibility with any template variant that uses the single-boolean tag).

## Out of scope (explicitly NOT changed)

- No UI changes. Source field `pr_li_currentDelinqu_N` (Currently Delinquent checkbox) is unchanged.
- No schema, no Admin Field Dictionary entries added.
- No other delinquency fields, no other RE851D blocks, no other templates touched.
- Existing save/update APIs untouched.

## Files

- `supabase/functions/generate-document/index.ts` — additive lines inside the existing RE851D lien-delinquency block (~lines 2237–2311) and one additive entry in the `_N` expansion list (~line 2796).
