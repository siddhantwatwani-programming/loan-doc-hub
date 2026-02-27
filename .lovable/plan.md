

## Plan: Fix Field Population + Co-Borrower Conditional in Document Generation

### Root Cause Analysis

There are **three distinct issues** preventing correct document output:

**Issue A — Auth 401 error**: The `getClaims(token)` method used on line 575 of `generate-document/index.ts` is not reliably available in the `@supabase/supabase-js@2` Deno runtime. This causes an undefined method call or auth error, returning 401 before any document processing begins.

**Issue B — "Found 0 merge tags"**: The `normalizeWordXml` function consolidates adjacent text runs using a regex that expects `</w:t></w:r><w:r><w:t>` with only whitespace between. However, Word inserts non-text elements between runs (e.g., `<w:lastRenderedPageBreak/>`, `<w:bookmarkStart/>`, `<w:bookmarkEnd/>`), preventing the regex from matching. This leaves `{{Lender.Name}}` split across multiple runs, invisible to the merge tag parser. The conditional `{{#if has_co_borrower}}` works because it has its own dedicated fragmentation-handling regex (lines 96-118) that tolerates embedded XML.

**Issue C — Missing composite address fields**: Even after tags are detected, `{{Borrower.Address}}` and `{{Lender.Address}}` have no data because no auto-compute logic assembles them from component fields (unlike `property1.address` which is auto-computed on lines 209-224).

**Co-borrower conditional**: Already fully working. Logs confirm `{{#if has_co_borrower}} = false` is correctly evaluated. Once tag detection is fixed, blocks will render/hide correctly.

### Implementation Steps

**File 1: `supabase/functions/generate-document/index.ts`**

| Change | Lines | Detail |
|--------|-------|--------|
| Fix auth | 571-584 | Replace `getClaims(token)` with `getUser()` which is the standard, universally available method. Create authClient with user's Authorization header, call `authClient.auth.getUser()` (no token arg), extract `user.id`. |
| Auto-compute Borrower.Address | After line 242 | Add ~15 lines: assemble `Borrower.Address` from `borrower.address.street`, `borrower.address.city`, `borrower.state`, `borrower.address.zip` (same pattern as property1.address). Set both `Borrower.Address` and `borrower.address`. |
| Auto-compute Lender.Address | After Borrower.Address block | Add ~15 lines: assemble `Lender.Address` from `lender.primary_address.street`, `lender.primary_address.city`, `lender.primary_address.state`, `lender.primary_address.zip`. Set both `Lender.Address` and `lender.address`. |

**File 2: `supabase/functions/_shared/tag-parser.ts`**

| Change | Lines | Detail |
|--------|-------|--------|
| Strip non-text inline elements | After line 26 (after rPr stripping) | Add regex to remove `<w:lastRenderedPageBreak/>`, `<w:bookmarkStart.../>`, `<w:bookmarkEnd.../>`, `<w:noBreakHyphen/>`, `<w:softHyphen/>`, and `<w:tab/>`. These elements sit inside `<w:r>` between `<w:r>` and `<w:t>`, preventing adjacent-run consolidation. ~6 lines. |

**File 3: `supabase/functions/validate-template/index.ts`**

| Change | Lines | Detail |
|--------|-------|--------|
| Same non-text element stripping | After line 75 | Mirror the same stripping additions from tag-parser.ts to keep validation and generation in sync. ~6 lines. |

### What is NOT changed
- No database schema changes
- No UI changes
- No changes to field mappings, template_field_maps, or merge_tag_aliases
- No changes to document layout or structure
- No changes to conditional block processing logic
- No changes to label-based replacement
- No changes to formatting/transforms
- No changes to any frontend components or routes

### Deployment
After code changes, the `generate-document` and `validate-template` edge functions will be redeployed.

