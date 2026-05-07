## RE851D – Per-Property Encumbrance Mapping Fix

Update the per-property lien rollup in `supabase/functions/generate-document/index.ts` (lines ~1404–1517) so the Part 1 LTV table values follow the new Condition-based rules.

### Current behavior (incorrect)
- **Expected** = sum of `lienK.anticipated_amount` for liens where `anticipated == true`
- **Remaining** = sum of `lienK.new_remaining_balance` for ALL matched liens (including payoffs)
- Doesn't read the `existingRemain / existingPaydown / existingPayoff` flags persisted by the Condition dropdown.

### New behavior (per spec)
For each property index `idx`, walk the property-matched liens and classify by Condition flags persisted from `LienDetailForm` (`anticipated`, `existingRemain`, `existingPaydown`, `existingPayoff`):

| Condition (UI)        | Persisted flag(s) true   | Bucket                | Field summed                |
|-----------------------|--------------------------|-----------------------|-----------------------------|
| Anticipated           | `anticipated`            | Expected Senior       | `original_balance`          |
| Will Remain           | `existingRemain`         | Remaining Senior      | `current_balance`           |
| Remain - Paydown      | `existingPaydown`        | Remaining Senior      | `current_balance`           |
| Existing - Payoff     | `existingPayoff`         | EXCLUDED              | —                           |

Total Senior Encumbrance = Remaining + Expected (already wired downstream).

### Code changes (single file: `supabase/functions/generate-document/index.ts`)

1. **Lines ~1460–1482**: Replace the `isAnticipated → anticipated_amount` / unconditional `new_remaining_balance` block with:
   - Read `${base}.anticipated`, `${base}.existingRemain`, `${base}.existingPaydown`, `${base}.existingPayoff` (lowercase truthy: `true/yes/y/1`).
   - If `existingPayoff` → `continue` (skip entirely).
   - If `anticipated` → parse `${base}.original_balance`, add to `lienExpectedSum`, set `lienExpectedHit`.
   - If `existingRemain` OR `existingPaydown` → parse `${base}.current_balance`, add to `lienRemainingSum`, set `lienRemainingHit`.
   - A lien with no condition flag set contributes nothing (no silent fallback).

2. **Logging (lines ~1485–1492)**: Extend the existing `RE851D lien rollup` line to include per-lien classification (`liens=[1:exp,2:rem,3:skip-payoff]`) so production logs show the bucket each lien fell into. No new log call — just enrich the existing one.

3. **Lines ~1493–1516** (publish to `ln_p_expectedEncumbrance_${idx}` / `ln_p_remainingEncumbrance_${idx}` and legacy `pr_p_expectedSenior_${idx}` / `pr_p_remainingSenior_${idx}`): unchanged. The downstream Total computation (~1519–1548) and `ln_p_totalEncumbrance_${idx}` / `ln_p_totalWithLoan_${idx}` publishers stay as-is — they already consume the two sums.

4. **Property-level isolation**: untouched. The existing `lienK.property` matching (norm address / `propertyN` prefix) at lines ~1447–1458 already enforces strict per-property filtering.

### Out of scope (not modified)
- Template tags (`{{ln_p_remainingEncumbrance_N}}`, `{{ln_p_expectedEncumbrance_N}}`, `{{ln_p_totalEncumbrance_N}}`) — keys unchanged.
- All other safety passes / Part 2 / questionnaire / balloon / multi-property logic.
- UI, schema, RLS, dictionary, other documents.
- The canonical-lien dedupe (`hasIndexedLien` block) stays intact.

### Acceptance verification
After deploy, generate RE851D for a deal with mixed conditions and confirm:
- Per-property Remaining = Σ `current_balance` of `Will Remain` + `Remain - Paydown` liens on that property.
- Per-property Expected = Σ `original_balance` of `Anticipated` liens on that property.
- `Existing - Payoff` liens never contribute.
- Total column = Remaining + Expected per row, independent across N properties.
- Log line `RE851D lien rollup propertyN: liens=[…]` shows correct bucket per lien.
