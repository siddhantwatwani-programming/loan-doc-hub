

## Fix RE851A + Investor Questionnaire DOCX corruption (round 3)

### Root cause (confirmed by code analysis)

The previous integrity guard now passes — `w:p`/`w:r`/`w:t` tags are balanced and the latest generations are saved as `success`. But Word and Google Docs still report **"File could not open"** because the file has **invalid XML at the schema/namespace level**, which the current tag-balance check does not detect.

The specific defect lives in `supabase/functions/_shared/tag-parser.ts` → `convertGlyphsToSdtCheckboxes` + `buildSdtCheckboxXml`:

1. Both functions emit XML that uses the **`w14:` namespace prefix** (e.g. `<w14:checkbox>`, `<w14:checked>`, `<w14:checkedState>`).
2. `w14` is the Office 2010 extension namespace. It is only valid when the containing root element declares it, e.g.  
   `xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"` and `mc:Ignorable="… w14 …"`.
3. Word templates always declare `w14` on `word/document.xml`, but **headers (`word/header*.xml`), footers (`word/footer*.xml`), footnotes, and endnotes frequently do NOT declare `w14`** — and the converter currently runs over every content part and inserts `w14:` markup unconditionally.
4. RE851A and Investor Questionnaire are the two templates in this packet that contain checkbox glyphs (☐/☑/☒) inside header/footer/footnote runs. The converter rewrites those runs to inject `<w14:checkbox>` into a part where `w14` is undeclared → Word rejects the package as malformed → "File could not open".
5. The new integrity guard (added last round) only checks tag balance for `w:p`/`w:r`/`w:t`, so it never catches this. It marks the file `success` and the user downloads a broken DOCX.

This matches every observed symptom:
- Both failing templates use checkboxes.
- Generations after the previous deploy are stored as `success` with no `error_message`.
- All other templates in the same packet generate fine (they don't add `w14:` to undeclared parts).
- Word's reported error is the generic "could not open", which is its response to undeclared-namespace XML.

### Fix

Surgical, scoped to the two real defects. No template, mapping, layout, naming, schema, API, or permission change.

#### 1) `supabase/functions/_shared/tag-parser.ts`

**a. Make `convertGlyphsToSdtCheckboxes` (and its caller path in `replaceMergeTags`) namespace-aware.**

- Add a small helper `xmlPartDeclaresW14(xml: string): boolean` that returns `true` only when the root element of the part declares the `w14` namespace (`xmlns:w14="…/wordml"`).
- In `convertGlyphsToSdtCheckboxes`, accept a `declaresW14` flag.
  - If `declaresW14 === true`: behave as today (emit `<w:sdt>…<w14:checkbox>…</w:sdt>`).
  - If `declaresW14 === false`: **do not insert any `w14:` markup at all**. Leave the original `<w:r><w:t>☐|☑|☒</w:t></w:r>` run intact. Visual checkbox stays exactly as it was in the template — no layout change, just no SDT promotion in that part.
- Apply the same namespace check around the `processSdtCheckboxes` write paths (those edit existing SDTs in place, which is safe, so no behavior change required there — they already operate only on parts that already contain `<w14:checkbox>`).

**b. Pass `declaresW14` through from `replaceMergeTags` so the conversion only promotes glyphs to SDTs when the host XML part actually allows `w14`.**

This restores valid XML in headers/footers/footnotes/endnotes for RE851A and Investor Questionnaire while preserving full interactive-checkbox behavior in `word/document.xml` (which always declares `w14`). Required by the existing constraint to keep the document-generation engine and RE851A checkbox automation behavior unchanged for the main body.

#### 2) `supabase/functions/_shared/docx-processor.ts`

**Strengthen the integrity guard so a future regression of this exact class is caught before the file is stored as `success`.**

For every content-bearing XML part the generator already validates (`word/document.xml`, `word/header*.xml`, `word/footer*.xml`, `word/footnotes.xml`, `word/endnotes.xml`):

- Keep the existing prolog + root-close + `w:p`/`w:r`/`w:t` balance checks.
- Add a **namespace-usage check**: if the part contains any `<w14:` element but its root element does not declare `xmlns:w14`, throw  
  `DOCX_INTEGRITY: ${partName} uses w14: but does not declare xmlns:w14`.
- Same check for any `<mc:` usage vs `xmlns:mc`, and `<w15:` vs `xmlns:w15` (cheap, prevents adjacent regressions).
- Add a **balance check for `<w:sdt>` ↔ `</w:sdt>`** so a future malformed SDT injection cannot slip past the guard either.

These extra checks are read-only validations on the produced ZIP. They do not modify XML or change any output that is already valid.

#### 3) No other files touched

- No edits to templates, naming, mapping, calculations, modal/UI behavior, permissions, schema, RLS, or storage configuration.
- No DB migration. The previous historical `failed` rows for RE851A / Investor Questionnaire stay as-is per the no-cleanup policy from the prior plan.

### Why this is the minimum correct fix

- `w14:checkbox` injected into a part that does not declare `w14` is the **exact** XML defect that causes Word's "File could not open" while leaving the file structurally a ZIP with all required parts (so MIME, ZIP signature, `[Content_Types].xml`, `_rels/.rels`, etc. are all already correct).
- The fix preserves RE851A's interactive checkboxes wherever they were already valid (the body), and keeps the visible glyph wherever promotion would be invalid (headers/footers/footnotes/endnotes). Layout, fonts, spacing, and section ordering are unchanged because only the `<w:r><w:t>☐</w:t></w:r>` original run is preserved instead of being replaced by an SDT block of identical visible width.
- Hardening the integrity guard means any future class of namespace / SDT corruption is caught at write time and the bad file is never stored as `success`.

### Validation after implementation

1. Regenerate `re851a` for `DL-2026-0212`. Download the latest output. Confirm it opens without "could not open" in Word and Google Docs.
2. Regenerate `Investor Questionnaire` for `DL-2026-0212`. Same check.
3. Spot-check 5 other templates in the same packet (RE 870, RE 885, Addendum to LPDS, Allonge, Note) — all must still generate and open identically, with checkboxes in the body still rendering as native interactive Word checkboxes.
4. Confirm `generated_documents.generation_status` for any future failure carries the more specific `DOCX_INTEGRITY: … uses w14: but does not declare xmlns:w14` message instead of being stored as `success`.

### Files to be touched

- `supabase/functions/_shared/tag-parser.ts` — namespace-aware glyph→SDT promotion only.
- `supabase/functions/_shared/docx-processor.ts` — extra integrity checks (namespace usage + `w:sdt` balance) on already-validated parts.

### Acceptance criteria

- RE851A and Investor Questionnaire DOCX files open cleanly in Word and Google Docs for `DL-2026-0212` and any other deal.
- Existing valid templates continue to open and look pixel-identical.
- Layout, formatting, template structure, file naming, mapping, and permissions are unchanged.
- A future regression that injects undeclared-namespace XML or unbalanced SDTs fails generation instead of producing a corrupt "success" file.

