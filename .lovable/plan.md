

## Problem Analysis

Three distinct issues with "Assignment of Rents and Profits Agreement With Field Codes":

### Issue 1: Orphaned `}}` — "Ravi Kumar Chauhan}}"
The cleanup code at lines 1177-1198 of `tag-parser.ts` only removes orphaned `{{` from `<w:t>` elements. There is NO equivalent cleanup for orphaned `}}`. When Word splits `}}` across runs and the tag replacement resolves the tag but leaves behind a `}}` fragment in an adjacent text run, it survives in the output.

### Issue 2: `br_p_vesting` not populating
The field `br_p_vesting` exists in field_dictionary. The borrower contact (B-00002) has `vesting: "adding vesting"` in `contact_data`. However, the `injectContact` function in `generate-document/index.ts` does NOT inject `vesting` from contact_data — it's simply missing from both the dot-prefix and short-prefix injection blocks.

### Issue 3: Other fields (`ln_p_loanNumber`, `pr_p_*`, `currentDate`)
These fields are already handled by existing code (`currentDate` injected at line 447, `ln_p_loanNumber` populated from deal_section_values, `pr_p_*` from property data). They likely either: (a) don't have data entered for this deal, or (b) suffer from the same XML fragmentation/fldChar hiding issue. Since the user hasn't generated this template yet (logs only show Agency Disclosure), we can't confirm. The `br_p_vesting` fix and `}}` cleanup are the definitive fixes needed.

## Plan

### 1. Add orphaned `}}` cleanup in `tag-parser.ts` (lines ~1198)
Add a mirror of the orphaned `{{` cleanup that also removes orphaned `}}` from `<w:t>` elements where no complete `{{...}}` tag exists.

### 2. Inject `vesting` from contact_data in `generate-document/index.ts`
In the `injectContact` function:
- **Dot-prefix block** (~line 306): Add `if (cd.vesting) setIfEmpty(\`${prefix}.vesting\`, cd.vesting);`
- **Short-prefix block** (~line 323): Add `if (cd.vesting) setIfEmpty(\`${shortPrefix}_vesting\`, cd.vesting);`
- Also add `if (cd.capacity) setIfEmpty(\`${shortPrefix}_capacity\`, cd.capacity);` to short-prefix (it's in dot-prefix but missing from short-prefix)

### Files Modified

| File | Change |
|------|--------|
| `supabase/functions/_shared/tag-parser.ts` | Add orphaned `}}` cleanup pass (mirror of existing `{{` cleanup) |
| `supabase/functions/generate-document/index.ts` | Inject `vesting` and `capacity` from contact_data in both dot-prefix and short-prefix blocks |

### No Changes To
- Database schema, UI, template files, other edge functions, document layout/styling

