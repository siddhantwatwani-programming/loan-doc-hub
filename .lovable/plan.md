## Deep-analysis findings

The lien data is present and the current backend is calculating values, but the generated document can still show blanks because there are two remaining issues in the RE851D pipeline:

1. Duplicate lien aliasing is inflating the rollup.
   - `lien1.*` values are also being bridged into canonical `lien.*` keys.
   - The RE851D rollup scans both `lien1` and canonical `lien`, so the same lien is counted twice.
   - Current logs confirm this: `property1: liens=[1,0], expected=934.00, remaining=156.00` even though the CSR screenshot shows `467.00` and `78.00`.

2. The uploaded RE851D template likely contains field-code/tag formatting variants.
   - The uploaded DOCX could not be parsed by the document parser, but the backend template has 92 `_N` rewrites and the uploaded file shows binary Word field structures.
   - The current `_N` rewrite looks for exact token text like `ln_p_expectedEncumbrance_N`.
   - If Word split the placeholder across runs, or if it is stored as a field code / display text variant, it may not be rewritten or parsed, causing blank output even though `fieldValues` contains the final values.

## Plan

1. Fix duplicate lien scanning in `supabase/functions/generate-document/index.ts`
   - Keep the existing generic indexed-to-canonical bridge for normal first-row compatibility, but change the RE851D lien encumbrance rollup to scan only explicit indexed lien rows (`lien1`, `lien2`, etc.) when any indexed lien exists.
   - Only fall back to canonical `lien` when no indexed lien rows exist.
   - This will change the expected log/result from `934.00 / 156.00` to the correct `467.00 / 78.00` for the shown deal.

2. Add robust field alias resolution for the actual dictionary keys
   - The persisted lien dictionary keys are `li_lt_anticipated`, `li_lt_anticipatedAmount`, `li_gd_newRemainingBalance`, and `pr_li_lienProper`.
   - Ensure the rollup can read both indexed UI keys (`lien1.anticipated_amount`) and dictionary-style aliases if they appear after future template/admin changes.
   - Preserve the existing property match behavior by property prefix (`property1`) and normalized address.

3. Harden RE851D template `_N` rewriting for encumbrance tags
   - Extend the preprocessor so it handles harmless spacing and split-text variants around the uploaded encumbrance placeholders, including forms equivalent to:
     - `{{ln_p_expectedEncumbrance_N}}`
     - `{{ ln_p_expectedEncumbrance_N }}`
     - `{{ln_p_remainingEncumbrance_N}}`
     - `{{ ln_p_remainingEncumbrance_N }}`
   - Keep this scoped to RE851D and only to known field families, so RE885 and other documents remain unaffected.

4. Add focused diagnostics at the merge boundary
   - Add one RE851D-only log line after `_N` preprocessing showing whether encumbrance placeholders remain as `_N`, were rewritten to `_1.._5`, or were not found.
   - Add a small pre-`processDocx` verification log for the exact keys:
     - `ln_p_expectedEncumbrance_1..5`
     - `ln_p_remainingEncumbrance_1..5`
   - This confirms that the final map passed into the DOCX processor has the expected values.

5. Validate using the current deal/template
   - Trigger generation for the RE851D template on deal `92c0c390-b697-4841-814b-f59802b57648`.
   - Check edge logs for:
     - `RE851D lien rollup property1: liens=[1], expected=467.00, remaining=78.00`
     - `RE851D final encumbrance state: expected=[1:467.00, ...], remaining=[1:78.00, ...]`
     - no unresolved `_N` encumbrance placeholders after preprocessing.

## Acceptance criteria

- `{{ln_p_expectedEncumbrance_N}}` populates the Expected Senior Encumbrance field from checked Anticipated Amount.
- `{{ln_p_remainingEncumbrance_N}}` populates the Remaining Senior Encumbrance field from New / Remaining Balance.
- Property #1 for the shown CSR data outputs `467.00` and `78.00`, not double-counted values.
- Properties #2-#5 remain blank when no lien is associated with them.
- The change is scoped to RE851D document generation only.