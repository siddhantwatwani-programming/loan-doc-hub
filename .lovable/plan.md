## Goal

Fix the RE851A Balloon Payment YES/NO checkboxes so they reflect the CSR → Loan → Details → Balloon Payment value, without changing UI, APIs, schema, or unrelated template/generation logic.

## Findings

1. **Data layer is already correct.** In `supabase/functions/generate-document/index.ts` (lines 826–838), the engine reads the persisted value from `loan_terms.balloon_payment` / `ln_p_balloonPaymen` / `ln_p_balloonPayment`, normalizes it, and writes it back under all three keys as a boolean. So the payload contains the right value under both the truncated key (`ln_p_balloonPaymen`) and the full key (`ln_p_balloonPayment`).

2. **Tag aliasing is already in place.** `supabase/functions/_shared/tag-parser.ts` (lines 1098–1108) maps `ln_p_balloonPayment` ↔ `ln_p_balloonPaymen` ↔ `loan_terms.balloon_payment` so either spelling resolves.

3. **Fragmented-tag consolidator already handles `#if`/`else`/`/if`** split across Word XML runs (lines 341–399).

4. **Real remaining cause** (per `.lovable/plan.md` and prior validation): the active RE851A `.docx` Balloon Payment table cell contains stale / mixed / fragmented Handlebars runs from earlier edits — Word has split the inline `{{#if}}…{{else}}…{{/if}}` blocks into XML runs that the consolidator cannot reliably stitch back together in that one cell. Other checkboxes in the same template work, so this is localized to that cell, not the engine.

## Fix Plan (minimal, scoped)

### Step 1 — Harden the inline conditional consolidator for this exact pattern (engine-side, safe)

In `supabase/functions/_shared/tag-parser.ts`, add a focused pre-pass that runs **before** the existing fragmented-tag consolidator, targeting the exact RE851A inline checkbox pattern:

`{{#if KEY}}☑{{else}}☐{{/if}}` and `{{#if KEY}}☐{{else}}☑{{/if}}`

The pre-pass will:
- Match `{{` … `#if` … `KEY` … `}}` … `☑|☐` … `{{` … `else` … `}}` … `☑|☐` … `{{` … `/if` … `}}` even when arbitrary `<w:…>` / `</w:…>` runs and whitespace are interleaved.
- Re-emit a single clean `{{#if KEY}}GLYPH{{else}}GLYPH{{/if}}` triplet inside one run so the downstream Mustache evaluator sees an unambiguous block.
- Only fire when both glyphs are checkbox glyphs (☑ / ☒ / ☐) to avoid touching unrelated conditionals.

This is generic (keyed on the checkbox glyphs, not on `balloonPayment`), so it also self-heals any other RE851A YES/NO cell that Word has fragmented. No behavior change for already-clean templates.

### Step 2 — Add a defensive alias-resolution check in the conditional evaluator

In `tag-parser.ts`, in the `#if` evaluation path, when the looked-up key is `ln_p_balloonPayment` or `ln_p_balloonPaymen` and resolves to `undefined`, fall back to the alias list returned by `getKeyAliases` (already defined at lines 1098–1108) and coerce common truthy strings (`"true"`, `"1"`, `"yes"`, `"on"`, `"checked"`) to `true`. Scope: only this key pair, to honor the minimal-change policy.

### Step 3 — Verify with the existing deal

Use `supabase--edge_function_logs` against `generate-document` for `DL-2026-0189` to confirm:
- The derived log line `[generate-document] Derived ln_p_balloonPayment from "true": true` is emitted.
- No "Consolidated fragmented" warnings remain for the Balloon row, or, if they do, the new pre-pass log line fires.

### What this plan does NOT touch

- No UI changes (LoanTermsDetailsForm, modals, layouts).
- No DB schema, no migrations, no API contracts.
- No changes to `legacyKeyMap.ts`, `fieldKeyMap.ts`, or any other field's mapping.
- No changes to other RE851A rows or other templates.
- No edits to the `.docx` template itself in this step (engine-side fix first; if it still fails we can re-author just that cell as a follow-up).

## Files to be changed

- `supabase/functions/_shared/tag-parser.ts` — add the checkbox-conditional pre-pass and the alias fallback for the balloon key pair.

## Expected outcome

- Balloon Payment checked in CSR → Loan → Details → RE851A renders ☑ YES / ☐ NO.
- Balloon Payment unchecked → ☐ YES / ☑ NO.
- All other checkboxes and conditionals unchanged.