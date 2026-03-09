

## Fix: Loan Number Displaying as Comma-Separated Value

### Investigation Summary

The Loan Number for Deal DL-2026-0140 is stored as `78945123` (plain text, data_type = `text`) in `deal_section_values`. The field dictionary entries (`ln_p_loanNumber`, `ln_dt_loanNumber`) are both `data_type: 'text'`.

### Potential Comma Sources

There are two places where numeric-looking text values could get comma-formatted:

1. **`formatByDataType` in `supabase/functions/_shared/formatting.ts`** (used by document generation): The `number` case uses `Intl.NumberFormat` which adds commas. If the field's data_type is ever misread as `number` instead of `text`, commas appear.

2. **`formatForDisplay` in `src/lib/fieldTransforms.ts`** (used by UI): Only formats `currency` and `percentage` — `text` passes through. This is correct.

3. **`LoanTermsDetailsForm.tsx`**: Uses `renderInlineField` which is a plain text `<Input>`. No formatting applied. This is correct.

### Root Cause Hypothesis

The most likely issue is in the **document generation** pipeline. When the tag-parser resolves a merge tag like `{{Loan_Number}}` or `{{Terms.LoanNumber}}`, it calls `formatByDataType(rawValue, dataType)`. If the `dataType` for the resolved field is somehow `number` (perhaps from a different field_dictionary entry or fallback), the value gets comma-formatted.

### Fix

**File: `supabase/functions/_shared/formatting.ts`**

Add an explicit guard in `formatNumber` and `formatByDataType` for the `number` data type — if the value looks like a plain integer identifier (no decimals, used as an ID), skip comma formatting. More precisely, add a safety check: treat `text` fields as raw strings with no numeric formatting.

Actually, the simpler and more correct fix: ensure `formatByDataType` for `text` type **never** applies number formatting, even if the value looks numeric. This is already the case. The real fix should be in `tag-parser.ts` where it falls back — if a field resolves but has no explicit data_type match, ensure `text` is the default.

**Additionally**, to be safe against future regressions, update the `formatByDataType` `number` case in `formatting.ts` to NOT format values that are identifiers (no decimals, could be loan numbers). A simpler approach: just ensure the Loan Number field's data_type stays `text` and that the resolution chain preserves it.

### Concrete Change

**File: `supabase/functions/_shared/formatting.ts`** — In the `formatByDataType` function, ensure `text` data type returns the raw value with zero numeric formatting (already correct).

**File: `supabase/functions/_shared/tag-parser.ts`** — Where field data is resolved and `formatByDataType` is called, add a safeguard: if a field key contains `loannumber` or `loan_number` (case-insensitive), force `text` data type to prevent accidental number formatting.

Better approach — **make a universal fix**: In `formatting.ts`, update the `number` formatter to skip comma formatting for integer values that look like identifiers (e.g., no decimal point, length > 4). Actually this is too heuristic-heavy.

**Best approach**: The field is already `text` in the dictionary. The fix is to ensure the edge function correctly reads the data_type as `text`. Let me verify the exact resolution in `tag-parser.ts`:

Looking at lines 680-698 of tag-parser.ts: when resolving curly brace tags, it calls `formatByDataType(resolved.data.rawValue, resolved.data.dataType)`. The `resolved.data.dataType` comes from the `fieldValues` Map which was populated in `generate-document/index.ts` line 169 with `fieldDict.data_type`. Since `fieldDict.data_type` for `ln_p_loanNumber` is `text`, this should work correctly.

**The remaining possibility**: The value might be stored as `value_number` in the JSONB (not `value_text`), and `extractRawValueFromJsonb` might return a number, which when passed to `formatByDataType('text')` calls `String(value)` — which for a number like 78945123 would return `"78945123"` without commas. So that's fine too.

Given my thorough code analysis shows no path that would add commas to a `text`-typed field, the issue might be:
- A **browser-side caching** issue showing stale formatted data
- The value was previously stored when the field had `data_type: 'number'` 
- The generated document was created before the data_type was fixed

### Recommended Plan

1. **Verify and re-generate**: The Loan Number field is correctly configured as `text` in the database. Re-generating the document should produce the value without commas.

2. **Add defensive guard in `formatting.ts`**: Update `formatByDataType` for the `number` case to skip comma formatting if the field key suggests it's an identifier (loan number, account number, etc.). This is a safety net.

3. **Add explicit `text` override in `generate-document/index.ts`**: After line 190 (where the comment about Loan Number already exists), add code to force `text` data type for any field key matching `*loannumber*` or `*loan_number*`.

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/generate-document/index.ts` | Force `text` dataType for Loan Number fields after value resolution |
| `supabase/functions/_shared/formatting.ts` | Add safety guard in `formatByDataType` for `number` type to not comma-format identifier-like values |

