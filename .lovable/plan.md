I found why the test cases are still not populating correctly.

The previous rollup logic was added inside the RE851D multi-property publisher, but it runs before the later Lien-section bridge has finished exposing all lien fields into `fieldValues`. In the live logs, RE851D still sees blank values for Property 2–5 at the final encumbrance state:

```text
expected=[1:40000.00, 2:'', 3:'', 4:'', 5:'']
remaining=[1:5000.00, 2:'', 3:'', 4:'', 5:'']
```

I also inspected the current deal data directly. The lien data exists under the `liens` section with indexed keys like:

```text
lien1.current_balance = 324
lien1.existing_paydown = true
lien1.property = property1
lien2.current_balance = 23423
lien2.existing_paydown = true
lien2.property = property2
lien3.anticipated = true
lien3.original_balance = 54567
lien3.property = property3
lien4.anticipated = true
lien4.original_balance = 48234
lien4.property = property2
lien5.existing_payoff = true
lien5.property = property4
```

So the data is present, but the RE851D Part 1 values are computed too early and then blanked for indices that were not populated at that point.

Plan:

1. Move/add the authoritative RE851D senior-encumbrance rollup to after the existing lien bridging block, where all `lienN.*` keys are available.

2. Keep the scope limited to `supabase/functions/generate-document/index.ts` only. No schema changes, no new tables, no API changes, no UI changes, and no template/document-flow rewrite.

3. Implement a single reusable condition resolver for RE851D lien classification:
   - `Existing - Payoff` / `existing_payoff=true` → exclude completely.
   - `Anticipated` / `anticipated=true` → Expected Senior Encumbrance using `original_balance`.
   - `Will Remain`, `Existing`, `existing_remain=true` → Remaining Senior Encumbrance using `current_balance`.
   - `Remain - Paydown`, `existing_paydown=true` → Remaining Senior Encumbrance using `current_balance`.
   - Blank/non-matching condition → exclude from this rollup.

4. Aggregate strictly per property:
   - Match `lienN.property` only to the current `propertyN` or the matching property address.
   - Never fall back from Property 2/3/4/5 to Property 1.
   - Preserve N-property support up to the existing RE851D max of 5 rows.

5. Always publish zero values for every actual RE851D property row:
   - `ln_p_remainingEncumbrance_N`
   - `ln_p_expectedEncumbrance_N`
   - `ln_p_totalEncumbrance_N`
   - compatibility aliases already used by the template (`pr_p_remainingSenior_N`, `pr_p_expectedSenior_N`, `pr_p_totalEncumbrance_N`, `pr_p_totalSenior_N`, `pr_p_totalSeniorPlusLoan_N` where applicable)

6. Ensure output uses real numeric zero instead of blank:
   - Remaining = `0.00` when no eligible remaining liens exist.
   - Expected = `0.00` when no anticipated liens exist.
   - Total = Remaining + Expected, always published.

7. Update the RE851D final diagnostic log so it includes remaining, expected, and total after the corrected late rollup. This will make it possible to verify the acceptance cases immediately from function logs after generation.

Expected result for the current deal data after this fix:

```text
Property 1: remaining=324.00, expected=0.00, total=324.00
Property 2: remaining=23423.00, expected=48234.00, total=71657.00
Property 3: remaining=0.00, expected=54567.00, total=54567.00
Property 4: remaining=0.00, expected=0.00, total=0.00
```

This directly addresses the failing cases: remaining-only, expected-only, mixed, payoff-excluded, zero handling, and no cross-property leakage.