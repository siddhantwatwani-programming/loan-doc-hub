## Plan

1. Keep the existing field mapping unchanged.
   - The UI already persists `IS BROKER ALSO A BORROWER?` under `origination_app.doc.is_broker_also_borrower_yes`.
   - The legacy alias already exists as `or_p_isBrokerAlsoBorrower_yes`.
   - The RE851A conditional tag should continue to evaluate `or_p_isBrkBorrower`.

2. Apply a minimal fix only in the document generator for RE851A Part 2.
   - Ensure the broker-capacity derivation always normalizes the persisted UI value from:
     - `origination_app.doc.is_broker_also_borrower_yes`
     - `or_p_isBrokerAlsoBorrower_yes`
     - existing fallback keys already in place
   - Publish the normalized result back to:
     - `or_p_isBrkBorrower`
     - `or_p_brkCapacityAgent`
     - `or_p_brkCapacityPrincipal`
   - Treat `null`, `undefined`, empty string, and false-like values as false.

3. Preserve both template patterns without changing layout.
   - Support `{{#if or_p_isBrkBorrower}}...{{else}}...{{/if}}` if the template uses explicit conditional tags.
   - Preserve the existing label-based fallback for native/tagless Word checkboxes if the live RE851A file is using static checkbox content beside text labels instead of merge tags.
   - Keep label text, spacing, and formatting untouched.

4. Verify only the affected Part 2 behavior.
   - Confirm checked UI value produces:
     - `A = ☐`
     - `B = ☑`
   - Confirm unchecked or missing UI value produces:
     - `A = ☑`
     - `B = ☐`
   - Confirm no other RE851A checkbox logic is altered.

## Recommendation

No database change is needed.
No UI change is needed.
No field-dictionary remap is likely needed.

The most likely fix is in the RE851A document-generation derivation layer, not in the saved field mapping itself.

## Technical details

Observed code paths already indicate the intended source is the UI key:
- UI field: `origination_app.doc.is_broker_also_borrower_yes`
- Legacy alias: `or_p_isBrokerAlsoBorrower_yes`
- Template boolean target: `or_p_isBrkBorrower`

So the minimal implementation should focus on making the generator use that persisted value as the single source of truth and ensuring the live Part 2 checkbox replacement path matches the actual RE851A template wording.