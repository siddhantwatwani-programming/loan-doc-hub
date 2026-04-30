# Remove Co-borrower from Add Participant Dropdown

## Scope

Per your directive, the only explicit change is:

> Enter File Data > Participants > Add Participant — Remove 'Co-borrower' from dropdown.

The remainder of the prompt ("After saving data will populate / Persist the above fields") does not list any specific fields, so this plan covers only the dropdown removal. If you intended additional fields to persist, please share them and I'll extend the plan.

## File to change

`src/components/deal/AddParticipantModal.tsx`

## Change

Remove the single `co_borrower` option from the `PARTICIPANT_TYPES` array (line 55) so it no longer appears in the "Participant Type" dropdown of the Add Participant modal.

```text
PARTICIPANT_TYPES = [
  Borrower,
  Co-borrower,        ← REMOVE this entry only
  Lender,
  Broker,
  Additional Guarantor,
  Authorized Party,
]
```

## What stays the same (per minimal-change policy)

- The `'co_borrower'` value remains in the `ParticipantType` union type (line 46) and in `EXTENDED_TYPE_LABELS` (line 65) so any existing co-borrower participants already saved in the database continue to render their capacity label correctly.
- No changes to save/update APIs, modal submission logic, database schema, RLS, `deal_participants` table, or any other component.
- Co-borrower management remains available through the dedicated Borrower → Co-borrower sub-section (existing `BorrowerCoBorrowerForm`).

## Net effect

Users can no longer select "Co-borrower" when adding a new participant via the Add Participant modal. All other participant types remain selectable and their save behavior is unchanged.
