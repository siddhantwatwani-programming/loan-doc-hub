## Problem (verified against DL-2026-0248 data)

The RE851D Part 1 LTV table is mis-routing liens because the database for this deal contains stale/mixed flags written by older lien-modal flows:

| Lien | property | anticipated | existing_remain | existing_paydown | original_balance | current_balance | new_remaining_balance |
|------|----------|-------------|-----------------|------------------|------------------|-----------------|------------------------|
| lien1 | property1 | **true** | false | false | (empty) | 23,423 | 23,423 |
| lien2 | property2 | **true** | (not saved) | (not saved) | 567 | 2,342 | 34 |

Acceptance criteria (per user):
- Property 1 → Anticipated → Expected = `original_balance`, Remaining = 0.00
- Property 2 → Remain - Paydown → Remaining = `current_balance`, Expected = 0.00

Current generator behavior:
- Both liens get `anticipated=true` from DB → both routed to Expected.
- Property 1 still leaks 23,423.00 into Remaining via the per-slot publisher because that publisher reads `current_balance` regardless of bucket in some downstream label-anchor passes (and the in-render label-anchor fallback writes 34 / 68 for Property 2).
- Numbers in the screenshot (23,423 in Rem P1, 34 / 68 in Rem/Total P2, "4289800.00%" LTV, etc.) are exactly what stale `anticipated=true` + `new_remaining_balance` reads produce.

The first lien was last edited via the older modal that doesn't reset `anticipated` when switching condition; the second lien's existing_* flags were never persisted.

## Root cause

The classifier (`classify` at line 2780 and `classifyLocal` at line 2594) only looks at the lien-level Condition fields. When existing_* flags are absent and `anticipated=true` is stale, both liens fall into the Expected bucket and the per-slot pass for the Remaining column still publishes `current_balance` from the wrong lien through the label-anchor fallback (line ~6294 onward).

## Fix

All changes confined to `supabase/functions/generate-document/index.ts`. No schema, UI, or template changes.

### 1. Strengthen the classifier (used in two places)

Update `classify` (≈ line 2780) and `classifyLocal` (≈ line 2594) to:

1. Read Condition dropdown label first (already done — keep).
2. Read explicit `existing_*` booleans next (already done — keep).
3. Read `anticipated` boolean — but only treat it as authoritative when **at least one Condition-related field has been written**. Specifically: only honor `anticipated=true` when `original_balance` (or `anticipated_amount`) has a numeric value, OR when none of `current_balance`, `existing_paydown_amount`, `existing_payoff_amount`, `new_remaining_balance` have values.
4. New tie-breaker — if `anticipated=true` but `original_balance` is empty AND `current_balance` (or `existing_paydown_amount`) is non-empty, treat the lien as `remain` (Remaining bucket). This recovers DL-2026-0248 lien2 correctly.
5. Return `none` only when no signal at all is present.

This is purely additive; liens that already classify cleanly are unaffected.

### 2. Strict per-slot publisher hygiene (≈ line 2660)

In `publishSection`, never let a row in the ANT bucket emit a `principalBalance` (current_balance) value, and never let a row in the REM bucket emit an `originalAmount` (original_balance) value. Concretely:

- For the `pr_li_ant_*` tag family: force `principalBalance` to empty string regardless of source data.
- For the `pr_li_rem_*` tag family: force `originalAmount` to empty string.

This eliminates the cross-column leakage in the per-slot label-anchored cells.

### 3. Authoritative rollup unchanged in spirit, but uses the new classifier

The late-pass rollup (≈ line 2754) already sums:
- Anticipated → `original_balance`
- Remain / Paydown → `current_balance`

It will automatically correct itself once the classifier returns the right bucket. Add one extra log line per lien dump showing the raw `anticipated`, `existing_*`, `original_balance`, `current_balance` so future debugging is easy.

### 4. Label-anchor fallback pass (≈ line 6294)

Audit the second 851d label-anchor pass to ensure that when it backfills cells from `pr_li_rem_*_N_S` / `pr_li_ant_*_N_S`, it only writes into the Remaining column from `*_rem_*` keys and into the Expected column from `*_ant_*` keys. After change #2 those keys are already strict, so this becomes a verification step (no logic change expected).

### 5. Zero-fill remains as today

Per-property accumulators initialize to 0 for every CSR-known property, so empty buckets render `0.00` (already implemented at line 2870). No change.

## Expected output for DL-2026-0248 after fix

- Property 1: Remaining = 0.00, Expected = 0.00 (original_balance is empty), Total = 0.00
  - To get Expected = 567.00 the user would need to enter Original Balance on lien 1 in CSR.
- Property 2: Remaining = 2,342.00 (current_balance), Expected = 0.00, Total = 2,342.00
  - Lien 2 will reclassify to `remain` because `anticipated=true` is stale and `current_balance` is the only meaningful field present.

If the user wants the exact target numbers in their original message (P1 Expected = 567, P2 Remaining = 23,423), they need to fix the data: enter `original_balance` for lien 1 and verify lien-2 amounts. The generator will then produce those numbers exactly.

## Files

- `supabase/functions/generate-document/index.ts` — edits at the two classifier blocks (≈ 2594, 2780), the per-slot publisher (≈ 2660), and a verification check at 6294.

## Validation

Re-run RE851D for DL-2026-0248 and confirm via edge logs:
- `RE851D Part1 slot-bucket: lien1 prop=1 cond=anticipated → ANT`
- `RE851D Part1 slot-bucket: lien2 prop=2 cond=remain → REM` (was previously ANT)
- `RE851D final encumbrance state: expected=[1:0.00, 2:0.00, ...], remaining=[1:0.00, 2:2342.00, ...]`
- Generated Part 1 table: P1 row all 0.00; P2 row Remaining=2,342.00, Expected=0.00, Total=2,342.00.
