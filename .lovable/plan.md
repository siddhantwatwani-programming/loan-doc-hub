## RE851D – Part 1 Loan-to-Value: strict Remaining vs Expected mapping

### What I found

Data for `DL-2026-0248`:
- `lien1` → property1, `existing_paydown=true`, `anticipated=false`, `current_balance=23,423`, `original_balance` not set
- `lien2` → property2, `anticipated=true`, `original_balance=567`, `current_balance=2,342`, `new_remaining_balance=34`

The authoritative late pass at `supabase/functions/generate-document/index.ts` lines 2722-2881 already implements the spec for `ln_p_remainingEncumbrance_N` / `ln_p_expectedEncumbrance_N` / `ln_p_totalEncumbrance_N`. So the per-property classification logic is correct in principle.

The bug is downstream:
1. The render shows `34` (which equals `lien2.new_remaining_balance`) in Property 2's Remaining column — meaning the template cell isn't reading `ln_p_remainingEncumbrance_2`, it's reading a legacy aggregated alias (e.g. `pr_li_lienCurrenBalanc2` aggregated across all liens, joined by newlines via the multi-lien collector at lines 2284-2360, or a `_N` slot tag under `pr_li_rem_principalBalance_N` published at lines 2572-2680 which routes by `lien.anticipated` only — not by Remain/Paydown vs Payoff).
2. `pr_li_rem_*` / `pr_li_ant_*` slot publishers (lines 2589-2603) split only on `anticipated`, with no exclusion of `Existing - Payoff` and no Paydown/Remain gating. A paydown lien is correctly bucketed as "rem", but a `payoff` lien would still be included.
3. Expected column shows blank for Property 2 even though lien2 has `original_balance=567` — likely because the template uses a per-slot tag (`pr_li_ant_originalAmount_2_1`) which IS published, but the cell may instead be bound to `ln_p_expectedEncumbrance_2` and a competing pass overwrites or fails to set it. The shield list at line 1516 includes `ln_p_expectedEncumbrance` but per-`_N` shielding may zero-out before the late rollup runs.

### Fix (edit `supabase/functions/generate-document/index.ts` only)

**A. Make late rollup the absolute last writer for Part 1 totals**
- Move/duplicate the rollup block (lines 2722-2881) so it runs AFTER the anti-fallback shield (line 1498) and AFTER the per-slot `pr_li_rem_*` / `pr_li_ant_*` publisher (line 2572). Already late, but ensure it always overwrites with `fieldValues.set(...)` for every property index discovered (it does — keep).
- Re-emit additional aliases the template may use: `pr_p_remainingEncumbrance_N`, `pr_p_expectedEncumbrance_N`, `pr_p_totalSenior_N` (already present), and per-slot `pr_li_rem_principalBalance_N_1` / `pr_li_ant_originalAmount_N_1` ONLY when classification matches, else explicit `"0.00"`.

**B. Tighten per-slot bucket split (lines 2589-2603)**
- Replace the simple `anticipated`-only split with the same `classify()` used in the rollup:
  - `payoff` → skip entirely (no row published)
  - `anticipated` → `pr_li_ant` bucket
  - `remain` / `paydown` → `pr_li_rem` bucket
- This guarantees a Payoff lien never appears in either column and Remain/Paydown never leak into Anticipated.

**C. Field selection inside slots (line 2636-2637)**
- For `pr_li_rem_*` rows, `principalBalance` must come ONLY from `current_balance` (drop `new_remaining_balance` fallback that produced the `34` artifact).
- For `pr_li_ant_*` rows, `originalAmount` from `original_balance` only (already correct).

**D. Zero-fill for empty rows**
- After the rollup, for every property index, if no `pr_li_rem_principalBalance_N_*` slot was published, publish `pr_li_rem_principalBalance_N_1 = "0.00"`. Same for `pr_li_ant_originalAmount_N_1`. Prevents blank cells.

**E. Logging**
- Per-property log line: `prop=N cond_routed=[lien1:paydown→rem=23423, lien2:anticipated→exp=567] remaining=X expected=Y total=Z`.

### Out of scope (will not touch)
- Template `.docx`, `field_dictionary`, `template_field_maps`, RLS, UI/CSR forms, schema, addendum logic, encumbrance-of-record passes, other document types.

### Acceptance (DL-2026-0248)
- Property 1: Remaining = `23,423.00`, Expected = `0.00`, Total = `23,423.00`
- Property 2: Remaining = `0.00`, Expected = `567.00`, Total = `567.00`
- No `34.00` anywhere in Part 1 columns
- No blanks; all numeric cells render
- No cross-property bleed; Existing-Payoff liens excluded from both columns
