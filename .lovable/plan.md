

# Fix: Portfolio Capacity Column Showing Wrong Values

## Root Cause (Verified via Database Query)

The capacity resolution in `BorrowerPortfolio.tsx` has an **unreliable fallback chain**:

1. **Priority 1**: Deal-specific capacity from `deal_section_values` (section='participants', key=`participant_{contactId}_capacity`) — **correct but only exists for participants added after the recent fix**
2. **Priority 2**: Global `contacts.contact_data.capacity` — **UNRELIABLE: shared across all deals, overwritten every time the contact is added to any deal**
3. **Priority 3**: `ROLE_FALLBACK[role]` — role-based default

**Database evidence**: For contact Abhijit Ghadge (ca71fac9...):
- DL-2026-0173: deal-specific capacity = "Co-Borrower" ✓
- DL-2026-0174: **NO deal-specific capacity** → falls back to global `contact_data.capacity` = "Co-Borrower" (wrong — could be anything)
- DL-2026-0175: deal-specific capacity = "Additional Guarantor" ✓

Any deal where the participant was added before the `deal_section_values` fix will show whatever the global value happens to be at the time of viewing — not what was originally selected.

## Fix

**File: `src/components/contacts/borrower-detail/BorrowerPortfolio.tsx`**

Change the `resolveCapacity` function (lines 240-253) to **remove the global `contact_data.capacity` fallback** from the resolution chain. When no deal-specific capacity exists, fall back directly to the role-based label:

```typescript
const resolveCapacity = (dealId: string, contactId: string | null, role: string): string => {
  // Priority 1: deal-specific section values (reliable, per-deal)
  if (contactId) {
    const sectionCap = perDealContactCapacity.get(dealId)?.get(contactId);
    if (sectionCap) return sectionCap;
  }
  // Priority 2: role-based fallback (skip unreliable global contact_data.capacity)
  return ROLE_FALLBACK[role] || role || 'Other';
};
```

Also remove the now-unused `contactCapacityMap` fetch (lines 191-205) and the `allContactIds` variable to clean up dead code.

## Files Modified

| File | Change |
|---|---|
| `src/components/contacts/borrower-detail/BorrowerPortfolio.tsx` | Remove global `contact_data.capacity` from fallback chain; remove unused contact capacity fetch |

## What Will NOT Change
- No database schema changes
- No changes to AddParticipantModal (deal-specific save is correct)
- No changes to ParticipantsSectionContent
- No UI layout changes
- Deal-specific capacity from `deal_section_values` continues to be the primary source

