I’ll make a targeted fix only in the RE851D document-generation rollup logic. No UI changes, API changes, schema changes, or template-flow refactors.

Plan:

1. Update the RE851D Part 1 lien rollup in `supabase/functions/generate-document/index.ts`
   - Replace the current direct boolean-only checks for lien condition fields with a small resolver that understands the current Condition dropdown values and the existing saved boolean aliases.
   - The resolver will normalize values such as hyphen/en-dash variants and casing, then classify each lien as:
     - `remain` for `Will Remain`
     - `paydown` for `Remain - Paydown`
     - `anticipated` for `Anticipated`
     - `payoff` for `Existing - Payoff`
     - `none` for unset/unknown
   - Payoff will always win/exclude the lien if conflicting stale flags are present.

2. Apply the required per-property aggregation rules
   - Keep the existing strict lien-to-property matching logic: only liens whose `Related Property` matches the current property index/address are included.
   - For each property:
     - `Will Remain` and `Remain - Paydown` sum `current_balance` into Remaining Senior Encumbrances.
     - `Anticipated` sums `original_balance` into Expected Senior Encumbrances.
     - `Existing - Payoff` is excluded completely.
   - Blank/null/non-numeric balances will be treated as `0` in the sum.

3. Guarantee zero output for actual property rows
   - Publish `0.00` for:
     - `ln_p_remainingEncumbrance_N`
     - `ln_p_expectedEncumbrance_N`
     - `pr_p_remainingSenior_N`
     - `pr_p_expectedSenior_N`
     - `pr_p_totalEncumbrance_N`
     - `ln_p_totalEncumbrance_N`
   - This ensures actual property rows render `0`/`0.00` instead of blank when no qualifying liens exist.
   - Existing non-property blank-row behavior will not be changed.

4. Preserve existing RE851D flow and diagnostics
   - Leave template rewriting, checkbox safety passes, property publishers, and other documents untouched.
   - Update the existing RE851D log line to include enough condition/bucket detail to verify the four test cases without changing runtime behavior.

Validation checklist after implementation:

```text
Test 1: Will Remain + Current Balance 23423
Remaining = 23423.00, Expected = 0.00, Total = 23423.00

Test 2: Anticipated + Original Balance 50000
Remaining = 0.00, Expected = 50000.00, Total = 50000.00

Test 3: Will Remain 20000 + Anticipated 30000 on same property
Remaining = 20000.00, Expected = 30000.00, Total = 50000.00

Test 4: Existing - Payoff
Remaining = 0.00, Expected = 0.00, Total = 0.00
```

I’ll also verify from the code path that Property #1/#2/#3 each use only their own matching liens and do not fall back to Property #1 values.