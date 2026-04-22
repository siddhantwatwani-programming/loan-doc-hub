

## Rename "Amount" → "Original Funding" in Add Funding modal

### Scope

In `src/components/deal/AddFundingModal.tsx`, the top funding form has a label **Amount** (line 800) bound to the `fundingAmount` field. This is the field the request targets ("Funding → Add Funding → Rename Amount").

### Change

Single label-text edit:

- **Line 800** — change the `<Label>` text from `Amount` to `Original Funding`.
- Bump the label `min-w-` from `min-w-[75px]` to `min-w-[110px]` so the longer text fits on one line without wrapping or pushing the input. No other layout changes.

### What stays exactly the same

- Field key (`fundingAmount`), state, validation, calculations (Percent Owned, Regular Payment), persistence, and all dependent logic remain unchanged.
- The disbursements sub-grid "Amount" column (line 973 / 1026) is a different concept (per-disbursement row amount) and is **not** renamed.
- No changes to APIs, schema, document templates, exports, permissions, or any other module.

### Acceptance verification

- The Add Funding modal shows **Original Funding** instead of **Amount** next to the currency input at the top.
- Input value, formatting, and downstream calculations behave identically.
- No layout shift, wrapping, or alignment regression in the surrounding row.

