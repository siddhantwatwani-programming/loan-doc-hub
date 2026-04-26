## Goal

Fix the RE851A "IS BROKER ALSO A BORROWER?" A/B checkboxes so they render correctly based on the CSR → Other Origination → Application checkbox, without changing UI, APIs, schema, document templates, or unrelated generation logic.

## Findings

1. **UI persistence is correct.** `OriginationApplicationForm.tsx` writes the "IS BROKER ALSO A BORROWER?" checkbox to `origination_app.doc.is_broker_also_borrower_yes` as a boolean.

2. **Data-layer derivation is correct.** `supabase/functions/generate-document/index.ts` (lines 840–861) reads that key (plus legacy aliases `or_p_isBrokerAlsoBorrower_yes`, `or_p_isBrkBorrower`, `origination.is_broker_also_a_borrower`), normalizes to boolean, and republishes:
   - `or_p_isBrkBorrower` = `"true"` / `"false"` (string-boolean)
   - `or_p_brkCapacityAgent`, `or_p_brkCapacityPrincipal` (string-boolean)
   - `or_p_brkCapacityAgentGlyph`, `or_p_brkCapacityPrincipalGlyph` (☐/☑)
   
   Confirmed in edge logs: `Derived broker capacity checkboxes from "true": agent=false, principal=true, isBrkBorrower=true`.

3. **`#if` evaluator handles string-booleans correctly.** `isConditionTruthy` in `tag-parser.ts` (line 1181) treats `"false"`, `"0"`, `"no"`, `"n"` as falsy — so the string `"false"` will NOT trigger the truthy branch. The current template logic is logically right:
   ```
   {{#if or_p_isBrkBorrower}}☐{{else}}☑{{/if}} A. Agent ...
   {{#if or_p_isBrkBorrower}}☑{{else}}☐{{/if}} B. Principal ...
   ```

4. **Real cause: same XML-fragmentation issue as Balloon Payment.** Word has split the inline `{{#if}}…{{else}}…{{/if}}` runs in the A and B cells across multiple `<w:r>`/`<w:t>` elements, so the downstream Mustache evaluator sees broken blocks.

5. **The existing checkbox-glyph-aware consolidator (lines 341–380, added for the Balloon fix) is generic** — it keys on `☐/☑/☒` glyphs, not on a specific field name, so it should already heal these A/B rows. But it has two guards that may bail out on this specific RE851A cell:
   - **Guard 1 (line 374): `tagCount !== 3` bail-out.** Each A/B row contains *additional* merge tags inline (e.g., `{{br_p_fullName}}` next to the glyph in the same paragraph) — this can push the tag count above 3 and cause the consolidator to bail out, leaving the fragmentation unresolved.
   - **Guard 2 (line 368): paragraph-boundary bail-out.** Holds; A/B fit inside a single cell paragraph.

## Fix Plan (engine-side, scoped, minimal)

### Step 1 — Tighten the consolidator's "extra tags" guard so unrelated merge tags inside the same cell don't disable consolidation

In `supabase/functions/_shared/tag-parser.ts`, in the checkbox-glyph pre-pass (around lines 363–380), replace the strict `tagCount !== 3` bail-out with a more precise check:

- Bail out **only** when an extra `{{#if … }}`, `{{#unless … }}`, `{{else}}`, `{{/if}}`, `{{/unless}}`, `{{#each … }}`, or `{{/each}}` **control tag** appears between the matched `#if` and `/if`.
- Plain value merge tags like `{{br_p_fullName}}`, `{{or_p_brkCapacityAgentGlyph}}`, etc., must NOT cause a bail-out — they live outside the captured glyph branches and are preserved verbatim by the regex's backreferences.

This keeps the fix engine-generic (no broker-specific code) and lets the consolidator heal both the Balloon Payment row AND the broker capacity A/B rows, plus any future RE851A YES/NO rows that share the same pattern.

### Step 2 — Add `or_p_isBrkBorrower` to the conditional-alias fallback list

In `tag-parser.ts`, in `getConditionalAliasCandidates` (lines 1135–1152), add a defensive entry so `{{#if or_p_isBrkBorrower}}` falls back to:
- `or_p_brkCapacityPrincipal` (already published as boolean by the engine), and
- `origination_app.doc.is_broker_also_borrower_yes` (the UI persistence key).

Same shape as the existing balloon entries. This is belt-and-suspenders: if the consolidator ever fails for any reason, the conditional still resolves to the right value via the published siblings.

### Step 3 — Verify with edge function logs

After deploy, regenerate RE851A on the current deal and confirm in `generate-document` logs:
- `[generate-document] Derived broker capacity checkboxes from "..."`: principal=true/false matches the UI checkbox.
- `[tag-parser] Consolidated fragmented checkbox conditional for or_p_isBrkBorrower` fires for both the A and B cells (or no fragmentation warning remains).

## What this plan does NOT touch

- No UI changes (`OriginationApplicationForm.tsx`, modals, layouts).
- No DB schema, no migrations, no API contracts.
- No edits to the RE851A `.docx` template (engine-side fix only).
- No changes to other RE851A rows, other templates, or other field mappings.
- The Balloon Payment fix from the previous task remains intact and benefits from the same tightened guard.

## Files to be changed

- `supabase/functions/_shared/tag-parser.ts` — tighten the checkbox-glyph consolidator guard (Step 1) and add the `or_p_isBrkBorrower` alias entry (Step 2).

## Expected outcome

- "IS BROKER ALSO A BORROWER?" checked in CSR → Other Origination → Application → RE851A renders **☐ A. Agent** and **☑ B. Principal**.
- Unchecked → **☑ A. Agent** and **☐ B. Principal**.
- All other checkboxes, conditionals, and merge tags in RE851A and every other template remain unchanged.
