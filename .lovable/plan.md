## Goal

Add two backend-computed merge tags to RE851D document generation so the LOAN TO VALUE RATIO table (Part 1) auto-fills:

1. **Total Senior Encumbrances** column → `{{ln_p_totalEncumbrance_N}}` = Remaining + Expected (per property index, missing = 0).
2. **Property No.** column → `{{property_number_N}}` = the row index (1, 2, 3, …).

Both are pre-computed in the edge function before substitution — no template-side math, no UI input required.

## Why this is the right place

- `supabase/functions/generate-document/index.ts` already publishes per-index keys for RE851D (e.g. `ln_p_expectedEncumbrance_${idx}`, `ln_p_remainingEncumbrance_${idx}`, `pr_p_totalEncumbrance_${idx}`) inside the property loop guarded by `/851d/i.test(template.name)`.
- The `PART1_TAGS` / `PART2_TAGS` allowlists already restrict which `_N` tags get rewritten per row inside the LTV table and SECURING PROPERTIES region. We just need to add the two new tag names to that allowlist so the per-row `_N` rewriter assigns `_1`, `_2`, … indices to them.
- A `pr_p_totalSeniorEncumb` row already exists in `field_dictionary`, but it is the singular (non-indexed) variant. The Part 1 table is per-property, so we need a new tag family `ln_p_totalEncumbrance_N` (matches the user's spec and the existing `ln_p_*Encumbrance_N` naming).

## Backend changes (`supabase/functions/generate-document/index.ts`)

1. **Publish `ln_p_totalEncumbrance_${idx}`** alongside the existing `pr_p_totalEncumbrance_${idx}` block (~line 1283). Same value (Remaining + Expected, missing treated as 0), `dataType: "currency"`. If both are missing, do not set the key (leaves cell blank — per user "blank or 0").
2. **Publish `property_number_${idx}`** at the top of the per-property loop in the RE851D publisher (`if (/851d/i.test(...))` block ~line 808), set to the string form of `idx` with `dataType: "number"`. Set only for indices that have a corresponding property record so empty rows in the template stay blank (matches existing "indices not present in CSR get NO alias" behavior).
3. **Add to PART1_TAGS / PART2_TAGS allowlists** (~lines 2554 and 2560):
   - `ln_p_totalEncumbrance_N`
   - `property_number_N`
4. **Add to `RE851D_INDEXED_TAGS`** (~line 2523) so the in-property-block rewriter also handles them.
5. **Add to the bare-tag shield** (~line 2991, the list of canonical tags that should resolve to empty if no per-index value exists) so an unindexed `{{ln_p_totalEncumbrance}}` or `{{property_number}}` doesn't leak the literal tag.

No changes to the Part 1 sum/aggregation logic — the calculation is per-row only, exactly as specified.

## Field dictionary registration

Insert two rows into `public.field_dictionary` (section `property`, form_type `primary`) so the keys appear in the Admin → Field Dictionary UI. They are publish-only (computed by the edge function), so they are not bound to any UI input — matching the pattern of the existing `pr_p_totalSeniorEncumb` row.

| field_key | label | data_type | canonical_key |
|---|---|---|---|
| `ln_p_totalEncumbrance` | Total Senior Encumbrances (per property) | `currency` | `ln_p_totalEncumbrance` |
| `property_number` | Property No. (auto-numbered) | `number` | `property_number` |

Migration uses `ON CONFLICT (field_key) DO UPDATE` so it's safe to re-run.

## Verification

1. Open RE851D template — confirm Part 1 "Total Senior Encumbrances" cell contains `{{ln_p_totalEncumbrance_N}}` and "Property No." cell contains `{{property_number_N}}`. (If the user's current template has empty cells in those columns as shown in the screenshot, the user will need to add the merge tags — flagged in the response.)
2. Generate RE851D for a deal with 2+ properties and lien data:
   - Property 1: Remaining=100000, Expected=50000 → Total=150,000.00, No.=1
   - Property 2: Remaining=80000, Expected=blank → Total=80,000.00, No.=2
   - Property 3: blank/blank → row stays blank, No. blank
3. Check edge function logs for the existing `RE851D lien rollup` line and confirm the new totals are not logged as errors.

## Out of scope (Minimal Change Policy)

- No UI changes — these are pure backend-derived values.
- No changes to `pr_p_totalEncumbrance_N` (already published), `pr_p_totalSenior_N`, or `pr_p_totalSeniorPlusLoan_N`.
- No edits to other RE851 templates (RE851A, etc.) — the publisher additions live inside the existing `/851d/i.test(...)` guard.
- No retroactive backfill of `deal_section_values` (these are computed, not stored).

## Files to edit

- `supabase/functions/generate-document/index.ts` (publisher + 3 allowlists + 1 bare-tag shield list)
- New SQL migration to insert the two `field_dictionary` rows
- `mem://features/document-generation/re851d-lien-encumbrance-mapping` — append the two new tag families to the documented mapping
