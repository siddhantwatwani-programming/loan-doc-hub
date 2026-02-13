

## Fix: Template Field Key Matching Issues

### Root Cause Analysis

Two issues prevent all 14 tags in the "Declaration of Oral Disclosure and Borrower Acknowledgement" template from resolving:

**Issue 1: Supabase 1,000-Row Query Limit (affects 5 tags)**
The `field_dictionary` table has **1,739 entries**, but both `validate-template` and `generate-document` edge functions fetch without specifying a row limit. Supabase defaults to 1,000 rows, so ~739 field keys are silently dropped. Tags like `broker.phone.cell`, `other.date`, `terms.amortizationType`, `loan.Purpose`, and `property1.appraisal_occupancy` exist in the dictionary but fall outside the first 1,000 rows returned.

**Issue 2: XML Fragmentation in Validation (affects 9 tags)**
The `validate-template` function uses its own simpler `normalizeWordXml` that does NOT strip `<w:rPr>` (formatting/font) blocks from the XML. The shared `tag-parser.ts` used by `generate-document` does strip these (line 26). As a result, tags like `{{loan_terms.impound}}`, `{{loan_terms.clause}}`, `{{broker.compensation}}`, `{{lender.fees}}`, `{{other.late_penalties}}`, `{{other.personal_guarantee}}`, `{{other.third_party_fees}}`, `{{other.cost_of_financing}}`, and `{{other.other_material_terms}}` remain fragmented across styled XML runs and fail to parse.

### Implementation Plan

#### Step 1: Fix the 1,000-row limit in `validate-template`
In `supabase/functions/validate-template/index.ts`, add pagination to the field_dictionary query to fetch all 1,739+ entries. This involves using a loop with `.range()` calls or a single query with a high explicit limit (e.g., 10000).

#### Step 2: Fix the 1,000-row limit in `generate-document`
Apply the same pagination fix to the `completeFieldDictionary` query in `supabase/functions/generate-document/index.ts` (around line 164-166).

#### Step 3: Improve XML normalization in `validate-template`
Add the `<w:rPr>` stripping regex from the shared `tag-parser.ts` into the `normalizeWordXml` function inside `validate-template/index.ts`. Specifically, add this line before existing normalization:
```
result = result.replace(/<w:rPr>[\s\S]*?<\/w:rPr>/g, '');
```
Also add the split-brace consolidation, fragmented-dot, and fragmented-curly-brace patterns that the shared tag-parser already handles.

#### Step 4: Deploy and verify
Deploy both updated edge functions, then re-validate the template to confirm all 14 previously unmapped tags now resolve correctly.

### Technical Details

**Files to modify:**
- `supabase/functions/validate-template/index.ts` -- fix query limit + improve normalizeWordXml
- `supabase/functions/generate-document/index.ts` -- fix query limit

**No database changes required.** All field keys already exist in the `field_dictionary` table.

