

## Plan: Fix Signature Section Page Placement

### Root Cause

The uploaded template is a single-page document where the Signature section sits at the bottom. When rendered in Word, the content + table + spacing naturally flows to 2 pages due to font sizes and line spacing. However, there is no **explicit page break** in the template XML — pagination depends entirely on content length.

When merge tags are replaced (some populated, some blanked to empty), the text length changes, causing Word to reflow content. This pushes the Signature block to page 3 instead of keeping it on page 2.

### Fix

Add an explicit `<w:pageBreakBefore>` to the paragraph containing the "Signature:" text in the stored template. This guarantees the Signature section always starts on a new page regardless of how content above it reflows.

Per project conventions (from memory): use `<w:pageBreakBefore w:val="1"/>` inside the paragraph's `<w:pPr>` block rather than inline `<w:br w:type="page"/>`.

### Implementation

**Approach**: Modify the template DOCX file in storage by extracting its XML, adding the page break property to the Signature paragraph, and re-uploading.

Steps:
1. Download the current template from storage (`1773850234074_Declaration_of_Oral_Disclosure_With_Field_Codes__1_.docx`)
2. Extract XML using the docx extraction script
3. Locate the paragraph containing "Signature:" in `word/document.xml`
4. Add `<w:pageBreakBefore w:val="1"/>` to that paragraph's `<w:pPr>` block
5. Repack the DOCX
6. Upload the modified template back to storage, replacing the existing file

### What is NOT changed
- No edge function code changes
- No tag-parser changes
- No UI changes
- No database changes
- No other templates affected
- Template content, formatting, and styling remain identical — only an explicit page break property is added

