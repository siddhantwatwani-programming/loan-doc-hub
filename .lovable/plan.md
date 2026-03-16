
Deep technical analysis: why `{{br_p_fullName}}` is not populating

Summary
- The placeholder is valid and is being detected correctly.
- The document generation pipeline is functioning as designed.
- The real problem is missing persisted borrower-name data for this deal, not placeholder parsing.

What I verified
1. Template content is correct
   - The uploaded/mapped DOCX contains `{{br_p_fullName}}` twice.
   - It also contains `{{ln_p_loanNumber}}`, which does populate.

2. The tag parser is working
   - Edge logs show:
     - `Found 2 merge tags: br_p_fullName, ln_p_loanNumber`
     - `Replacing ln_p_loanNumber -> ... = "3424234"`
     - `No data for br_p_fullName (canonical: br_p_fullName)`
     - `Cleaning 1 no-data tags: br_p_fullName`
   - This proves the placeholder is being found, parsed, and then blanked only because no value exists.

3. The generator already has fallback logic
   - In `supabase/functions/generate-document/index.ts`, the function:
     - builds `fieldValues` from `deal_section_values`
     - bridges indexed keys like `borrower1.full_name` to `borrower.full_name`
     - auto-computes `br_p_fullName` from:
       - `borrower1.full_name`
       - `borrower.full_name`
       - or borrower first/middle/last name parts
   - So this is not currently a missing-bridge bug.

4. The backend data for this deal is missing the borrower source
   - For deal `e78b793b-94c9-4e22-866f-f3633330fd60`, `deal_section_values` only contains:
     - `loan_terms`
     - `broker`
   - There is no `borrower` section row at all.
   - There is no stored value for `br_p_fullName`.
   - `deals.borrower_name` is also `null`.

5. The likely upstream persistence gap is in Loan Details
   - `src/components/deal/LoanTermsDetailsForm.tsx` uses `loan_terms.details_borrower_name`.
   - `src/hooks/useDealFields.ts` only persists keys that resolve to a real `field_dictionary` entry.
   - I checked `field_dictionary`: there is no entry for `loan_terms.details_borrower_name`.
   - Result: that value can exist in UI state, but `saveDraft()` will skip it and it never reaches the backend.

Root cause
- `{{br_p_fullName}}` is blank because the document generator has no persisted borrower full-name value to read for this deal.
- The failure is upstream data persistence/mapping, not DOCX replacement, merge-tag parsing, or template syntax.

Important correction to earlier assumptions
- `br_p_fullName` is not failing because the generator cannot bridge it anymore.
- The current source already includes that fallback.
- The actual blocker is that this deal has no borrower data stored in any source the generator reads.

Why `ln_p_loanNumber` works but `br_p_fullName` does not
- `ln_p_loanNumber` has persisted data in `loan_terms`.
- `br_p_fullName` has no persisted borrower section data, and no populated fallback source.

Technical evidence
- `field_dictionary` contains `br_p_fullName` as a valid borrower field.
- The mapped template has `0` `template_field_maps`, but that is not the blocker here because explicit `{{...}}` tags are resolved directly from `fieldValues`.
- The tag parser only blanks the field after resolution fails.

Recommended implementation path if approved
1. Fix the save path so Loan Details “Borrower Name” writes into an existing persisted borrower source used by generation.
2. Optionally add a final fallback in `generate-document` from an already-persisted deal-level borrower summary if that is the intended source of truth.
3. Re-test this exact deal and confirm logs change from:
   - `No data for br_p_fullName`
   to a replacement log for `br_p_fullName`.

Minimum-change conclusion
- No template change is needed.
- No schema change is required if the borrower name is mapped into an existing persisted field.
- The issue is a data-source/persistence gap, not a document-generation parsing defect.
