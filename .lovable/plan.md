

# Fix: Document Generation Failing Due to Non-Existent `capacity` Column

## Root Cause

The edge function queries `deal_participants` selecting a `capacity` column that does not exist in the table schema. This causes the query to fail silently, returning 0 participants, which means no borrower/lender/broker data is injected into the document.

Error from logs:
```
Failed to fetch deal_participants: column deal_participants.capacity does not exist
```

Capacity is stored in the **contact's `contact_data` JSONB** (as `contact_data.capacity`), not on the `deal_participants` table itself.

## Fix (Single File)

**File: `supabase/functions/generate-document/index.ts`**

**Line 207**: Remove `capacity` from the select query:

```
// Before
.select("role, contact_id, name, email, phone, capacity")

// After
.select("role, contact_id, name, email, phone")
```

The capacity-based participant selection logic (lines 314-321) already reads capacity from `contact_data` via the contact lookup, so it will continue to work by checking `contact_data.capacity` on the resolved contact records instead. However, since the participant selection currently checks `p.capacity` (which would be undefined), we also need to update the primary borrower / co-borrower selection to check the contact's `contact_data.capacity` instead of the participant row's non-existent capacity field.

**Updated participant selection logic** (lines ~314-321):

Instead of checking `p.capacity` on the participant row, after resolving contacts, select the primary borrower and co-borrower based on the linked contact's `contact_data.capacity` field. If no capacity distinction exists, fall back to first/second borrower ordering.

## What Stays Unchanged
- All field key mappings, `injectContact`, `forceSet`, `setIfEmpty` helpers
- Template structure, placeholder names, formatting logic
- Database schema (no new columns)
- UI components, other edge functions

