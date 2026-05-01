## Restrict Occupancy Dropdown + RE851D Owner Occupied Mapping

### 1. UI Dropdown — restrict to 4 options

Update the `OCCUPANCY_OPTIONS` array in **two** files (currently has 9 values like Investor / Owner / Primary Borrower / etc.):

- `src/components/deal/PropertyDetailsForm.tsx` (line 42)
- `src/components/deal/PropertyModal.tsx` (line 38)

New value list (in this order):
```
['Owner Occupied', 'Tenant / Other', 'Vacant', 'NA']
```

No other UI changes — same `Select` component, same persistence key (`{prefix}.appraisal_occupancy`).

### 2. Edge function — RE851D Owner Occupied Yes/No mapping

File: `supabase/functions/generate-document/index.ts` (lines ~1158–1182, the existing per-property Owner-Occupied alias publisher).

Update the matching logic to the new 4-value vocabulary, with **default-to-No** when empty:

- `isYes` ← occupancy equals `"owner occupied"` (case-insensitive, trimmed)
- `isNo`  ← anything else (`tenant / other`, `vacant`, `na`, empty/missing, or any legacy value still present on old deals)

Mutual exclusivity is guaranteed because `isNo = !isYes`.

Aliases published per property index `idx` (unchanged keys — already consumed by template):
- `pr_p_occupancySt_${idx}_yes` → boolean
- `pr_p_occupancySt_${idx}_no`  → boolean
- `pr_p_occupancySt_${idx}_yes_glyph` → ☒ / ☐
- `pr_p_occupancySt_${idx}_no_glyph`  → ☒ / ☐

Important changes vs. current code:
- Always publish the aliases (remove the `if (isYes || isNo)` gate) so empty/missing occupancy correctly renders an unchecked Yes + checked No per the new "default → No" rule.
- Drop the legacy synonym lists; only `"owner occupied"` is treated as Yes. (Legacy values like "Owner", "Primary Borrower" on existing deals will now resolve to No, matching the new spec.)

### 3. RE851D template binding (`{{pr_p_occupanc_N}}` conditionals)

The template currently uses `{{#if (eq pr_p_occupanc_N "Owner")}}…{{/if}}` to drive the Owner Occupied checkboxes (visible in the uploaded screenshot). With the dropdown vocabulary changing to "Owner Occupied", the comparison string must match.

The existing `_N` rewriter in `generate-document/index.ts` already publishes `pr_p_occupancySt_${idx}_yes_glyph` / `_no_glyph` aliases. The cleanest, lowest-risk approach is to **leave the template using the boolean/glyph aliases the edge function already provides** and keep templates free of `eq` string comparisons, since string comparisons are brittle when copy reads "Owner Occupied" (with a space).

Two acceptable template patterns (no code change required if already on pattern A):

- **Pattern A (preferred, already supported):**
  - Yes cell: `{{pr_p_occupancySt_N_yes_glyph}}`
  - No cell:  `{{pr_p_occupancySt_N_no_glyph}}`

- **Pattern B (if `eq` is retained):** update the literal in the template to `"Owner Occupied"` (was `"Owner"`).

No edge-function change is needed for Pattern A beyond Section 2 above.

### 4. Field dictionary

`pr_p_occupanc` already exists (data_type: `text`, section: `property`). No migration required — the dropdown is rendered in the form layer, not driven by a dictionary `options` column. `_N` indexing is handled by the existing per-property publisher.

### 5. Out of scope (minimal-change policy)

- No schema migration.
- No changes to `PropertiesTableView`, `PropertySectionContent`, `legacyKeyMap`, or `fieldKeyMap`.
- No changes to other RE851D mappings (Property Type, Lien, Tax) or other documents.
- Existing deals with legacy occupancy values (Investor, Tenant, etc.) will display the old string in the dropdown until re-saved; the new 4-option list will be shown for selection.

### Files to edit
- `src/components/deal/PropertyDetailsForm.tsx` — replace OCCUPANCY_OPTIONS
- `src/components/deal/PropertyModal.tsx` — replace OCCUPANCY_OPTIONS
- `supabase/functions/generate-document/index.ts` — tighten Yes/No logic + always publish aliases (lines ~1158–1182)
