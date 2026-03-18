

## Plan: Fix Lien Interest Rate Field Population and Page Layout

### Problem Analysis

**Issue 1: `li_gd_interestRate` not populating**
- Edge function logs confirm: `No data for li_gd_interestRate`
- Lien data is stored in `deal_section_values` with keys like `lien1.interest_rate`
- The lien field bridging map in `generate-document/index.ts` (lines 754-800) does NOT include `interest_rate` → `li_gd_interestRate` mapping
- The existing bridge only maps to `pr_li_*` keys, not to the new `li_gd_*` keys from the Liens section

**Issue 2: Document generates 3 pages instead of 2**
- When merge tags with no data are cleaned (blanked), the resulting text length changes cause Word to reflow content
- Empty placeholders leave whitespace gaps that push content to a third page
- The Signature/Date section that should be on page 2 gets pushed to page 3

### Changes Required

#### 1. Update Lien Field Bridging in Edge Function
**File:** `supabase/functions/generate-document/index.ts` (around line 754)

Add `interest_rate` to the `lienFieldToPrLi` bridge map, and also add a new bridge map for `li_gd_*` keys so lien data stored as `lien1.*` is accessible via the new Liens section field keys:

Add these entries to the existing lien bridging section:
- `interest_rate` → `li_gd_interestRate`
- `lien_priority_now` → `li_gd_lienPriorityNow`
- `lien_priority_after` → `li_gd_lienPriorityAfter`
- `maturity_date` → `li_gd_maturityDate`
- `email` → `li_gd_email`
- `fax` → `li_gd_fax`
- `loan_type` → `li_gd_loanType`
- `this_loan` → `li_gd_thisLoan`
- `recording_date` → `li_rt_recordingDate`
- `existing_paydown_amount` → `li_bp_existingPaydownAmount`
- `existing_payoff_amount` → `li_bp_existingPayoffAmount`

This maps all the `lien1.*` stored data to the new `li_gd_*`, `li_bp_*`, `li_rt_*` field keys from the Liens section.

#### 2. Fix Page Layout (3 pages → 2 pages)
**File:** `supabase/functions/_shared/tag-parser.ts`

The no-data tag cleaning (line 1166) currently does `result.split(tag.fullMatch).join('')` which removes the tag text entirely, potentially collapsing runs and causing reflow. For the "Declaration of Oral Disclosure" template specifically, the issue is that empty tags leave behind empty `<w:r>` structures or alter paragraph sizing.

The fix: Instead of removing no-data tags entirely, replace them with an empty string (already happening), but also ensure that when a tag is the ONLY content of a `<w:t>` element, the entire run is preserved with empty text rather than being stripped. This maintains the template's spatial layout.

Actually, the simpler and more targeted fix: the 3-page issue is caused by `li_gd_interestRate` being blanked when it should have had a value. Once the lien interest rate correctly populates, the content length will match what the template expects, and the document will stay at 2 pages. The primary fix is ensuring field data populates correctly.

### Implementation Summary

1. **Edge function update only** — add `li_gd_*` key mappings to the lien field bridging block in `generate-document/index.ts`
2. No template modification
3. No UI changes
4. No database schema changes

