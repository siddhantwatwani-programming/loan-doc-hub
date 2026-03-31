

# Fix: Participant Capacity Incorrectly Overwritten to "Borrower"

## Root Cause

There are **two interconnected bugs**:

### Bug 1: Row-click overwrites `contact_data.capacity` with role label (Primary)

In `ParticipantsSectionContent.tsx`, both `navigateToContactByEmail` (line 305-306) and `navigateToContactById` (line 371-372) execute this code when a user clicks a participant row:

```typescript
const capacityLabel = ROLE_LABELS[participant.role] || participant.role;
mergedContactData['capacity'] = capacityLabel;
```

`participant.role` is always `"borrower"` for all borrower-type participants (Co-Borrower, Additional Guarantor, etc.), so `ROLE_LABELS["borrower"]` = `"Borrower"`. This overwrites the correctly saved capacity (e.g., "Co-Borrower", "Additional Guarantor") to "Borrower" every time a row is clicked.

### Bug 2: `contact_data.capacity` is a shared global field

The AddParticipantModal saves capacity to `contacts.contact_data.capacity` — a single shared field on the contact record. When the same contact is added to multiple deals with different capacities, each addition overwrites the previous value. The last write wins.

### Bug 3: Portfolio reads from shared field as fallback

`BorrowerPortfolio.tsx` line 216-218 uses `contactCapacityMap` (from `contact_data.capacity`) as priority 2 fallback. Since this field is corrupted by Bug 1, the portfolio also shows wrong data.

## Fix (3 changes in 1 file)

**File: `src/components/deal/ParticipantsSectionContent.tsx`**

### Change 1: Stop overwriting capacity on row click

In `navigateToContactByEmail` (line ~305-306) and `navigateToContactById` (line ~371-372), **remove** the two lines that overwrite capacity:

```typescript
// REMOVE these lines:
const capacityLabel = ROLE_LABELS[participant.role] || participant.role;
mergedContactData['capacity'] = capacityLabel;
```

The capacity is already correctly set during participant creation (AddParticipantModal). Row-click navigation should never modify it.

### Change 2: Display capacity from the correct source

In `fetchParticipants` (line ~220-242), the capacity is currently sourced only from `contact_data.capacity` (shared/global). Instead, also check `deal_section_values` for the participants section, similar to how BorrowerPortfolio does it.

However, the simpler and more correct fix: since the AddParticipantModal already writes the capacity to `contact_data.capacity` at creation time, and this bug is caused by the row-click overwrite, fixing Change 1 alone will prevent future corruption. The existing data for the 3 affected deals can be corrected by re-adding participants or by a one-time data fix.

### Change 3: Use participant's own capacity, not role label

In `fetchParticipants`, the `participant_type_capacity` display (line 225-226) reads `contact?.capacity`. This is correct IF the contact_data isn't corrupted. After Change 1 prevents corruption, this will work correctly for new participants.

For the BorrowerPortfolio, the resolution chain (deal_section_values → contact_data.capacity → role fallback) is already correct — it just reads corrupted data. Fixing the write side (Change 1) fixes the read side.

## Summary of Code Changes

| File | Change |
|---|---|
| `ParticipantsSectionContent.tsx` | Remove 4 lines (2 in `navigateToContactByEmail`, 2 in `navigateToContactById`) that overwrite `contact_data.capacity` with `ROLE_LABELS[role]` |

## What Will NOT Change
- No database schema changes
- No API changes
- No UI layout changes
- No changes to AddParticipantModal (it correctly saves capacity)
- No changes to BorrowerPortfolio (it correctly reads capacity)
- No changes to document generation

