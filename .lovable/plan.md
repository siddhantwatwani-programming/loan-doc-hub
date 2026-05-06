
## Problem

The RE851D questionnaire (per-property Encumbrance & Delinquency) currently maps liens to per-property `pr_li_*_N` aliases, but **Q1 (Encumbrances of Record)** uses the wrong rule. The spec says: *"If Paid Off is checked → YES"* — i.e. mark YES when any lien on the property is flagged Paid Off. The current code requires **all** liens to be paid off (`b.allPaidOff`), so YES is almost never published.

All other questions (Q2–Q6) already match the spec:
- Q2: 60-day delinquencies > 0 → YES (`pr_li_delinqu60day_N`)
- Q3: count value (`pr_li_delinquHowMany_N`)
- Q4: remaining balance > 0 → YES (`pr_li_currentDelinqu_N`)
- Q5: paid-by-loan checkbox → YES (`pr_li_delinquencyPaidByLoan_N`)
- Q6: source-of-payment text (`pr_li_sourceOfPayment_N`)

The post-render safety pass (~line 5359) anchors on each "PROPERTY INFORMATION" header, so once Q1's boolean is correct, the YES/NO glyphs in the right column will check correctly per property without any cross-property leak.

## Fix (single file: `supabase/functions/generate-document/index.ts`)

1. **`perProp` bucket type (~line 2482)**: add `anyPaidOff: boolean` alongside `allPaidOff`.
2. **Initializer (~line 2562)**: initialize `anyPaidOff: false`.
3. **Aggregation loop (~line 2566)**: `if (paidOff) b.anyPaidOff = true;` (keep `allPaidOff` for backward-compat, but stop using it for Q1).
4. **Per-property publisher (~line 2605)**: change `const encOfRecord = b.hasLien && b.allPaidOff;` → `const encOfRecord = b.hasLien && b.anyPaidOff;`.
5. **Bare aliases (~line 2620 block)**: same swap when publishing the un-suffixed `pr_li_encumbranceOfRecord` for property #1.
6. **Diagnostic log line (~line 2527)**: include `anyPaidOff` so future runs surface the per-property aggregate in edge function logs.

No schema, no UI, no template, no other publisher touched. Q2–Q6 logic and the post-render checkbox safety pass remain unchanged.

## Acceptance

- For a property whose lien has Paid Off ticked, RE851D shows ☒ YES / ☐ NO for "Are there any encumbrances of record?".
- For a property with liens but none paid off, ☐ YES / ☒ NO.
- Per-property isolation preserved: aggregation buckets are keyed by `propertyN` derived from `lienK.property`; no cross-property bleed.
- Q2–Q6 unaffected.

## Files Modified

```text
supabase/functions/generate-document/index.ts   (Q1 aggregation: anyPaidOff)
```
