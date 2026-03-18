

## Plan: Fix Lien Position Field & Page Layout in Declaration of Oral Disclosure

### Problem Analysis

1. **`{{ln_p_lienPosit}}` not populating**: The template uses `ln_p_lienPosit` but the field dictionary's legacy key is `ln_p_lienPositi` (with trailing 'i'). The single-character mismatch prevents resolution.

2. **`{{li_gd_interestRate}}` not populating**: Lien bridging was added in the previous fix, mapping `lien1.interest_rate` → `li_gd_interestRate`. This should work if lien data exists. However, the `priority` field also needs bridging to `li_gd_lienPriorityNow` for the Lien Position context.

3. **3 pages instead of 2**: When tags fail to resolve, they get blanked, altering text flow and causing Word to reflow content across extra pages. Fixing the tag resolution will restore correct pagination.

### Changes Required

#### 1. Edge Function: Add `ln_p_lienPosit` alias bridging
**File:** `supabase/functions/generate-document/index.ts` (after lien bridging block, ~line 821)

Add a short-name alias bridge: if `ln_p_lienPositi` has data, also set `ln_p_lienPosit` so the template tag resolves. This is a 3-line addition after the existing lien bridging block:

```typescript
// Bridge ln_p_lienPosit (template tag) -> ln_p_lienPositi (actual field key)
const lienPosVal = fieldValues.get("ln_p_lienPositi");
if (lienPosVal && !fieldValues.has("ln_p_lienPosit")) {
  fieldValues.set("ln_p_lienPosit", lienPosVal);
}
```

Also bridge `priority` from lien data to `ln_p_lienPositi` (and thereby `ln_p_lienPosit`):
Add `"priority": "ln_p_lienPositi"` to the existing `lienFieldToPrLi` map (line 756) since it's not currently there (only `pr_li_lienPriori` is mapped).

#### 2. Upload corrected template to storage
Replace the stored template with the user's uploaded DOCX to ensure the layout source of truth matches. Use the existing storage path: `1773850234074_Declaration_of_Oral_Disclosure_With_Field_Codes__1_.docx`. This ensures the Signature/Date section placement matches the user's expected 2-page layout.

#### 3. Deploy edge function
Deploy the updated `generate-document` function after changes.

### What is NOT changed
- No UI changes
- No database schema changes
- No other document templates affected
- No tag-parser modifications
- No layout/formatting code changes

