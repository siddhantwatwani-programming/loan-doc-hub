## RE851D – Authoritative Per-Property Encumbrance Calculation

The bulk of the per-property lien rollup already exists in `supabase/functions/generate-document/index.ts` (lines ~1404–1585): it scans `lienK.*`, matches by `lien.property` against the property prefix/address, excludes `Existing - Payoff`, sums `original_balance` for `Anticipated`, sums `current_balance` for `Will Remain` / `Remain - Paydown`, and defaults blanks to `0.00`.

Two gaps remain that can cause failing test cases when both Lien data and stale property-level fields coexist:

### Issue 1 — Static property fields can shadow lien-derived values
Lines 1513–1531 only publish `pr_p_expectedSenior_${idx}` / `pr_p_remainingSenior_${idx}` when `${prefix}.expected_senior` / `${prefix}.remaining_senior` are empty. If a deal has any stale value on those property keys, it overrides the freshly computed Lien rollup.

### Issue 2 — Total uses static property values first
Lines 1540–1555 read `${prefix}.remaining_senior` and `${prefix}.expected_senior` first and only fall back to the lien sums when those parse to NaN. Per the spec, **Total = (lien-derived Remaining) + (lien-derived Expected)**.

### Changes (single file, narrow edit)

**`supabase/functions/generate-document/index.ts`** — replace lines ~1504–1584:

1. Always publish from the Lien rollup (no static-value gating):
   - `ln_p_expectedEncumbrance_${idx}` = `lienExpectedSum.toFixed(2)` (0.00 when no eligible lien)
   - `ln_p_remainingEncumbrance_${idx}` = `lienRemainingSum.toFixed(2)` (0.00 when no eligible lien)
   - `pr_p_expectedSenior_${idx}` and `pr_p_remainingSenior_${idx}` set unconditionally to the same values
2. Total block: drop the `${prefix}.remaining_senior` / `${prefix}.expected_senior` reads. Compute:
   - `total = lienRemainingSum + lienExpectedSum`
   - Set `pr_p_totalEncumbrance_${idx}` and `ln_p_totalEncumbrance_${idx}` unconditionally to `total.toFixed(2)`
   - Recompute `ln_p_totalWithLoan_${idx} = total + loan_amount` (loan_amount NaN → 0)
3. Keep payoff exclusion, per-property strict matching, indexed-lien dedup, and debug log line as-is.

### Behavioral matrix (covers all test cases)

| Scenario | Remaining | Expected | Total |
|---|---|---|---|
| Will Remain / Remain-Paydown only (CB=23423) | 23423 | 0 | 23423 |
| Anticipated only (OB=50000) | 0 | 50000 | 50000 |
| Mix (CB=20000 Will Remain + OB=30000 Anticipated) | 20000 | 30000 | 50000 |
| Existing - Payoff only | 0 | 0 | 0 |
| No liens for property | 0 | 0 | 0 |

### Out of scope
- No template/dictionary changes. Existing `{{ln_p_remainingEncumbrance_N}}`, `{{ln_p_expectedEncumbrance_N}}`, `{{ln_p_totalEncumbrance_N}}` placeholders already resolve.
- No UI / schema / other document changes.
