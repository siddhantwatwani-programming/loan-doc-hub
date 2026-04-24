1. Update the RE851A broker-capacity derivation in `supabase/functions/generate-document/index.ts` to read the same persisted field the UI actually saves: `origination_app.doc.is_broker_also_borrower_yes` / `or_p_isBrokerAlsoBorrower_yes`, while preserving the existing fallback keys already in place.

2. Keep the current minimal boolean derivation pattern already used elsewhere in RE851A:
   - `or_p_brkCapacityAgent = true` when broker-borrower is false/null
   - `or_p_brkCapacityPrincipal = true` when broker-borrower is true
   This preserves layout because only checkbox state changes.

3. Harden the label-based fallback for Part 2 native/static checkboxes so it matches the live RE851A wording shown in the screenshots, including the shorter live label text for B (`B. Principal as a borrower`) in addition to the longer existing variant.

4. Leave everything else untouched:
   - no schema changes
   - no UI changes
   - no template layout changes
   - no pipeline refactor
   - no unrelated field mapping changes

5. Verify the fix by checking generation logs for the derived broker-capacity keys and confirming the output behavior:
   - checked UI field -> B checked, A unchecked
   - unchecked/null UI field -> A checked, B unchecked

Technical details
- Likely root cause 1: current derivation is reading `or_p_isBrkBorrower` / `origination.is_broker_also_a_borrower`, but the UI persists `origination_app.doc.is_broker_also_borrower_yes` (legacy alias `or_p_isBrokerAlsoBorrower_yes`).
- Likely root cause 2: the injected label fallback currently targets only the long B label, while the live template appears to contain the shorter wording, so tagless/native checkbox matching can miss that checkbox.
- Files to update: `supabase/functions/generate-document/index.ts` only, unless a tiny follow-up adjustment is needed after verification.