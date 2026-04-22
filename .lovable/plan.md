

## Fix RE851A + Investor Questionnaire DOCX corruption (Google Docs / Word can't open)

### Root cause

The integrity guard now passes (files are marked `success`, no error), but Google Docs and Word still refuse to open the output. The remaining bug is a **namespace problem**, not a tag-balance problem — which is exactly why the current `<w:p>/<w:r>/<w:t>` balance check doesn't catch it.

The post-processing pass `convertGlyphsToSdtCheckboxes` (in `supabase/functions/_shared/tag-parser.ts`, lines 593–648) injects this XML wherever it finds a `<w:r>` containing only `☐ / ☑ / ☒`:

```xml
<w:sdt>
  <w:sdtPr>
    <w:rPr>…</w:rPr>
    <w14:checkbox>
      <w14:checked w14:val="0"/>
      <w14:checkedState w14:val="2612" w14:font="MS Gothic"/>
      <w14:uncheckedState w14:val="2610" w14:font="MS Gothic"/>
    </w14:checkbox>
  </w:sdtPr>
  <w:sdtContent>…</w:sdtContent>
</w:sdt>
```

This uses the `w14` namespace prefix. For `w14` to be valid, the part's root element (`<w:document>`, `<w:hdr>`, `<w:ftr>`, `<w:footnotes>`, `<w:endnotes>`) must declare:

```
xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
```

The RE851A template (and Investor Questionnaire) is an older RE form whose body uses plain `[ ]` / `☐` glyphs, not native SDT checkboxes. Its root part(s) very likely **do not declare the `w14` prefix**. The moment the post-pass injects `<w14:checkbox>` into such a part, the file becomes XML-namespace-invalid. Word's tolerant parser sometimes still opens it; Google Docs (stricter) does not — exactly matching the user's report ("File could not open. Try refreshing the page."). Tag-balance counts (`<w:p>` / `<w:r>` / `<w:t>`) stay equal, so the current integrity check cannot catch it.

This explains:
- Why DB rows show `success` while the file won't open.
- Why earlier "fixes" tightened balance checks but the corruption persisted.
- Why this specifically hits RE851A and Investor Questionnaire (old templates without `w14`) but not templates that already use SDT checkboxes (which already declare `w14`).

### Fix (minimum, surgical, no template/UI/format changes)

#### 1. Ensure `w14` (and adjacent w14-required) namespaces are declared on every processed XML part — only when missing

In `supabase/functions/_shared/docx-processor.ts`, after `replaceMergeTags(...)` returns `processedXml` for each content-bearing part (`word/document.xml`, `word/header*.xml`, `word/footer*.xml`, `word/footnotes.xml`, `word/endnotes.xml`):

- Detect whether the produced XML contains any `w14:` element/attribute (`<w14:` or ` w14:`).
- If yes, locate the root element of that part:
  - `<w:document …>` for `word/document.xml`
  - `<w:hdr …>` for `word/header*.xml`
  - `<w:ftr …>` for `word/footer*.xml`
  - `<w:footnotes …>` for `word/footnotes.xml`
  - `<w:endnotes …>` for `word/endnotes.xml`
- If the root tag does **not** already contain `xmlns:w14="…wordml"`, inject the `xmlns:w14` declaration into the root tag attributes. Do the same defensive injection for `mc:Ignorable` so older readers ignore the new prefix when present.

This is a localized string edit on the root opening tag of each processed part. It changes **no** content, formatting, layout, fonts, table widths, page breaks, headers/footers, or template structure. It only adds an XML namespace declaration that the part now needs because we injected `w14:` content into it.

#### 2. Guarantee no orphan `\uFFFD_SDT_PLACEHOLDER_n_END` markers survive

Same file, same function (`convertGlyphsToSdtCheckboxes`, lines 593–648). After the placeholder restore loop:

- Assert that the resulting XML contains no remaining `\uFFFD_SDT_PLACEHOLDER_` substring. If any survive (depth-extraction edge case), fall back by replacing each remaining marker with the original SDT block stored at that index (or, if missing, an empty string) before the function returns. This prevents `\uFFFD` and the literal placeholder text from ever leaking into `word/*.xml`. Google Docs treats `\uFFFD` (U+FFFD) inside element/attribute names as an invalid name char, which is a second class of "won't open" corruption.

#### 3. Strengthen the integrity check so this class of corruption is caught — without parsing the whole document with a heavyweight XML parser

In `processDocx`, in addition to the existing `<?xml` prolog, root close, and `<w:p>/<w:r>/<w:t>` balance checks, add three cheap but high-value assertions per processed content part:

1. The XML contains no `\uFFFD` and no `_SDT_PLACEHOLDER_` text.
2. If the part contains any `w14:` token, its root element (`<w:document …>`, `<w:hdr …>`, `<w:ftr …>`, `<w:footnotes …>`, `<w:endnotes …>`) declares `xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"`.
3. There are no orphan/unclosed text-run sequences from a botched substitution: simple regex check that every `</w:t>` is preceded (looking back through the immediately surrounding XML window) by a matching `<w:t…>` open. (Already partially covered by tag-balance, kept for safety.)

If any of these fail, throw `DOCX_INTEGRITY: <part> <reason>` exactly as today, so:

- The job is recorded as failed (not falsely `success`).
- The error message names the offending part and the reason — actionable for ops.

#### 4. No template, mapping, layout, or pipeline changes

Explicitly out of scope: the templates themselves, placeholder names (`{{ln_p_loanAmount}}`, etc., including the malformed `${…}}` and `{{ln_p_estimateBall 00Paymen}}` already in the source template), field maps, document generation flow, file-naming, permissions, and storage paths. The fix is entirely inside `_shared/docx-processor.ts` (and a tiny helper consumed by it from `_shared/tag-parser.ts`'s post-pass).

### Files touched

- `supabase/functions/_shared/docx-processor.ts`
  - Add `ensureW14Namespace(xml, partName)` and call it after each successful `replaceMergeTags(...)`.
  - Extend the integrity assertions to detect missing `w14` declarations and `\uFFFD` / placeholder leakage.
- `supabase/functions/_shared/tag-parser.ts`
  - In `convertGlyphsToSdtCheckboxes`, after the placeholder restore loop, run a final defensive sweep that replaces any leftover `\uFFFD_SDT_PLACEHOLDER_<n>_END` with the stored block (or empty) so the marker can never reach the output XML.

No other files change. The edge function is auto-deployed.

### Validation

For DL-20260-0212:

1. Regenerate `re851a` and `Investor Questionnaire`.
2. Confirm new rows in `generated_documents` are `success` AND the `.docx` opens cleanly in:
   - Microsoft Word
   - Google Docs
3. Visually compare against a pre-fix-good rendering of the same template: layout, page breaks, tables, header/footer, fonts, spacing must be unchanged.
4. Repeat for at least 5 other deal files using the same templates to confirm no regression.
5. Spot-check a template that already uses native SDT checkboxes (e.g. RE885 / one of the loan-doc-packet templates) to confirm the `w14` injection is a no-op when the namespace is already declared.

### Acceptance criteria

- RE851A and Investor Questionnaire generated for DL-20260-0212 open cleanly in both Word and Google Docs.
- The fix is template-agnostic — works for every loan file and every template that uses checkbox glyphs.
- No template, layout, font, table width, page break, or placeholder change.
- Any future corruption of the same class is reported as `DOCX_INTEGRITY: <part> <reason>` instead of being stored as `success`.

