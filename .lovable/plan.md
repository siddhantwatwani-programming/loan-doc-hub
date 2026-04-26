## Goal

Fix the RE851A "IS BROKER ALSO A BORROWER?" Option B checkbox so it renders ☑ when the CSR checkbox is checked. Option A already renders correctly in both states; only the **checked → B** path fails.

## Root cause analysis

Verified in the engine logs and source:

- The CSR field is correctly persisted at `origination_app.doc.is_broker_also_borrower_yes`.
- The generate-document Edge Function correctly derives:
  - `or_p_isBrkBorrower = "true"` (string, treated as truthy)
  - `or_p_brkCapacityPrincipal = "true"`, `or_p_brkCapacityAgent = "false"`
  - Glyph aliases `or_p_brkCapacityAgentGlyph = "☐"`, `or_p_brkCapacityPrincipalGlyph = "☑"`
- `isConditionTruthy` in `tag-parser.ts` correctly evaluates `"true"`, `"yes"`, `"y"`, `"1"` as truthy.

So the **data side is fine**. The asymmetry (A always works, B fails when checked) points to a **template XML fragmentation** issue scoped to the B line:

- Option A condition: `{{#if or_p_isBrkBorrower}}☐{{else}}☑{{/if}}`
- Option B condition: `{{#if or_p_isBrkBorrower}}☑{{else}}☐{{/if}}`

When the field is **checked (true)**, the engine must emit the **`#if` branch** (☑) for B. If the B-line `#if`/`else`/`/if` triplet is split across `<w:r>` runs and the inline checkbox-conditional consolidator (`tag-parser.ts` line 341–385) bails out — for example because the B paragraph captures a 4th control tag from a sibling row, or because the `#if`/`/if` braces are split mid-token in a way the existing fragment regex doesn't catch — the downstream Mustache evaluator never sees a valid block. The orphan-strip at line 1335 then removes the leftover `{{#if ...}}`, and the `☑` glyph that lived inside the `#if` branch gets dropped along with the surrounding broken markup, leaving B unchecked.

When the field is **unchecked (false)**, B's correct output is `☐`, which happens to also be present as the static fallback / `else` glyph in the rendered fragments, so the failure is invisible for the unchecked case.

## Fix scope

Engine-side only, in `supabase/functions/_shared/tag-parser.ts`. Strictly scoped to the inline checkbox-glyph conditional consolidator so no other template logic is affected.

### Targeted adjustments

1. **Glyph-only branch enforcement, not control-tag count.** Replace the current "exactly 3 control tags" guard with a stricter check that the captured `#if` and `else` branches each contain **exactly one checkbox glyph and no other Handlebars control tags**, ignoring plain merge tags. This lets the consolidator succeed on the B line even when an adjacent paragraph fragment leaks a 4th control tag into the regex's greedy capture.

2. **Pre-normalize split braces around `#if` / `else` / `/if` for the B-line shape.** Add a small pre-pass that joins `{{` + `#if` + ` KEY` + `}}` (and the matching `{{else}}` / `{{/if}}`) when they are separated only by `<w:r><w:t>...</w:t></w:r>` wrappers, before the inline checkbox consolidator runs. The existing `ifFragmented` regex (line 390) handles some shapes; we extend it to cover the specific RE851A B-line fragmentation.

3. **Defensive fallback rewrite.** If after consolidation the B-line still contains a `{{#if or_p_isBrkBorrower}}` followed by a checkbox glyph followed by `{{else}}` followed by a checkbox glyph followed by `{{/if}}` anywhere in the same paragraph (with arbitrary inline XML), rewrite it into the canonical clean form `{{#if or_p_isBrkBorrower}}☑{{else}}☐{{/if}}` so the Mustache evaluator can resolve it.

4. **Diagnostic log.** Add a one-line debug log when the B-line consolidation fires, so future regressions are visible in `generate-document` logs.

### What is NOT changed

- No edits to the `.docx` RE851A template file.
- No edits to the database schema, field dictionary, UI components, or APIs.
- No changes to `isConditionTruthy` (already handles all required truthy variants).
- No changes to the engine's broker-capacity derivation in `generate-document/index.ts` (already correct).
- No changes to Option A logic, other checkbox conditionals, or unrelated `#if` blocks.

## Verification

After the change, regenerate RE851A for the current deal and confirm:

- CSR "IS BROKER ALSO A BORROWER?" **checked** → A = ☐, B = ☑
- CSR "IS BROKER ALSO A BORROWER?" **unchecked** → A = ☑, B = ☐
- Edge logs show: `Consolidated fragmented checkbox conditional for or_p_isBrkBorrower` for both A and B lines.
- Other RE851A checkbox rows (Balloon Payment, Amortization, Payment Frequency, etc.) remain unchanged.

## Files touched

- `supabase/functions/_shared/tag-parser.ts` (inline checkbox-conditional consolidator only)

No migrations, no template edits, no UI changes.