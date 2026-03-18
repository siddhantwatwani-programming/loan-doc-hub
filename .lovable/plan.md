
Minimal plan to fix only the Signature & Date page-placement issue in “Declaration of Oral Disclosure With Field Codes”:

1. Confirm the exact active template file
- The current template record in Lovable Cloud points to:
  `1773855841066_Declaration_of_Oral_Disclosure_With_Field_Codes__1_.docx`
- Only this template file will be touched.

2. Apply a template-only pagination fix
- Do not change the document generation code.
- Edit the stored DOCX itself by opening `word/document.xml`.
- Locate the paragraph that contains the visible `Signature:` line.
- Add a paragraph-level page boundary there:
  `<w:pageBreakBefore w:val="1"/>`
- Put it inside that paragraph’s existing `<w:pPr>` block.
- Do not alter any surrounding runs, tabs, blank paragraphs, spacing paragraphs, alignment, or field tags.

3. Preserve all original spacing exactly
- Keep the intentional empty lines / spacing blocks above the signature section unchanged.
- Do not collapse or trim whitespace.
- Do not move the broker-name line:
  `{{bk_p_firstName}} {{bk_p_LastName}}`
- Do not insert inline page-break runs (`<w:br w:type="page"/>`) unless the paragraph has no safe paragraph-properties block; prefer the paragraph-level setting to avoid reflow side effects.

4. Re-upload the corrected file to the same template path
- Replace only the current template source file in storage.
- Do not create a new template record.
- Do not modify any other templates.

Why this is the minimal fix
- The current generation flow downloads the template and processes only content XML; it preserves non-targeted XML/binary parts.
- The merge-tag parser does not globally trim blank paragraphs; its empty-paragraph cleanup is limited to conditional blocks.
- That means the safest fix is not a code refactor — it is a precise XML correction in the template so the Signature section always starts on Page 2 and the original Page 2 spacing stays intact.

Validation after implementation
- Regenerate the document from the same template.
- Confirm the output is exactly 2 pages.
- Confirm the Signature line, Date field, and broker name stay fixed on Page 2 in the same visual position as the original template.
- Confirm no other text, spacing, or layout shifts occurred elsewhere in the document.
