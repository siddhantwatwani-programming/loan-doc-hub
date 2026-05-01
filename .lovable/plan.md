## RE851D — Encumbrance Fields Stay Blank: Root Cause + Fix

### Findings

For deal `92c0c390…`, the lien data IS persisted correctly:
- `lien1.anticipated = true`, `lien1.anticipated_amount = 467`, `lien1.new_remaining_balance = 78`, `lien1.property = "property1"`
- `field_dictionary` contains `ln_p_expectedEncumbrance` and `ln_p_remainingEncumbrance` (currency, section=property)
- The per-property publisher (lines 1145–1223 of `generate-document/index.ts`) computes the right sums and sets `ln_p_expectedEncumbrance_1 = 467.00` / `ln_p_remainingEncumbrance_1 = 78.00`
- The `_N` rewrite block (line 2463+) lists both tags in `RE851D_INDEXED_TAGS`, so `{{ln_p_expectedEncumbrance_N}}` becomes `{{ln_p_expectedEncumbrance_1}}` etc. (logs confirm `PROP#1=17` rewrites)

**Root cause:** the merge resolver (`resolveFieldKeyWithMap` in `field-resolver.ts`, priorities 1 and 5) uses `validFieldKeys` — built **only** from `field_dictionary.field_key` + `canonical_key`. The suffixed keys (`ln_p_expectedEncumbrance_1`, `_2`, …) are never in that set. Combined with the cleanedTag step (`tagName.replace(/_+$/, "")` does not strip `_<digit>`), the resolver falls through priorities 1–4, then in priority 5 attempts `dotVersion = "ln_p_expectedEncumbrance_1".replace(/_/g, ".")` → `"ln.p.expectedEncumbrance.1"`, also not found, and finally returns `tagName` as-is.

For most other `_N` families this still works because `getFieldData` does an exact `fieldValues.get("...")` lookup. **However**, the formatting/transform path treats unknown keys differently for currency: when the mappedKey is NOT in `validFieldKeys`, `formatByDataType` is called only when `fieldData.dataType` is set correctly. The publisher sets `dataType: "currency"`, so format runs — yet the resolver's "ultimate vs canonical" two-step (lines 2515–2517 of `tag-parser.ts`) does:
- `canonicalKey = resolveFieldKeyWithMap("ln_p_expectedEncumbrance_1", …)` → returns the as-is suffixed key
- `ultimateKey = resolveFieldKeyWithMap(canonicalKey, …)` → second pass finds the **unsuffixed** key in `validFieldKeys` via priority-5 case-insensitive index match against `ln_p_expectedencumbrance` (the index is built from validFieldKeys lowercased, and the lookup keys off `lowerTag` which strips no digits) — **wait, that path also returns the suffixed key as-is** because `validFieldKeys` does not contain the suffixed key in any case form.

Re-checking: the second resolution call returns the same key (no priority matches). So `ultimateKey === canonicalKey === "ln_p_expectedEncumbrance_1"`. `getFieldData("ln_p_expectedEncumbrance_1", fieldValues)` finds the publisher's entry. The merge **should** succeed.

The actual blocker is more subtle: the publisher sits inside the per-`idx` loop, but the **anti-fallback shield** (lines 1338–1380) iterates `for (let idx = 1; idx <= MAX_PROPERTIES; idx++)` and writes empty strings for any `${base}_${idx}` key not yet present. Both `ln_p_expectedEncumbrance` and `ln_p_remainingEncumbrance` are in `SHIELD_BASES`. Because the publisher's `lienExpectedHit`/`lienRemainingHit` are local to each `idx` iteration and only fire when at least one matching lien row exists for that property, indices with no lien association (property #2, #3, #4, #5 in this deal) get blanked. That part is correct.

For property #1 the publisher DOES set the value — so why is it blank in the screenshot?

The remaining failure mode is the legacy backfill at lines 1207 and 1219: `pr_p_expectedSenior_${idx}` and `pr_p_remainingSenior_${idx}` are **also** in the shield's `SHIELD_BASES`. The shield runs after the publisher loop, so for indices where the publisher did NOT backfill them (because `staticExpected` was non-empty OR `lienExpectedHit` was false), the shield writes empty strings. That's fine for those legacy aliases. But:

- The screenshot's "Doveson Street" property #1 LTV shows `2.00%%` and market value blank. That tells us property1 also has NO `appraise_value` and NO `remaining_senior` / `expected_senior` static fields — only the lien data. So the lien publisher SHOULD be the only source and should populate `ln_p_expectedEncumbrance_1 = 467.00`.

### Action plan

To make the fix robust and verifiable end-to-end:

1. **Make the suffixed `_N` keys first-class for the resolver** — extend `getValidFieldKeys` (or pre-seed locally before calling `processDocx`) so that for RE851D, the keys `ln_p_expectedEncumbrance_1..5` and `ln_p_remainingEncumbrance_1..5` are added to the `validFieldKeys` set passed into `processDocx`. This forces priority-1 direct match in `resolveFieldKeyWithBackwardCompat` and removes any chance of the resolver returning a different ultimate key.

2. **Tighten the lien matcher and add explicit observability** in `supabase/functions/generate-document/index.ts` (lines 1155–1223):
   - Normalize whitespace in `propRaw` and `prefixLower` (collapse multiple spaces, strip stray punctuation) so `"property1 "` or `"Property1"` still matches.
   - Accept **both** the entity prefix (`property1`) **and** the property's full address as a match key.
   - Emit an unconditional `console.log` (not gated by `DOC_GEN_DEBUG`) summarizing the lien rollup per property: `RE851D lien rollup property{idx}: liens=[1,2], expected=467.00, remaining=144.00`. This gives us a single log line to confirm the publisher actually fired, with the exact summed values.

3. **Force-set the keys (drop the `if (!fieldValues.has(...))` guard)** for the encumbrance aliases. Today, if some upstream path pre-creates an empty `ln_p_expectedEncumbrance_1` (e.g., a legacy migration or stale shield run from a prior loop iteration), the publisher silently skips. Replacing the guard with an unconditional set when `lienExpectedHit`/`lienRemainingHit` is true makes the publisher authoritative.

4. **Add a follow-up sanity log** after the shield block: `RE851D final encumbrance state: expected=[1:467.00, 2:'', 3:'', 4:'', 5:''], remaining=[1:78.00, 2:'', …]`. One line per generation, written to console (not debug). This confirms what `processDocx` will actually see.

5. **Sanity-check the template merge tag spelling** in the template document. The screenshot shows tags like `{{ln_p_expectedEncumbrance_N}}` — the `N` literal — but if the user's actual template has `{{ ln_p_expectedEncumbrance_N }}` (with surrounding spaces) or `{{ln_p_expected_encumbrance_N}}` (snake variant), the rewrite block won't match. After the code edits, fetch the RE851D template buffer once via the validate-template path and grep for both expected spellings; if a variant is present, add it to `RE851D_INDEXED_TAGS` and `SHIELD_BASES`.

### Files to change

- `supabase/functions/generate-document/index.ts`
  - Add suffixed-key seeding to the `validFieldKeys` set right before `processDocx(...)` is called (line ~2905) when `template.name` matches `/851d/i`.
  - Drop the `!fieldValues.has(...)` guard for the two encumbrance aliases (lines 1200, 1213).
  - Add unconditional `console.log` for lien rollup and final encumbrance state.
  - Tighten the `propRaw` / `prefixLower` normalization in the matcher (line 1168–1173).

### Out of scope

- No schema change; `field_dictionary` already contains the unsuffixed keys.
- No template edit — the user has the merge tags in place; if a spelling variant is found in step 5, only the `RE851D_INDEXED_TAGS` / `SHIELD_BASES` arrays are extended.
- No change to `tag-parser.ts` or `field-resolver.ts` resolution priorities.

### Acceptance criteria

- Generating RE851D for deal `92c0c390-b697-4841-814b-f59802b57648` populates Property #1's `EXPECTED SENIOR ENCUMBRANCE = $467.00` and `REMAINING SENIOR ENCUMBRANCE = $78.00`.
- Properties #2–#5 remain blank (no liens associated).
- New `RE851D lien rollup …` and `RE851D final encumbrance state …` log lines appear in the edge function logs for every RE851D generation.
- Other templates (RE851A, RE885) are unaffected — the new seeding is template-gated.
