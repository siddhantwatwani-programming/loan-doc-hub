## RE851D — Map Lien fields to Expected / Remaining Senior Encumbrance

### What's already in place (no work needed)
- Lien UI fields persist correctly:
  - `Anticipated` → dictionary key `li_lt_anticipated` (boolean)
  - `Amount` (Anticipated Amount) → `li_lt_anticipatedAmount` (currency)
  - `New / Remaining` → `li_gd_newRemainingBalance` (currency)
  - `Related Property` → `pr_li_lienProper` (dropdown carrying the property identifier/address)
- Multi-property scaffolding (`property{N}`, `_N` rewrite, anti-fallback shield) already exists in `supabase/functions/generate-document/index.ts`.

### Root cause of the empty fields
The RE851D template tags `{{ln_p_expectedEncumbrance_N}}` and `{{ln_p_remainingEncumbrance_N}}` are never published. Today the publisher only emits `pr_p_expectedSenior_N` / `pr_p_remainingSenior_N` from `property{N}.expected_senior` / `property{N}.remaining_senior`, which are static text fields on PropertyDetailsForm — not the actual Lien data the user enters in the Lien section.

### Implementation

#### 1. Add two new Field Dictionary aliases (Admin → Property → Property Details section)
Insert via `INSERT` into `public.field_dictionary` (data only, no schema change):

| field_key | label | section | data_type | form_type |
|---|---|---|---|---|
| `ln_p_expectedEncumbrance` | Expected Senior Encumbrance | property | currency | primary |
| `ln_p_remainingEncumbrance` | Remaining Senior Encumbrance | property | currency | primary |

These are **publisher-output aliases** (purely for document merge resolution), not user-editable inputs — they will be visible in Admin → Field Dictionary as required by the spec, but no UI form change is needed because the source values come from the existing Lien section.

#### 2. New per-property publisher in `supabase/functions/generate-document/index.ts`
Add a block inside the existing `if (/851d/i.test(template.name || ""))` loop (around the existing total-encumbrance block at line ~1145), strictly per-index, no cross-index fallback. For each property index `idx` in `sortedPropIndices`:

1. Build a list of liens (`lien1.*`, `lien2.*`, …) whose `pr_li_lienProper` (`lien{k}.property`) matches this property — match either:
   - the entity prefix `property{idx}` (case-insensitive), OR
   - the normalized `property{idx}.address`.
2. **Expected Senior Encumbrance** = sum of `lien{k}.anticipated_amount` for every matched lien where `lien{k}.anticipated` is truthy (`true`/`yes`/`1`).
3. **Remaining Senior Encumbrance** = sum of `lien{k}.new_remaining_balance` for every matched lien (regardless of anticipated flag — separate field).
4. Publish (only if not already set):
   - `ln_p_expectedEncumbrance_${idx}` (currency)
   - `ln_p_remainingEncumbrance_${idx}` (currency)
   - Also publish the legacy `pr_p_expectedSenior_${idx}` and `pr_p_remainingSenior_${idx}` from the same computed values **only when the existing `property{N}.expected_senior` / `.remaining_senior` static fields are empty**, so existing templates keep working without regression.

**Multi-lien rule**: sum (per the spec's "If multiple liens exist per property: Either sum values OR Take latest entry"). Sum is the safer, deterministic choice and is consistent with the existing `pr_p_totalSenior_N` lien-sum publisher already in this file.

#### 3. Update existing total-encumbrance computation (line ~1145)
Change the `remainingNum` / `expectedNum` source so it falls back to the newly published `ln_p_remainingEncumbrance_${idx}` / `ln_p_expectedEncumbrance_${idx}` when `property{N}.remaining_senior` / `property{N}.expected_senior` are empty. Keeps `pr_p_totalEncumbrance_N` accurate.

#### 4. Register the new tag bases for `_N` rewrite & anti-fallback shield
- Add `"ln_p_expectedEncumbrance_N"` and `"ln_p_remainingEncumbrance_N"` to `RE851D_INDEXED_TAGS` (line ~2379) so generic `_N` placeholders rewrite correctly.
- Add `"ln_p_expectedEncumbrance"` and `"ln_p_remainingEncumbrance"` to `SHIELD_BASES` (line ~1256) so unpublished indices render blank instead of falling back to Property #1's data.

#### 5. Template note
The user-managed RE851D `.docx` template tags must be exactly `{{ln_p_expectedEncumbrance_N}}` and `{{ln_p_remainingEncumbrance_N}}` (or per-index `_1`/`_2`/…). Code changes alone won't update the binary template; if the template still uses literal `$________` placeholders for these two fields, the user will need to author the merge tags. We'll document this in the response after implementation. No code change to templates.

### Files to change
- `supabase/functions/generate-document/index.ts` — new publisher block, updated total-encumbrance fallback, two `RE851D_INDEXED_TAGS` entries, two `SHIELD_BASES` entries.
- Database insert (no migration): two rows in `public.field_dictionary`.

### Acceptance verification
- For Property #1 with one lien tagged to it: Anticipated=true + Amount=$10,000 → `{{ln_p_expectedEncumbrance_1}}` renders `$10,000.00`.
- New/Remaining=$5,000 → `{{ln_p_remainingEncumbrance_1}}` renders `$5,000.00`.
- Two liens on Property #2 with anticipated_amount $3k and $7k → `{{ln_p_expectedEncumbrance_2}}` = `$10,000.00`.
- Property #3 with no liens → both tags render blank (anti-fallback shield blocks Property #1 leak).
- Admin → Field Dictionary → Property section shows the two new keys.
- No CPU-budget regression: the publisher adds ≤ N×K simple lookups (N≤5 properties, K = lien count), no regex sweeps.
