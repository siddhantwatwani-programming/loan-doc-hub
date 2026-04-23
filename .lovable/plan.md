

## Fix Hazardous Materials Certificate – Lender Block Duplicated

### Problem

The generated DOCX shows the Lender details in two places:

1. Inline sentence: *"…in favor of Del Toro Loan Servicing Inc a California Corporation ddd dads ('Lender')."*
2. A second standalone block lower in the document: *"ddd dads / Del Toro Loan Servicing Inc / a California Corporation"*

The mapping logic in `supabase/functions/generate-document/index.ts` (lines 1365–1398) is correct — it resolves each lender tag once. The duplication is caused by the template file itself (`1775837145212_Hazardous_Materials_Certificate-Key_Mapping.docx`) containing the same lender merge tags in **two physical locations**: the inline paragraph and a second signature/identification block below.

### Root Cause

Template `Test Version-1 (v1)` for "Hazardous Materials Certificate and Indemnity Agreement" contains a duplicated lender placement block (the second occurrence appears to be a signature-style block showing name + vesting on separate lines). Both locations resolve the same `{{ld_p_firstIfEntityUse}}{{ld_p_middle}}{{ld_p_last}}` and `{{ld_p_vesting}}` tags, producing the visible duplicate.

### Fix Approach

Modify the **template DOCX** (the only source of the duplication) to remove the second lender block while preserving:
- All other content, layout, fonts, spacing, headings
- The first inline lender reference ("…in favor of … ('Lender').")
- The Borrower block, Account Number, body text, and signature lines unrelated to the lender identification block

Steps:

1. Download the current template (`1775837145212_Hazardous_Materials_Certificate-Key_Mapping.docx`) from the `templates` storage bucket.
2. Unpack the DOCX, locate the second `{{ld_p_*}}` paragraph cluster in `word/document.xml` (the standalone block matching the screenshot's bottom three lines).
3. Remove only the paragraphs that comprise the duplicate lender block. Leave all surrounding paragraphs, page breaks, and signature scaffolding intact.
4. Repack and validate the DOCX (no schema/structure changes elsewhere).
5. Re-upload the corrected file as a **new version** of the same template record (`id = ff06e3a1-3804-480f-94b5-0c255b5e96ad`) so that file naming logic and template metadata remain unchanged. Use the existing template upload/replace flow — no new APIs.

### What Will NOT Change

- `generate-document/index.ts` mapping logic — already correct, leave untouched.
- Field dictionary, merge tag aliases, RLS, schema.
- Any other template, packet assignment, or file naming convention.
- The first (inline) lender reference and its conditional individual/entity behavior.

### Validation

After re-upload, regenerate Hazardous Materials Certificate for deal `DL-2026-0212`:

- **Lender Type = IRA / ERISA (Entity)** → lender appears once inline as: `Del Toro Loan Servicing Inc a California Corporation ddd dads ("Lender")`. No standalone block below.
- **Lender Type = Individual** → lender appears once inline with name only (no vesting), no standalone block.
- Document opens cleanly in MS Word with unchanged formatting, fonts, and pagination.

### Files Touched

- Template binary (re-uploaded via existing template management flow): `Hazardous_Materials_Certificate-Key_Mapping.docx`
- No code or schema changes.

