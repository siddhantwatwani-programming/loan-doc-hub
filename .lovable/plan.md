## RE851D — Why the lien-based questionnaire is blank in `Re851d_v27`

### Deep analysis (what actually happened)

Comparing the template `Re851d_v1(1)(2)(11).docx` against the generated `Re851d_v27.docx`, the lien-based questionnaire fields per property break into two distinct symptom groups:

**Group A — Text-only fields (working):**
- `B./G./L. If YES, how many?` → renders `4`, `34`, blank for properties 1, 2, 3+
- `E./J. If NO, source of funds…` → renders `Adwait`, `dfgd`, blank

These prove the per-property publisher in `supabase/functions/generate-document/index.ts` (lines 2467–2670) IS running and IS bucketing liens to the correct property index, AND the `_N → _1, _2, …` literal rewrite (line 3146) IS firing for these tags.

**Group B — YES/NO glyph fields (broken):**
- Q1 `Are there any encumbrances of record?` → `YES … NO` (no glyph at all)
- Q2 `Over last 12 months > 60 days late?` → `YES … NO` (no glyph)
- Q4 `Do any of these payments remain unpaid?` → `YES … NO` (no glyph)
- Q5 `If YES, will loan cure the delinquency?` → `YES … NO` (no glyph)

In the template each YES/NO line is authored as one inline run, e.g.:

```
<w:t xml:space="preserve">{{pr_li_encumbranceOfRecord_N_yes_glyph}} YES</w:t>
```

In the generated XML for Property #1 the same run becomes:

```
<w:t xml:space="preserve"> YES</w:t>
```

So the merge tag IS being consumed, but it resolves to empty string instead of `☐` / `☒`. The bare ` YES` / ` NO` labels remain because they were literal text in the same run.

### Why these glyph tags resolve to empty

1. The publisher writes the per-property glyph alias correctly:
   ```
   fieldValues.set(`pr_li_encumbranceOfRecord_${pIdx}_yes_glyph`, { rawValue: "☒"|"☐", dataType: "text" })
   ```
   (index.ts lines 2619–2623, 2598–2613).

2. The `_N` rewrite turns `{{pr_li_encumbranceOfRecord_N_yes_glyph}}` into `{{pr_li_encumbranceOfRecord_1_yes_glyph}}` for the Property #1 region (RE851D_INDEXED_TAGS includes these aliases — index.ts lines 3175–3188).

3. BUT the merge-tag resolver (`tag-parser.ts` → `resolveFieldKeyWithMap`) treats `pr_li_encumbranceOfRecord_1_yes_glyph` as an unknown key (it does not exist in `field_dictionary`). It then resolves the key through the canonical/legacy fallback chain. The chain collapses the synthetic suffixes (`_1_yes_glyph`) onto the closest known canonical key — which is the bare `pr_li_encumbranceOfRecord` boolean, not the `…_yes_glyph` text alias. The bare key has `rawValue = "true" | ""` (boolean), so when the resolver formats it as text it returns an empty string for the glyph slot.

   Evidence: the same pattern works in other RE851D blocks ONLY because the post-render "safety passes" (index.ts ~3869–3946 for "remain unpaid", ~5439 for "encumbrances of record", ~5021 for "cure the delinquency") rewrite static `☐`/`☒` runs after the question text. Those passes require glyph-only runs in the template, e.g. a single `<w:t>☐</w:t>` followed by a separate `<w:t> YES</w:t>` run. In `Re851d_v1(1)(2)(11)` the template authored the glyph and the YES label as ONE run, so the safety passes' glyphRunRe (`<w:r>…<w:t>[☐☑☒]</w:t></w:r>`) does not match and never fires. The rewrite path therefore depends entirely on merge-tag resolution, which (per #3) collapses to empty.

4. The `RE851D anti-fallback shield` (index.ts lines 1654–1696) only protects `pr_p_*` / `ln_p_*` bases. It does NOT shield `pr_li_encumbranceOfRecord`, `pr_li_delinqu60day`, `pr_li_currentDelinqu`, or `pr_li_delinquencyPaidByLoan`, so the resolver's fallback collapse goes uncaught.

5. Property tax block uses an `{{#if propertytax.delinquent}}…{{/if}}` conditional that does not consult lien data and is therefore unrelated to the spec — it is producing the `☑ YES ☐ NO` you see for "ARE TAXES DELINQUENT?" but does nothing for the lien questionnaire.

### Do you need to change the template?

**No template change is required.** The template tags (`pr_li_encumbranceOfRecord_N_yes_glyph`, `pr_li_delinqu60day_N_*`, `pr_li_currentDelinqu_N_*`, `pr_li_delinquencyPaidByLoan_N_*`, `pr_li_delinquHowMany_N`, `pr_li_sourceOfPayment_N`) are already the correct keys this backend supports.

The fix is entirely in `supabase/functions/generate-document/index.ts` to stop the canonical-key collapse that wipes out the four glyph aliases.

### Plan (code-only)

1. **Extend the RE851D anti-fallback shield** (index.ts ~line 1654 `SHIELD_BASES`) to include the lien-derived bases:
   - `pr_li_encumbranceOfRecord`, `pr_li_encumbranceOfRecord_yes`, `pr_li_encumbranceOfRecord_no`, `pr_li_encumbranceOfRecord_yes_glyph`, `pr_li_encumbranceOfRecord_no_glyph`
   - same five-suffix family for: `pr_li_delinqu60day`, `pr_li_currentDelinqu`, `pr_li_delinquencyPaidByLoan`
   - `pr_li_delinquHowMany`, `pr_li_sourceOfPayment`
   For every property index `1..5` write an empty-string `text` placeholder if the publisher didn't already populate it. This blocks the resolver from falling back to the bare boolean key.

2. **Force `_yes_glyph` / `_no_glyph` aliases to publish a glyph even when the lien bucket is empty.** In the per-property publish block (index.ts ~line 2588) emit defaults when `perProp[pIdx]` is missing for indices `1..MAX_PROPERTIES`:
   - `_yes_glyph = "☐"`, `_no_glyph = "☒"` (i.e. NO checked) for Q1/Q2/Q4/Q5 when no lien data exists for that property. This matches the spec's mutual-exclusivity rule and keeps both checkboxes from going blank.

3. **Add a per-property safety pass that handles merge-tag-style runs**, mirroring the existing "remain unpaid" pass (~line 3869) but pattern-matching `<w:t>{{pr_li_<name>_<K>_yes_glyph}} YES</w:t>` and `<w:t>{{pr_li_<name>_<K>_no_glyph}} NO</w:t>` inside each `PROPERTY #K` region. If the merge-tag resolver leaves the glyph slot empty, this pass rewrites the run text to `☑ YES` / `☐ NO` (or inverse) using the per-property booleans:
   - Q1 (`encumbrances of record`) → `pr_li_encumbranceOfRecord_K`
   - Q2 (`60 days late`) → `pr_li_delinqu60day_K`
   - Q4 (`remain unpaid`) → `pr_li_currentDelinqu_K`
   - Q5 (`cure the delinquency` / `paid by this loan`) → `pr_li_delinquencyPaidByLoan_K`

   This pass is bounded to detected `PROPERTY #K` regions (already established at ~line 3320), is per-property (no cross-bleed), and is a no-op if the value already rendered. Add a memory entry under `mem://features/document-generation/re851d-lien-questionnaire-glyph-resolution` describing the rule.

4. **Verification**:
   - Generate RE851D using the same deal as `Re851d_v27`. Property #1 should show `☐ YES ☒ NO` for Q1 (no Paid-Off lien), the appropriate Q2/Q4/Q5 boolean glyphs, `B. If YES, how many? 4`, and `E. … Adwait`. Property #2 likewise with its own values. Properties without liens render `☐ YES ☒ NO` for all four questions and blank Q3/Q6.
   - Re-export and confirm: no glyph appears outside its property block; mutual exclusivity holds; counts and source text remain per-property.

### Files touched

- `supabase/functions/generate-document/index.ts` — extend `SHIELD_BASES`, default-publish glyph aliases for empty buckets, add per-property merge-tag glyph safety pass.
- `mem://features/document-generation/re851d-lien-questionnaire-glyph-resolution` — record the new rule.

### Files NOT touched

- The template (`Re851d_v1(1)(2)(11).docx`) — current tags are correct.
- DB schema / RLS / UI — no changes.
- `src/integrations/supabase/client.ts`, `types.ts`, `.env` — not editable.
