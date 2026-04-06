

## Plan: Fix Template Placeholder Population for Re851a

### Problem Analysis

Five placeholders in the Re851a template are blank during document generation despite having values in the UI. Each has a distinct root cause:

1. **`ln_p_loanToValueRatio`** — This is a *calculated* field (`is_calculated = true`). The document generation engine does NOT evaluate calculated fields — it only reads stored values from `deal_section_values`. The UI computes it on the fly but never persists the calculated result.

2. **`bk_p_cellPhone`** — The broker participant injection (generate-document/index.ts) sets `bk_p_phone` but never sets `bk_p_cellPhone`. The broker's cell phone from contact_data (`phone.cell`) is consumed into the generic `bk_p_phone` key, leaving `bk_p_cellPhone` empty.

3. **`ln_p_months`** — This field exists in the `field_dictionary` but has NO entry in `legacyKeyMap.ts` and NO corresponding UI field key in `fieldKeyMap.ts`. Without a legacy mapping, data saved via the UI (which uses dot-notation keys) cannot be resolved to this db key during generation.

4. **`ld_fd_fundingAmount`** — This field exists in the `field_dictionary` (section: lender, form: funding) but the Lender Funding Form is a "Coming Soon" placeholder. There is no UI form to enter this value, no fieldKeyMap entry, and no legacyKeyMap entry. Since there's no UI to persist data, it will always be blank.

5. **`br_p_address`** — In `legacyKeyMap.ts`, `borrower.address.street` maps to `br_p_address`. However, the participant-based contact injection sets `br_p_street` (not `br_p_address`) for the street. So if the value comes from participant contact data (rather than direct deal_section_values entry), `br_p_address` stays empty.

### Proposed Fix (5 changes in the Edge Function)

All fixes go in **`supabase/functions/generate-document/index.ts`** — the document generation engine. No UI, schema, or template changes needed.

**Step 1: Inject `ln_p_loanToValueRatio` as a computed value during generation**
After the existing auto-compute blocks (around line 690), add logic to compute LTV from `ln_p_loanAmount` and `pr_p_appraiseValue` (matching the formula in field_dictionary) and set `ln_p_loanToValueRatio` if not already present.

**Step 2: Inject `bk_p_cellPhone` from broker contact data**
In the broker injection block (around line 490-567), add a line to extract `cd["phone.cell"]` specifically and `forceSet("bk_p_cellPhone", cellPhone)`.

**Step 3: Add `ln_p_months` mapping in `legacyKeyMap.ts`**
Add a legacy key entry so that if a UI field stores months under a dot-notation key, it resolves correctly. Also add a fieldKeyMap entry so the UI can populate this field. The most logical mapping: `'loan_terms.months': 'ln_p_months'`.

**Step 4: Handle `ld_fd_fundingAmount` via lender participant injection**
Since the Lender Funding Form is "Coming Soon" and no UI exists, add injection logic in the lender participant block to compute/bridge this from existing lender funding data in deal_section_values, or at minimum ensure the field_dictionary entry can be resolved during generation.

**Step 5: Fix `br_p_address` borrower injection**
In the borrower injection's short-prefix block, ensure `br_p_address` is set from `cd["address.street"]` (matching the legacy mapping where `br_p_address` = street address).

### Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/generate-document/index.ts` | Add auto-compute for LTV ratio; inject `bk_p_cellPhone`; fix `br_p_address` borrower injection |
| `src/lib/legacyKeyMap.ts` | Add `'loan_terms.months': 'ln_p_months'` mapping |
| `src/lib/fieldKeyMap.ts` | Add `months` entry to `LOAN_TERMS_DETAILS_KEYS` |

### Note on `ld_fd_fundingAmount`

This field's UI (Lender Funding Form) is a "Coming Soon" stub. Without a data entry form, there is no source data to populate this field. The fix will attempt to bridge from any existing lender funding records in deal_section_values. If no data exists, the placeholder will remain blank until the Lender Funding UI is built. I will inject it from `deal_section_values` if the field_dictionary_id resolves, which it should if the CSR entered data via another path.

