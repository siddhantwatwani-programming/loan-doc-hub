I did a deep read-only analysis of the current RE851D generation path and the saved deal data for DL-2026-0248.

Key finding: the document-generation code already has a partial late-pass rollup, but the condition resolution and saved data interpretation are still not strict enough. In the current saved data, the condition flags can be stale/inconsistent (for example `anticipated=true` can remain even when the UI intended a remaining/paydown state), so the generator can still route a lien into the wrong bucket. Also, several related RE851D paths still classify by a broad `anticipated` truthy check instead of the exact Condition business rules.

Plan:

1. Add one RE851D-only canonical lien classifier in `supabase/functions/generate-document/index.ts`
   - Scope it only to RE851D generation.
   - Read the effective condition in strict priority order:
     1. Explicit `condition` dropdown value if present.
     2. Mutually-exclusive boolean flags, with payoff excluded, then remain/paydown, then anticipated.
     3. If legacy data has conflicting flags, prefer the specific existing-remain/paydown/payoff flags over a stale `anticipated=true` flag.
   - Normalize these values:
     - `Anticipated` => expected bucket.
     - `Will Remain`, `Existing - Remain` => remaining bucket.
     - `Remain - Paydown`, `Existing - Paydown` => remaining bucket.
     - `Existing - Payoff` => excluded.
     - unknown/blank => excluded.

2. Replace the two local RE851D classifiers with this single classifier
   - Update the per-slot `pr_li_rem_*` / `pr_li_ant_*` publisher.
   - Update the authoritative Part 1 / Part 2 rollup.
   - This prevents the same lien from appearing in both Remaining and Expected and avoids drift between row-level and total-level logic.

3. Enforce strict source fields for totals
   - Remaining column: sum only `current_balance` / `currentBalance` for remain/paydown liens.
   - Expected column: sum only `original_balance` / `originalBalance` for anticipated liens.
   - Do not use `new_remaining_balance`, `anticipated_amount`, `existing_payoff_amount`, or `anticipated balance` fields for these Part 1 totals.
   - Total column: Remaining + Expected.

4. Enforce property-level isolation
   - Resolve lien property only to its own `propertyN` match, with existing address fallback retained only where it maps unambiguously to one property.
   - Do not allow unassigned or unmatched liens to fall into any property bucket.
   - Keep the current no-cross-bleed behavior.

5. Publish zeroes for all known RE851D property rows
   - For every property present in CSR, publish:
     - `ln_p_remainingEncumbrance_N = 0.00` when no remaining lien qualifies.
     - `ln_p_expectedEncumbrance_N = 0.00` when no anticipated lien qualifies.
     - `ln_p_totalEncumbrance_N = 0.00` when no lien qualifies.
   - Also keep existing compatibility aliases such as `pr_p_remainingSenior_N`, `pr_p_expectedSenior_N`, `pr_p_totalSenior_N`, etc.

6. Keep existing UI, schema, flow, styling, and unrelated mappings unchanged
   - No database schema changes.
   - No UI layout changes.
   - No template upload/generation flow changes.
   - No changes to unrelated document sections or unrelated checkbox logic.

7. Add targeted logging for validation
   - Log each lien as: lien number, resolved property, raw condition flags, final bucket, amount source, amount used.
   - Log final per-property Remaining / Expected / Total.
   - This will make DL-2026-0248 easy to validate from function logs after regeneration.

Expected result for the case you described:

```text
Property 1: Condition Anticipated
Remaining = 0.00
Expected  = 567.00
Total     = 567.00

Property 2: Condition Remain - Paydown
Remaining = 23423.00
Expected  = 0.00
Total     = 23423.00
```

After approval, I will implement only the RE851D document-generation changes above in `supabase/functions/generate-document/index.ts`.