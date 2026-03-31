

# Fix: Participant Capacity Overwritten to Last-Saved Value Across All Deals

## Root Cause

**Capacity is stored globally, not per-deal.** The `deal_participants` table has no `capacity` column. When a participant is added to a deal via `AddParticipantModal`, the selected capacity (e.g., "Co-Borrower") is written to `contacts.contact_data.capacity` — a **global** field on the contact record.

When the same contact (Abhijit Ghadge) is added to 3 different deals with 3 different capacities:
1. DL-2026-0173 as "Borrower" → `contact_data.capacity` = "Borrower"
2. DL-2026-0174 as "Additional Guarantor" → overwrites to "Additional Guarantor"
3. DL-2026-0175 as "Authorized Signer" → overwrites to "Authorized Signer"

Then `ParticipantsSectionContent` reads capacity from `contact_data.capacity` (line 183/224), so ALL deals show "Authorized Signer" (the last value written).

The same global value flows to `BorrowerPortfolio`, which tries deal-specific resolution from `deal_section_values` (section='participants') first, but that data is **never written** — so it falls back to the same global value.

## Fix (2 changes, 1 file each)

### Change 1: `AddParticipantModal.tsx` — Save capacity to `deal_section_values`

After inserting the `deal_participants` row (line 288), also upsert a `deal_section_values` row with `section='participants'` containing the capacity keyed by contact ID. This creates deal-specific capacity storage.

```typescript
// After participant insert succeeds, persist capacity per-deal
if (contactId && capacity) {
  const capacityKey = `participant_${contactId}_capacity`;
  const { data: existingSection } = await supabase
    .from('deal_section_values')
    .select('id, field_values')
    .eq('deal_id', dealId)
    .eq('section', 'participants')
    .maybeSingle();

  const existingValues = (existingSection?.field_values as Record<string, any>) || {};
  const updatedValues = { ...existingValues, [capacityKey]: capacity };

  if (existingSection) {
    await supabase.from('deal_section_values')
      .update({ field_values: updatedValues })
      .eq('id', existingSection.id);
  } else {
    await supabase.from('deal_section_values')
      .insert({ deal_id: dealId, section: 'participants', field_values: updatedValues });
  }
}
```

### Change 2: `ParticipantsSectionContent.tsx` — Read capacity from deal-specific storage

In `fetchParticipants`, after fetching participants and contacts, also fetch `deal_section_values` where `section='participants'` for this deal. Read capacity from `participant_{contact_id}_capacity` key. Fall back to `contact_data.capacity` only if deal-specific value is missing.

```typescript
// Fetch deal-specific participant section values
const { data: participantSection } = await supabase
  .from('deal_section_values')
  .select('field_values')
  .eq('deal_id', dealId)
  .eq('section', 'participants')
  .maybeSingle();

const pSectionValues = (participantSection?.field_values || {}) as Record<string, any>;

// In the mapping (line 224), use deal-specific capacity first:
const dealCapacity = contactId ? pSectionValues[`participant_${contactId}_capacity`] : '';
const capacityVal = dealCapacity || contact?.capacity || '';
```

### Change 3: `BorrowerPortfolio.tsx` — Fix capacity resolution to match new key pattern

Update the `perDealContactCapacity` builder (lines 210-227) to also check for `participant_{contactId}_capacity` keys in the participants section values, not just keys containing the substring "capacity" with adjacent "contact_id" keys.

```typescript
// In addition to existing key scanning, check explicit participant_*_capacity keys
Object.entries(fv).forEach(([key, val]) => {
  const match = key.match(/^participant_(.+)_capacity$/);
  if (match) {
    const cid = match[1];
    const label = resolveCapacityLabel(parseCapacityValue(val));
    if (label) dealCapMap.set(cid, label);
  }
});
```

## Files Modified

| File | Change |
|---|---|
| `src/components/deal/AddParticipantModal.tsx` | After participant insert, save capacity to `deal_section_values` (section='participants') keyed by contact ID |
| `src/components/deal/ParticipantsSectionContent.tsx` | Read deal-specific capacity from `deal_section_values` before falling back to global `contact_data.capacity` |
| `src/components/contacts/borrower-detail/BorrowerPortfolio.tsx` | Recognize `participant_{contactId}_capacity` key pattern in section values |

## What Will NOT Change
- No database schema changes
- No API changes
- No template or document generation changes
- No UI layout changes
- Global `contact_data.capacity` continues to be written (backward compat) but is no longer the primary source for deal-specific display

