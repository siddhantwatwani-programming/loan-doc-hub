

## Fix: `{{br_p_fullName}}` not populating in document generation

### Root Cause

Two issues:

1. **Edge function not redeployed**: The auto-compute bridging code for `br_p_fullName` was added to `supabase/functions/generate-document/index.ts` (lines 301-329) in the previous change, but the deployed edge function does not contain this code. The logs show `Auto-computed Broker.Name` but no `Auto-computed br_p_fullName` log entry, confirming the deployment didn't take effect.

2. **No borrower data exists for this deal**: The deal (`e78b793b-...`) only has `loan_terms` and `broker` sections in `deal_section_values`. There is no `borrower` section at all. Even with the auto-compute code deployed, it has no source data (`borrower1.first_name`, `br_p_firstName`, etc.) to compute from.

### Fix

**Redeploy the edge function** — the code changes from the previous message (auto-compute `br_p_fullName` from borrower name components) are already correct in the source. The function just needs to be redeployed so the changes take effect.

No code changes are needed — only a redeployment of `generate-document`.

### Important Note

After redeployment, `{{br_p_fullName}}` will still be empty for this specific deal because no borrower data has been entered. The user needs to enter borrower data (first name, last name, etc.) in the deal's Borrower section before the placeholder can populate. Once borrower data exists, the auto-compute code will correctly assemble and populate `br_p_fullName`.

