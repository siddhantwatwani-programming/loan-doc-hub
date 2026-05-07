Root cause confirmed for deal DL-2026-0235:

- Current persisted lien data is correct:
  - Property 1 / Lien 1: Remain-Paydown, Current Balance 324 -> Remaining 324
  - Property 2 / Lien 2: Remain-Paydown, Current Balance 23,423 -> Remaining 23,423
  - Property 2 / Lien 4: Anticipated, Original Balance 48,234 -> Expected 48,234
  - Property 3 / Lien 3: Anticipated, Original Balance 54,567 -> Expected 54,567
  - Property 4 / Lien 5: Existing-Payoff -> excluded
- The screenshot/logs show the generated document still uses the old early rollup:
  - Property 2 Remaining is 22,780 instead of 23,423.
  - Expected values are blank.
- The code already has a correct late authoritative pass, but it runs inside the lien-bridging block before a later generic bridge/aggregation step. That later step can overwrite keys like `pr_p_totalSenior_*` / related aliases with older current-balance-only logic. Also the existing “final encumbrance state” log is currently placed before the late pass, so it is not actually proving what the template receives.

Implementation plan:

1. Remove or neutralize the early RE851D encumbrance publisher
   - Stop the early per-property block from publishing `ln_p_expectedEncumbrance_N`, `ln_p_remainingEncumbrance_N`, `pr_p_expectedSenior_N`, `pr_p_remainingSenior_N`, `ln_p_totalEncumbrance_N`, and `pr_p_totalEncumbrance_N`.
   - Keep unrelated RE851D per-property alias logic intact.
   - This avoids stale values being published before all lien fields are fully bridged.

2. Move the authoritative RE851D Part 1 rollup to the true final point before template processing
   - Run it after all lien bridging and generic auto-computations, immediately before `processDocx`/tag replacement.
   - Make it the last writer for all Part 1 encumbrance aliases:
     - `ln_p_remainingEncumbrance_N`
     - `ln_p_expectedEncumbrance_N`
     - `ln_p_totalEncumbrance_N`
     - `pr_p_remainingSenior_N`
     - `pr_p_expectedSenior_N`
     - `pr_p_totalEncumbrance_N`
     - `pr_p_totalSenior_N`
     - `pr_p_totalSeniorPlusLoan_N`
     - `ln_p_totalWithLoan_N`

3. Tighten the rollup source logic
   - Discover all `lienN.*` records once.
   - Match lien to property strictly by `lienN.property = propertyN`, with existing address fallback only for legacy values.
   - Classify condition from the current dropdown-backed booleans and any explicit label:
     - Anticipated -> Expected bucket
     - Will Remain -> Remaining bucket
     - Remain-Paydown -> Remaining bucket
     - Existing-Payoff -> excluded entirely
   - Use the required source balances:
     - Remaining = `current_balance`
     - Expected = `original_balance`
     - Total = Remaining + Expected
   - Treat blanks/non-numeric values as `0.00`.

4. Fix the debug proof point
   - Move the `RE851D final encumbrance state` log so it runs after the true final rollup.
   - Log remaining, expected, and total for properties 1–5.
   - This will make future generation logs directly confirm the exact values the template receives.

5. Validate after implementation
   - Deploy/test the `generate-document` function.
   - Generate or invoke RE851D for deal `DL-2026-0235`.
   - Confirm logs show:
     - P1: Remaining 324.00, Expected 0.00, Total 324.00
     - P2: Remaining 23423.00, Expected 48234.00, Total 71657.00
     - P3: Remaining 0.00, Expected 54567.00, Total 54567.00
     - P4: Remaining 0.00, Expected 0.00, Total 0.00
   - Check that no other document flows are touched.