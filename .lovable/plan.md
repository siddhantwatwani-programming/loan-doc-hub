## Problem

In RE851A output, generated checkboxes render much smaller than the template. Cause is in `supabase/functions/_shared/tag-parser.ts` → `buildSdtCheckboxXml` (line 676) and `convertGlyphsToSdtCheckboxes` (line 692).

When a template has a static checkbox glyph (☐/☑/☒) in a `<w:r>`, our pipeline replaces that whole run with a freshly-built `<w:sdt>` checkbox. The new SDT's display run uses `<w:rPr>` taken from the original glyph run (when present) OR a default `<w:rPr><w:rFonts w:ascii="MS Gothic" .../></w:rPr>` (when absent).

Two issues shrink the rendered glyph:

1. **Default branch (no rPr on original run):** we emit only `<w:rFonts MS Gothic>` with no `<w:sz>` / `<w:szCs>`. The display run inherits the body default size (often 18 = 9pt or 20 = 10pt), so the glyph renders smaller than the template's checkbox runs which typically carry an explicit `<w:sz w:val="24"/>` (12pt) or `<w:sz w:val="28"/>` (14pt) in their rPr.

2. **Preserved-rPr branch (rPr present):** we wrap the original rPr verbatim but do NOT ensure `<w:rFonts>` is set to MS Gothic. When the surrounding paragraph's default font is a proportional font (Arial/Times), the ☐/☑ codepoint falls back to a glyph that visually appears smaller and thinner than the boxed Wingdings/MS Gothic version Word uses for native SDT checkboxes. Also, when the original rPr has no `<w:sz>`, no size is forced, so it inherits the (smaller) body default.

The other code paths that toggle existing template SDT checkboxes (`processSdtCheckboxes` at line 1804) leave the template's `<w:rPr>` intact and only flip glyphs/state — those are NOT the source of shrinkage. The shrinkage comes only from the SDT blocks we *construct* via `buildSdtCheckboxXml`.

## Fix

Single, surgical change in `buildSdtCheckboxXml` (no other call sites or behaviour touched):

- Always ensure the output `<w:rPr>` for the SDT's display run contains:
  - `<w:rFonts w:ascii="MS Gothic" w:hAnsi="MS Gothic" w:eastAsia="MS Gothic" w:cs="MS Gothic" w:hint="eastAsia"/>` (override any non-MS-Gothic font from the original rPr so the boxed glyph renders at full size and weight).
  - `<w:sz w:val="24"/>` and `<w:szCs w:val="24"/>` (12pt) **only if** the preserved rPr does not already declare an explicit `<w:sz>` — preserves any larger template-defined size and falls back to the standard checkbox size otherwise.

- Apply the same normalized rPr to BOTH the `<w:sdtPr>` and `<w:sdtContent><w:r>` so Word's measurement of the SDT run matches the displayed glyph.

- Keep all existing arguments, return shape, and call sites unchanged. No template, schema, API, UI, or pipeline-stage changes.

## Files to edit

- `supabase/functions/_shared/tag-parser.ts` — `buildSdtCheckboxXml` only (≈8 lines). All other functions, regex passes, integrity checks, and namespace injection logic remain untouched.

## Out of scope (per constraints)

- No edits to `processSdtCheckboxes` (template-native SDTs already preserve their own rPr/size).
- No edits to `docx-processor.ts`, no edits to other templates, no UI/API/schema changes.
- No changes to merge-tag resolution, label-anchored safety passes, or amortization/servicing/payable logic.

## Validation

- Existing tag-parser tests (`tag-parser.*.test.ts`) cover servicing, payable-frequency, amortization, subordination, and broker-capacity flows — they assert the SDT block structure but not internal `<w:sz>` values, so they will continue to pass.
- After deploy, regenerate RE851A and confirm checkboxes match template size and sit correctly aligned with YES/NO labels.
