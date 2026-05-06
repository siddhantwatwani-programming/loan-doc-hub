## RE851D — Fix YES/NO checkboxes for delinqu60day & delinquencyPaidByLoan

### Root cause

In `supabase/functions/generate-document/index.ts` the RE851D delinquency publisher (around lines 2530–2615) emits per-lien and per-property aliases for four questionnaire fields:

- `pr_li_currentDelinqu_N` — publishes `_yes`, `_no`, `_yes_glyph`, `_no_glyph` ✅
- `pr_li_encumbranceOfRecord_N` — publishes `_yes`, `_no`, `_yes_glyph`, `_no_glyph` ✅
- `pr_li_delinqu60day_N` — publishes ONLY the bare boolean ❌
- `pr_li_delinquencyPaidByLoan_N` — publishes ONLY the bare boolean ❌

The template (per the user’s screenshot) uses:
- `{{pr_li_delinqu60day_N_yes_glyph}}` / `{{pr_li_delinqu60day_N_no_glyph}}`
- `{{pr_li_delinquencyPaidByLoan_N_yes_glyph}}` / `{{pr_li_delinquencyPaidByLoan_N_no_glyph}}`

Because no value is published for those exact keys, they resolve to blank — leaving the static "YES" / "NO" labels with no ☒/☐ glyph next to them. The same gap exists in `RE851D_INDEXED_TAGS` (around lines 3119–3120), so the `_N → _K` template rewriter doesn't even rewrite those tags to per-property indices.

### Files changed

- `supabase/functions/generate-document/index.ts` (publishers + valid-key allowlist)

### Fix

1. **Per-lien block (~line 2535–2546)** — alongside the existing `setBool(pr_li_delinquencyPaidByLoan_${lienIdx}, paidByLoan)` and `setBool(pr_li_delinqu60day_${lienIdx}, has60)`, also publish for each:
   - `..._yes` (boolean = state)
   - `..._no` (boolean = !state)
   - `..._yes_glyph` (text = state ? "☒" : "☐")
   - `..._no_glyph` (text = state ? "☐" : "☒")

2. **Per-property block (~line 2577–2585)** — same four aliases for `pr_li_delinqu60day_${pIdx}` and `pr_li_delinquencyPaidByLoan_${pIdx}`, mirroring what `pr_li_currentDelinqu_${pIdx}` already does at lines 2581–2584.

3. **Bare-alias block (~line 2602–2613, `pIdx === 1`)** — add `_yes`, `_no`, `_yes_glyph`, `_no_glyph` for `pr_li_delinqu60day` and `pr_li_delinquencyPaidByLoan` so unsuffixed templates also work.

4. **`RE851D_INDEXED_TAGS` (~line 3119–3120)** — extend to include:
   - `pr_li_delinqu60day_N_yes_glyph`, `pr_li_delinqu60day_N_no_glyph`, `pr_li_delinqu60day_N_yes`, `pr_li_delinqu60day_N_no`
   - `pr_li_delinquencyPaidByLoan_N_yes_glyph`, `pr_li_delinquencyPaidByLoan_N_no_glyph`, `pr_li_delinquencyPaidByLoan_N_yes`, `pr_li_delinquencyPaidByLoan_N_no`

   Order longest-first so the rewriter consumes `_N_yes_glyph` before `_N`.

5. **`effectiveValidFieldKeys` / `SUFFIXED_BASES` (~line 4070+)** — add the same eight per-property bases (`_1.._5`) so the resolver treats them as direct hits rather than falling back to canonical lookup.

### Behavior after fix

Per property K (1..5):
- `{{pr_li_delinqu60day_K_yes_glyph}}` → ☒ if any matching lien has `delinquencies_how_many > 0`, else ☐
- `{{pr_li_delinqu60day_K_no_glyph}}` → opposite
- `{{pr_li_delinquencyPaidByLoan_K_yes_glyph}}` → ☒ if any matching lien has `paid_by_loan` truthy, else ☐
- `{{pr_li_delinquencyPaidByLoan_K_no_glyph}}` → opposite

Mutually exclusive within each question. No cross-property leakage (publisher already filters by `lienK.property === "propertyN"`). Already-correct `pr_li_currentDelinqu_N` and `pr_li_encumbranceOfRecord_N` glyphs untouched.

### Out of scope (preserved)

- No template changes.
- No field_dictionary changes.
- No UI/schema changes.
- `pr_li_delinquHowMany_N` and `pr_li_sourceOfPayment_N` already publish text values correctly.
- All existing publishers, safety passes, and other RE851D logic untouched.

### Verification (after switch to default mode)

1. Redeploy `generate-document`.
2. Generate RE851D for the test deal with multiple properties + liens.
3. Confirm in the .docx:
   - F (60-day late) shows ☒/☐ next to YES & NO based on `delinquencies_how_many > 0` per property.
   - I (paid by loan) shows ☒/☐ based on `paid_by_loan` per property.
   - H (current delinquency) and "encumbrances of record" continue to render correctly (regression check).
   - Each PROPERTY #K block uses its own lien data.
