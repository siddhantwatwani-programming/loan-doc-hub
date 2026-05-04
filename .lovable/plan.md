## Problem

In the generated RE851D, the question **"Do any of these payments remain unpaid?"** renders both ☑ YES and ☑ NO together, regardless of the CSR "Currently Delinquent" checkbox state.

## Root Cause

The data layer in `supabase/functions/generate-document/index.ts` (lines 2280–2358) already publishes correct per-lien / per-property booleans and glyph aliases:

- `pr_li_currentDelinqu_N_yes` / `pr_li_currentDelinqu_N_no` (booleans)
- `pr_li_currentDelinqu_N_yes_glyph` / `pr_li_currentDelinqu_N_no_glyph` (☒/☐)

However, the authored RE851D template at the "remain unpaid" line uses **two static ☐ glyphs** (or a non-strict conditional that does not negate properly across YES/NO), so neither glyph is being anchored to the boolean. The result is that both checkboxes pass through unchanged (both ☑ from the static template), or both flip to ☑ during the glyph→SDT pass.

## Fix (single, scoped change)

Add a **post-resolution safety pass** for RE851D — analogous to the existing RE851A Servicing/Amortization/Payable safety passes — that anchors the YES and NO checkbox glyphs immediately following the literal text **"Do any of these payments remain unpaid?"** to the property-indexed boolean.

### Where

`supabase/functions/generate-document/index.ts`, inside the existing `if (/851d/i.test(template.name || ""))` post-processing block (the same region that already contains the encumbrance and `_(N)_(S)` cleanup passes).

### What the pass does

For each occurrence of the question text in `word/document.xml`:

1. Locate the question text run, then walk forward in the XML until it finds the first checkbox-glyph run (☐/☑/☒) followed (later) by `YES`, then the next glyph followed by `NO`, all within a bounded window (e.g. ≤ 4 KB ahead, single property block).
2. Determine which property index this question belongs to by scanning back to the nearest `PROPERTY #K` anchor (using the same `findAnchorOffsets` helper already used for `_N` rewriting in this file).
3. Read the resolved boolean from `fieldValues.get('pr_li_currentDelinqu_' + K + '_yes')` (falling back to `_no` and bare `pr_li_currentDelinqu_K`).
4. Rewrite the two glyph text nodes:
   - YES glyph → ☑ if true, ☐ if false
   - NO glyph → ☐ if true, ☑ if false
5. Increment a debug counter and log per occurrence.

The pass runs **after** all merge-tag substitution and **before** `convertGlyphsToSdtCheckboxes`, so the ☑/☐ characters are then converted into native interactive Word SDT checkboxes by the existing post-processor — guaranteeing exactly one checked box.

### Strict scoping

- Only triggers for templates whose name matches `/851d/i`.
- Only matches the literal anchor text "Do any of these payments remain unpaid".
- Bounded look-ahead window prevents touching unrelated YES/NO checkboxes (e.g. "Will the proceeds…").
- No template edits required and no schema or UI changes.

## Files to change

- `supabase/functions/generate-document/index.ts` — add the safety pass inside the existing RE851D `if` block.

## Out of scope (per minimal-change policy)

- No changes to `tag-parser.ts`, no new dictionary fields, no UI changes, no migrations, no edits to other templates.

## Expected outcome

For every property on RE851D:

- CSR "Currently Delinquent" = ☑ → document shows ☑ YES ☐ NO
- CSR "Currently Delinquent" = ☐ → document shows ☐ YES ☑ NO
- Never both checked.
