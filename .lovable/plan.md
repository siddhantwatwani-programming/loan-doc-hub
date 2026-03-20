

# Fix Document Generation: Fetch Data from Participants Instead of Contacts

## Problem
The document generation edge function (`generate-document/index.ts`) currently discovers borrower/lender/broker contact IDs by scanning field values (e.g., `loan_terms.details_borrower_id`, `BR-XXXXX` patterns) and then queries the `contacts` table directly. Since participant management now lives in `deal_participants`, this approach produces missing or stale data.

## Solution
Replace the contact-ID-scanning and contacts-table lookup block (lines 202-418) with a participants-based approach that:
1. Queries `deal_participants` for the current `dealId`
2. Collects linked `contact_id` UUIDs
3. Fetches those contacts from the `contacts` table
4. Injects data using the same field key namespaces (`br_p_*`, `ld_p_*`, `bk_p_*`, `borrower1.*`, `lender1.*`, `broker1.*`, etc.)

## Changes (Single File)

**File: `supabase/functions/generate-document/index.ts`**

Replace the "Contact lookup" block (lines 202-418) with:

1. **Query `deal_participants`** for `deal_id = dealId`, selecting `role, contact_id, name, email, phone`
2. **Collect unique `contact_id` UUIDs** (non-null) from the participant rows
3. **Fetch contacts** from the `contacts` table using those UUID `id` values (not `contact_id` text field)
4. **Group participants by role**: find the first borrower, co-borrower (second borrower or capacity-based), lender, and broker
5. **Reuse the existing `injectContact` and `forceSet` helper functions** to populate field values identically to the current logic
6. **Participant selection logic**:
   - Borrower: first participant with `role = 'borrower'` (or capacity containing "Primary")
   - Co-Borrower: second borrower participant, or one with capacity "Co-Borrower"
   - Lender: first participant with `role = 'lender'`
   - Broker: first participant with `role = 'broker'`

## What Stays Unchanged
- The `injectContact` function and all field key mappings (`br_p_*`, `bk_p_*`, `ld_p_*`, dot-notation)
- The `setIfEmpty` and `forceSet` helpers
- All code after line 418 (indexed entity bridging, systemDate injection, property address computation, DOCX processing)
- Template structure, placeholder names, formatting logic
- Database schema, UI components, other edge functions

## Technical Detail

```text
Current flow:
  deal_section_values → scan for contact IDs → contacts table → inject

New flow:
  deal_participants (where deal_id = X) → contact_id UUIDs → contacts table → inject
```

The `deal_participants` table has `contact_id` (UUID FK to `contacts.id`), `role` (borrower/lender/broker), and basic fields (name, email, phone). The contacts table join provides full `contact_data` JSONB with addresses, license numbers, tax IDs, etc. needed for document placeholders.

