## Goal
Render checked checkboxes as ☑ instead of ☒ in all generated documents (RE851D and others). Logic unchanged — glyph swap only.

## Changes

1. **`supabase/functions/generate-document/index.ts`**
   - Replace every `"☒"` literal with `"☑"` in all glyph publishers and safety passes (per-property, per-lien, anti-fallback shield, RE851A/D, investor-questionnaire setter).

2. **`supabase/functions/_shared/tag-parser.ts`**
   - Add a final glyph-standardization pass at the end of `replaceMergeTags` (just before `convertGlyphsToSdtCheckboxes`) that rewrites any surviving `☒` to `☑`. Guarantees no `☒` reaches the output even from template-static glyphs.
   - SDT generation is already correct (`w14:checkedState val="2611"` = ☑) — no change there.

3. **Memory** — record `mem://design/checkbox-glyph-standard`: "Use ☑ for checked, ☐ for unchecked. Never emit ☒."

4. **Deploy** the `generate-document` edge function.

## Out of scope
No template, schema, field-dictionary, publisher logic, or UI changes.
