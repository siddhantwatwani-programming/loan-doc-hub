I’ll fix this in the document generation backend with a minimal, RE851D-scoped change.

Findings from the deep analysis:

- The lien data is present for the current deal:
  - `lien1.anticipated = true`
  - `lien1.anticipated_amount = 467`
  - `lien1.new_remaining_balance = 78`
  - `lien1.property = property1`
- The existing rollup logic should publish:
  - `ln_p_expectedEncumbrance_1 = 467.00`
  - `ln_p_remainingEncumbrance_1 = 78.00`
- The uploaded RE851D template uses repeated generic placeholders like:
  - `{{ln_p_remainingEncumbrance_N}}`
  - `{{ln_p_expectedEncumbrance_N}}`
- Those placeholders appear in the Part 1 / Loan-to-Value table and Part 2 pre-property table, but the current `_N` preprocessing allowlist only rewrites a small subset of Part 1 / Part 2 tags. It currently excludes the two encumbrance tags there, so they remain literal `_N` tags and resolve blank.
- There is a second risk: the tag parser has duplicate-placeholder suppression. In RE851D the same suffixed field can appear more than once across the form, so later occurrences may be blanked even when the value exists.

Implementation plan:

1. Update RE851D `_N` preprocessing in `supabase/functions/generate-document/index.ts`
   - Add these tags to the Part 1 rewrite allowlist:
     - `ln_p_expectedEncumbrance_N`
     - `ln_p_remainingEncumbrance_N`
   - Add the same tags to the Part 2 rewrite allowlist.
   - This will convert the template placeholders by document/region order:
     - `{{ln_p_expectedEncumbrance_N}}` → `{{ln_p_expectedEncumbrance_1}}`, `{{ln_p_expectedEncumbrance_2}}`, etc.
     - `{{ln_p_remainingEncumbrance_N}}` → `{{ln_p_remainingEncumbrance_1}}`, `{{ln_p_remainingEncumbrance_2}}`, etc.

2. Make repeated RE851D placeholders populate consistently
   - In `supabase/functions/_shared/tag-parser.ts`, adjust duplicate placeholder handling only for RE851D templates.
   - For RE851D, repeated instances of the same resolved key will all receive the value instead of later duplicates being blanked.
   - Keep the existing duplicate behavior for other templates to avoid unintended changes.

3. Harden lien-derived encumbrance lookup without changing schema or UI
   - Keep the existing per-property rollup logic.
   - Add small fallback reads for the canonical lien field keys already present in the data model, so the rollup still works if a lien row was saved without an `indexed_key` in older data.
   - Preserve strict per-property matching: no cross-property fallback.

4. Add targeted diagnostics for verification
   - Keep or improve the existing RE851D log line that reports final expected/remaining values for indices 1–5.
   - Add a preprocessing log count for encumbrance rewrites so we can confirm the template changed from `_N` to `_1.._5` before rendering.

5. Validate after implementation
   - Generate/test RE851D against the current deal data.
   - Confirm logs show:
     - `ln_p_expectedEncumbrance_1 = 467.00`
     - `ln_p_remainingEncumbrance_1 = 78.00`
     - encumbrance `_N` placeholders rewritten in Part 1 / Part 2.
   - Confirm the generated DOCX populates the Expected Senior Encumbrance and Remaining Senior Encumbrance fields without changing document layout/design or unrelated document flows.