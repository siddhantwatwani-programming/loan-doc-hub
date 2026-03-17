

## Analysis

Based on edge function logs and database inspection:

### Lien Position (`ln_p_lienPosit`)
The logs from the most recent generation show: `[tag-parser] Replacing ln_p_lienPosit -> ln_p_lienPositi = "3rd"`. The merge_tag_alias (`ln_p_lienPosit` -> `ln_p_lienPositi`) exists and is working. The data ("3rd") lives in the `loan_terms` section of `deal_section_values`. **This field IS populating correctly.** If the user is seeing it blank, it may be from a cached/older generated document.

### Page Layout (3 pages instead of 2)
The previous fix injected an explicit `<w:br w:type="page"/>` page break into the template XML before the Signature section. This is the cause of the 3-page output -- the original 2-page template already had correct page flow, and the added hard page break created an extra page.

## Plan

### 1. Fix Template Page Break (Remove Erroneously Added Page Break)
- Download the current template DOCX from storage (`1773414098265_Declaration_of_Oral_Disclosure_With_Field_Codes__1_.docx`)
- Unpack the DOCX and inspect `word/document.xml` for the injected `<w:br w:type="page"/>` near the Signature section
- Remove ONLY the previously injected page break to restore the original 2-page layout
- Repack and re-upload the corrected template to the `templates` storage bucket

### 2. Verify Lien Position
- Regenerate the document after the template fix and confirm both:
  - `ln_p_lienPosit` populates with "3rd"
  - Document is exactly 2 pages

### What Will NOT Change
- No edge function code changes
- No UI changes
- No database schema changes
- No changes to other templates or documents

