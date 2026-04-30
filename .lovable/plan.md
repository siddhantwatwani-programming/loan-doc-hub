## RE851D Multi-Property Mapping Fix

### Problem

When CSR has 2+ properties, the RE851D document only populates Property #1's block. Properties 2-5 stay blank for the key fields shown in the template (`pr_p_appraiseValue_N`, `pr_p_address_N`, `ln_p_loanToValueRatio_N`, etc.).

### Root Cause

In `supabase/functions/generate-document/index.ts`, the multi-property indexing pipeline has two field-name mismatches:

1. **`appraised_value` vs `appraise_value`** — The UI form (`PropertyDetailsForm.tsx` via `fieldKeyMap.appraisedValue`) saves the Estimate of Value as `propertyN.appraised_value` (with the `d`). The doc-gen indexer at line 812 looks for `propertyN.appraise_value` / `propertyN.appraiseValue` (no `d`). So `pr_p_appraiseValue_2`, `pr_p_appraiseValue_3` are never published, which also breaks the per-property LTV (`ln_p_loanToValueRatio_N`) and the per-property total-senior-plus-loan calculation.

2. **`prKeyToSuffix` mapping is incomplete** — The bridge map (lines 217-225) used both for converting composite storage keys (`property2::uuid` → `property2.<short>`) and for publishing per-property indexed aliases (lines 789-794) is missing the appraise-value and LTV-related field keys (`pr_p_appraiseValue`, `pr_p_owner`, `pr_p_remainingSenior`, `pr_p_expectedSenior`, `pr_p_totalSenior`, `pr_p_totalSeniorPlusLoan`, `ln_p_loanToValueRatio`). As a result, even when those fields are stored under composite keys, they aren't bridged into the `propertyN.<suffix>` namespace that the per-index publisher reads from.

### Changes (single file)

`supabase/functions/generate-document/index.ts`:

1. **Extend the appraise-value fallback** in the per-index loop (around line 812) to also read `propertyN.appraised_value` (current UI key), in addition to the existing `appraise_value` / `appraiseValue` lookups.

2. **Extend the LTV computation fallback** (around line 838-844) to read `propertyN.appraised_value` as well, so per-property LTV is computed for properties 2-5.

3. **Add missing entries to `prKeyToSuffix`** (around line 217) so composite-stored values bridge correctly into `propertyN.<short>`:
   - `pr_p_appraiseValue` → `appraised_value` (matches UI storage)
   - `pr_p_owner` → `owner`
   - `pr_p_remainingSenior` → `remaining_senior`
   - `pr_p_expectedSenior` → `expected_senior`

4. **Per-property publisher loop (line 789)**: confirm/extend so once the bridge populates `propertyN.appraised_value`, the loop publishes `pr_p_appraiseValue_N` for every property in CSR (1..5, capped at MAX_PROPERTIES = 5).

### Behavior After Fix

- 1 property in CSR → only Property Type 1 block populates; 2-5 blank.
- 2 properties → Property Type 1 and 2 populate; 3-5 blank.
- 3 properties → 1, 2, 3 populate; 4-5 blank.
- 4 properties → 1, 2, 3, 4 populate; 5 blank.
- 5+ properties → 1-5 populate; extras ignored (per existing `MAX_PROPERTIES = 5` cap).

### Out of Scope (not modified)

- No DB schema or table changes.
- No UI changes.
- No template (.docx) changes — only the resolver/indexer in the existing `generate-document` edge function.
- No changes to participant, lien, or lien-totals logic beyond what's already wired.
- All existing single-property behavior (canonical `pr_p_address`, `pr_p_appraiseValue`, `ln_p_loanToValueRatio` without index) preserved.
