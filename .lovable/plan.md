I found two concrete issues in the current RE851D path for deal DL-2026-0235:

1. The generated document was still using an earlier rollup path before the later authoritative pass was taking effect in the logs/output.
2. The persisted lien values are stored under indexed lien keys, but the dictionary field keys for lien current/original balances are inconsistent with the current code’s aliases:
   - `lienN.original_balance` is saved through `pr_li_lienOriginBalanc2`
   - `lienN.current_balance` is saved through `pr_li_lienCurrenBalanc2`
   - the existing bridge only maps some older/non-numbered variants and can leave the RE851D rollup using stale or blank values in some paths.

Plan:

1. Keep the existing document generation flow and database schema unchanged.

2. Update only `supabase/functions/generate-document/index.ts`.

3. Add a small RE851D-only helper that reads lien fields robustly from all existing saved aliases for each lien prefix:
   - current balance: `lienN.current_balance`, `lienN.currentBalance`, `pr_li_lienCurrenBalanc2`, and existing compatible variants where applicable
   - original balance: `lienN.original_balance`, `lienN.originalBalance`, `pr_li_lienOriginBalanc2`, and existing compatible variants where applicable
   - condition: explicit `condition` if present, otherwise the existing persisted booleans `anticipated`, `existing_remain`, `existing_paydown`, `existing_payoff`

4. Make the late authoritative RE851D Part 1/Part 2 rollup the single source of truth for:
   - `ln_p_remainingEncumbrance_N`
   - `ln_p_expectedEncumbrance_N`
   - `ln_p_totalEncumbrance_N`
   - compatibility aliases `pr_p_remainingSenior_N`, `pr_p_expectedSenior_N`, `pr_p_totalEncumbrance_N`, `pr_p_totalSenior_N`
   - `ln_p_totalWithLoan_N` / `pr_p_totalSeniorPlusLoan_N`

5. Enforce the mandatory mapping exactly:
   - `Anticipated` -> Expected = sum of Original Balance
   - `Will Remain` and `Remain - Paydown` -> Remaining = sum of Current Balance
   - `Existing - Payoff` -> excluded from Remaining, Expected, and Total
   - no qualifying lien -> publish `0.00`, never blank

6. Ensure property isolation remains strict:
   - only include liens whose `lienN.property` resolves to that same `propertyN`
   - no fallback from property 1 to other properties
   - address matching remains only as a compatibility fallback when a lien stores the address instead of `propertyN`

7. Move or repeat the final encumbrance-state diagnostic log after the authoritative pass, so the logs prove the exact values that the document processor receives.

8. Add focused test coverage in the existing document-generation test area if feasible without changing the schema or UI:
   - only remaining
   - only expected
   - mixed remaining + expected
   - payoff excluded
   - blank values become zero
   - multi-property isolation

9. Validate by generating/checking RE851D for DL-2026-0235 and confirming the Part 1 table and Part 2 property blocks show the same correct per-property values.