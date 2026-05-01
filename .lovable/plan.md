## Goal

Make the RE851D Property Type checkboxes populate correctly per property index (`_1`, `_2`, …). Today the CSR → RE851D mapping logic already exists and publishes the right per-index keys, but the merge tags `{{property_type_*_N}}` are missing from the RE851D region-scoped `_N` rewriter allowlists, so they never get rewritten to `_1` / `_2` / … inside PART 1 / PART 2 / PROPERTY #K regions and resolve blank in the document.

## Root cause (verified in `supabase/functions/generate-document/index.ts`)

1. **Mapping logic is already correct (lines ~1043–1132)** — for each property `idx` the publisher reads `pr_p_propertyType_${idx}` (etc.), maps the CSR dropdown value to one of:
   - `property_type_sfr_owner` (SFR 1-4)
   - `property_type_sfr_non_owner` (Condo / Townhouse)
   - `property_type_commercial` (Multi-family, Commercial, Commercial Income, Mixed-use)
   - `property_type_sfr_zoned` (Land SFR Residential)
   - `property_type_land_zoned` (Land Residential, Land Commercial)
   - `property_type_land_income` (Land Income Producing)
   - `property_type_other` + `property_type_other_text` (any other value, incl. Mobile Home / Farm / Restaurant / Group Housing)
   
   …and sets, for every target `t`:
   - `${t}_${idx}` = `"true"` / `"false"` (boolean)
   - `${t}_${idx}_glyph` = `☒` / `☐` (text)
   - and `property_type_other_text_${idx}` for the OTHER fallback.

2. **Bare-tag shield already covers them (lines ~1418–1421)** so unindexed leaks resolve to empty.

3. **Missing piece — RE851D region allowlists (lines ~2539–2587):**
   - `RE851D_INDEXED_TAGS` (used inside each `PROPERTY #K` block) does NOT include any `property_type_*_N` family.
   - `PART1_TAGS` / `PART2_TAGS` also exclude them — but per the user's spec the checkboxes appear in the per-property block, so PROPERTY #K coverage is the critical fix.
   
   Result: a tag like `{{property_type_sfr_owner_N}}` inside PROPERTY #2 stays as `_N`, never becomes `_2`, and the bare-tag shield blanks it.

4. **Glyph rendering already works** — `_shared/docx-processor.ts::convertGlyphsToSdtCheckboxes` converts the rendered `☒` / `☐` text into interactive `<w:sdt><w14:checkbox>` elements post-substitution. So the template can use either:
   - `{{property_type_sfr_owner_N_glyph}}` → renders `☒` / `☐` → auto-converted to a real Word checkbox, OR
   - `{{property_type_sfr_owner_N}}` → renders literal `true` / `false` (legacy behavior; not recommended for the visible cell).

## Backend changes (single file: `supabase/functions/generate-document/index.ts`)

Add the eight property-type tag families (both the boolean form AND the `_glyph` form) to `RE851D_INDEXED_TAGS`, and to `PART1_TAGS` / `PART2_TAGS` as a defensive measure in case the user later moves these checkboxes into the PART 1 or PART 2 row blocks:

```
property_type_sfr_owner_N         property_type_sfr_owner_N_glyph
property_type_sfr_non_owner_N     property_type_sfr_non_owner_N_glyph
property_type_sfr_zoned_N         property_type_sfr_zoned_N_glyph
property_type_commercial_N        property_type_commercial_N_glyph
property_type_land_zoned_N        property_type_land_zoned_N_glyph
property_type_land_income_N       property_type_land_income_N_glyph
property_type_other_N             property_type_other_N_glyph
property_type_other_text_N
```

Tag scanning is longest-first (existing behavior), so the `_N_glyph` variants will be matched before the bare `_N` variants — no prefix collision.

No changes to:
- The existing CSR-value → target-key mapping (already correct, including the OTHER fallback).
- The bare-tag shield (already covers the eight families).
- The mutual-exclusivity rule (already enforced — only the matched target gets `true`/`☒`, all others get `false`/`☐`).
- The glyph → interactive SDT converter (already handles ☒/☐ post-substitution).

## Field dictionary registration

Insert nine rows into `public.field_dictionary` (section `property`, form_type `primary`) so the tags appear in Admin → Field Dictionary → Property and are formally recognized as document fields. They are publish-only (computed by the edge function from `pr_p_propertyType`), no UI binding.

| field_key | label | data_type |
|---|---|---|
| `property_type_sfr_owner` | Property Type — SFR Owner-occupied (checkbox) | `boolean` |
| `property_type_sfr_non_owner` | Property Type — SFR Non-owner / Condo (checkbox) | `boolean` |
| `property_type_sfr_zoned` | Property Type — Land SFR Zoned (checkbox) | `boolean` |
| `property_type_commercial` | Property Type — Commercial / Multi-family / Mixed-use (checkbox) | `boolean` |
| `property_type_land_zoned` | Property Type — Land Residential / Commercial (checkbox) | `boolean` |
| `property_type_land_income` | Property Type — Land Income Producing (checkbox) | `boolean` |
| `property_type_other` | Property Type — Other (checkbox) | `boolean` |
| `property_type_other_text` | Property Type — Other (text) | `text` |

Migration uses `ON CONFLICT (field_key) DO UPDATE` so it's safe to re-run.

## Verification

1. Open the RE851D template — confirm each PROPERTY #K block uses the `_glyph` form for the visible checkbox (e.g. `{{property_type_sfr_owner_N_glyph}}`) and `{{property_type_other_text_N}}` next to the OTHER row. (If the template currently uses the bare `{{property_type_sfr_owner_N}}` form, that will render `true`/`false` literally — the user should switch those cells to the `_glyph` variant for the checkbox visual. Flagged in the response.)
2. Generate RE851D for a deal with 3 properties:
   - Property 1 = `SFR 1-4` → only `property_type_sfr_owner_1` checked
   - Property 2 = `Commercial Income` → only `property_type_commercial_2` checked
   - Property 3 = `Mobile Home` → `property_type_other_3` checked + `property_type_other_text_3` = "Mobile Home"
3. Check edge function logs for the existing `RE851D regions: … rewrites per region: …` line and confirm the new tags contribute to the PROP#K rewrite counts.

## Out of scope (Minimal Change Policy)

- No UI changes — the source dropdown and the boolean derivation are already wired.
- No changes to other RE851 templates (RE851A, etc.) — additions live inside the existing `/851d/i.test(template.name)` guard.
- No edits to the existing mapping table in code (already covers every CSR option via the documented mapping + OTHER fallback for Mobile Home / Farm / Restaurant / Bar / Group Housing per the spec).

## Files to edit

- `supabase/functions/generate-document/index.ts` — extend three string arrays (`RE851D_INDEXED_TAGS`, `PART1_TAGS`, `PART2_TAGS`).
- New SQL migration to insert the eight `field_dictionary` rows.
- Append the property-type tag family list to `mem://features/document-generation/re851d-multi-property-mapping`.
