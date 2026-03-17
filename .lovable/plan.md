

## Analysis

The uploaded DOCX template is a single-page document. When merge tags are replaced with actual data values, the content can expand. The user expects the generated document to be exactly 2 pages, with the "Signature: ___ Date: ___" and borrower name section appearing on **Page 2**.

The template currently in storage (`1773414098265_Declaration_of_Oral_Disclosure_With_Field_Codes__1_.docx`) was previously modified (page break added then removed). The user has now provided the **original correct DOCX** as the source of truth.

### Root Cause
There is no forced page break before the Signature section. Whether it lands on page 1 or page 2 depends entirely on how much space the replaced content occupies — making pagination unpredictable.

### Fix
The Signature paragraph needs `<w:pageBreakBefore/>` in its `<w:pPr>` (paragraph properties). This Word property forces the paragraph to start on a new page **without** adding extra whitespace or blank lines (unlike the previously attempted `<w:br w:type="page"/>` which caused a 3-page output).

## Plan

### 1. Replace Template with User's Uploaded DOCX
- Upload the user-provided `Declaration_of_Oral_Disclosure_With_Field_Codes_1.docx` to the `templates` storage bucket, overwriting the current file
- This restores the clean, unmodified template as the baseline

### 2. Add `<w:pageBreakBefore/>` to the Signature Paragraph
- Download the just-uploaded template
- Unpack the DOCX and locate the `<w:p>` paragraph in `word/document.xml` that contains "Signature:"
- Insert `<w:pageBreakBefore/>` inside its `<w:pPr>` block (or create `<w:pPr>` if absent)
- This forces "Signature: ___ Date: ___" and the borrower name line below it to always start on page 2
- Repack and re-upload

### 3. Update Template Record
- Update the `templates` table `file_path` if the filename changes

### What Will NOT Change
- No edge function code changes
- No UI changes
- No database schema changes
- No changes to other templates
- No changes to document generation logic

