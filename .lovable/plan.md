

## Analysis

The "Declaration of Oral Disclosure" template should be exactly 2 pages:
- **Page 1**: Main disclosure content
- **Page 2**: "Broker/Agent Attestation of Oral Disclosure" with Signature/Date section

The previous fix attempt added a `<w:br w:type="page"/>` which caused 3 pages, and was subsequently removed. The signature section is now not landing on page 2 correctly.

### Root Cause

The template relies on content length to naturally push the attestation section to page 2. When merge tags are replaced with actual values (which may be shorter than the placeholder text), the content shrinks and the attestation section moves up onto page 1.

The correct fix is to use Word's `<w:pageBreakBefore/>` property on the "Broker/Agent Attestation of Oral Disclosure" paragraph. Unlike an inline `<w:br w:type="page"/>` (which adds a blank line + page break and caused the 3-page issue), `<w:pageBreakBefore/>` is a paragraph property that forces the paragraph to start on a new page without inserting extra whitespace.

## Plan

### 1. Download and Inspect Template XML
- Download `1773414098265_Declaration_of_Oral_Disclosure_With_Field_Codes__1_.docx` from the `templates` bucket
- Unpack and locate the "Broker/Agent Attestation of Oral Disclosure" paragraph in `word/document.xml`
- Verify there is no existing page break mechanism

### 2. Add `<w:pageBreakBefore/>` to the Attestation Heading
- Find the `<w:p>` containing "Broker/Agent Attestation of Oral Disclosure"
- Add `<w:pageBreakBefore/>` inside its `<w:pPr>` (paragraph properties)
- This ensures page 2 starts at this paragraph regardless of content length above it
- This does NOT add extra whitespace or empty paragraphs (unlike `<w:br w:type="page"/>`)

### 3. Repack and Upload
- Repack the modified XML back into the DOCX
- Upload to the `templates` bucket, overwriting the current file

### 4. Verify
- Regenerate the document and confirm exactly 2 pages with signature on page 2

### What Will NOT Change
- No edge function code changes
- No UI changes  
- No database schema changes
- No changes to other templates

