## Goal

In the **RE851A** generated document, populate a new merge tag `{{ln_p_loanAmountDivByEstimateValue}}` with the value of **Loan Amount ÷ Estimate of Value**, computed in the document data preparation layer with no template, schema, or UI changes.

## Approach

The doc-generation backend already auto-computes `ln_p_loanToValueRatio` from the same two source fields (`ln_p_loanAmount` and `pr_p_appraiseValue`) at `supabase/functions/generate-document/index.ts:735-749`. We will mirror that pattern for the new key, immediately after the existing LTV block, so behavior, fallbacks, and divide-by-zero handling stay identical and proven.

## Changes

### 1. `supabase/functions/generate-document/index.ts` — single insertion (~10 lines)

Right after the `ln_p_loanToValueRatio` auto-compute block (after line 749), add:

- Read `ln_p_loanAmount` (fallback `loan_terms.loan_amount`).
- Read `pr_p_appraiseValue` (fallback `property1.appraise_value`).
- Parse both as numbers, stripping non-numeric characters (same sanitizer as LTV).
- If either is missing/NaN **or** the divisor is `0`, do nothing → tag renders blank (existing engine behavior for unset keys).
- Otherwise compute `loanAmount / estimateValue` and publish it under the new key in two formats so whichever the template needs renders correctly:
  - `ln_p_loanAmountDivByEstimateValue` → raw decimal ratio rounded to 4 places (e.g. `"0.7500"`)
  - `ln_p_loanAmountDivByEstimateValue_pct` → percentage rounded to 2 places (e.g. `"75.00"`) — provided as a safety alias only; not required for the requirement.
- Skip if the key already has a value (so any future explicit override wins, matching the LTV pattern).
- Add a `debugLog(...)` line consistent with surrounding code.

That single insertion satisfies the entire requirement.

### 2. No other changes

- No template edits — the template author will place `{{ln_p_loanAmountDivByEstimateValue}}` where needed (as stated in the requirement).
- No `merge_tag_aliases` row needed — the field is published directly under its canonical key. (Optional follow-up if the template uses a different tag name; not required now.)
- No schema, RLS, UI, field_dictionary, or migration changes.
- No impact to existing `ln_p_loanToValueRatio`, `ln_p_loanAmount`, `pr_p_appraiseValue`, or any other RE851A mapping.

## Behavior guarantees

| Scenario | Result in document |
|---|---|
| Both values present, Estimate > 0 | Computed ratio renders (e.g. `0.7500`) |
| Estimate of Value = 0 | Tag renders blank (no divide-by-zero) |
| Estimate of Value missing/null | Tag renders blank |
| Loan Amount missing/null | Tag renders blank |
| Either value non-numeric | Tag renders blank |
| Key already explicitly set elsewhere | Existing value preserved |

## Acceptance check

After deploy, regenerating RE851A on a deal with Loan Amount = `$300,000` and Estimate of Value = `$400,000` should produce `0.7500` at the `{{ln_p_loanAmountDivByEstimateValue}}` location, document layout untouched, all other tags unaffected.