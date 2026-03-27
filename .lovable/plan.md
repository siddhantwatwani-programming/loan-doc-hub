

## Deep Analysis Results

### Root Cause

The `{{br_ag_fullName}}` field remains blank because of **two compounding issues**:

1. **No borrower section data persisted** — The deal `DL-2026-0170` has no `borrower` section row in `deal_section_values`. The saved sections are: escrow, notes, charges, loan_terms, other, liens, insurance, property, origination_fees. This means even if guarantor data was entered in the "Borrower → Additional Guarantor" form, it was **never saved** (or the save failed silently).

2. **Participant capacity mismatch** — The contact "xyz" (B-00007) has `contact_data.capacity = "Borrower"` in the database, **not** `"Additional Guarantor"`. The guarantor injection code added in the previous fix checks for `capacity.includes("additional guarantor")` — which never matches `"Borrower"`. The UI screenshot shows "Borrower - Additional Guarantor" but this display is constructed as `"{role_label} - {capacity}"` — the actual stored capacity is just `"Borrower"`.

### Why the screenshot shows "Borrower - Additional Guarantor"

The Participants table UI (`ParticipantsSectionContent.tsx` line 225-226) constructs the display as:
```
roleLabel = "Borrower"  (from deal_participants.role)
capacityVal = contact_data.capacity = "Borrower"
// Since capacityVal === roleLabel, it should show just "Borrower"
```

This means either: (a) the capacity was `"Additional Guarantor"` when the screenshot was taken but was later overwritten to `"Borrower"` by a contact update, or (b) the screenshot is from a previous session.

### Data verification

| Check | Result |
|-------|--------|
| `deal_section_values` borrower section | **Missing** — no borrower section exists |
| `deal_field_values` for `br_p_guarantoFullName` | **Empty** — zero rows |
| `deal_field_values` for `br_ag_fullName` | **Empty** — zero rows |
| Contact B-00007 `contact_data.capacity` | `"Borrower"` (not "Additional Guarantor") |
| Contact B-00007 name fields | `first_name: "xyz"`, `last_name: "abc"` |
| Guarantor injection code (line 424-455) | Correctly searches for "additional guarantor" in capacity — but never matches |

### Fix

The guarantor injection code needs to be more robust. Since the contact was added as a borrower participant but the user intended it as the Additional Guarantor, the code should **also** check if a non-primary, non-co-borrower participant exists and treat them as the guarantor fallback.

**File:** `supabase/functions/generate-document/index.ts`

**Change:** Modify the guarantor participant search (lines 424-429) to add a fallback: if no participant explicitly has `capacity = "Additional Guarantor"`, check for any borrower participant that is neither the primary borrower nor the co-borrower — since there are only three possible borrower roles in the participant list.

```typescript
// Line 424-429: Expand the guarantor search with fallback
const guarantorParticipant = borrowerParticipants.find((p: any) => {
  if (!p.contact_id) return false;
  const c = contactRowsByUuid.get(p.contact_id);
  const cap = c?.contact_data?.capacity;
  return cap && String(cap).toLowerCase().includes("additional guarantor");
}) || borrowerParticipants.find((p: any) => {
  // Fallback: any borrower participant that is NOT primary and NOT co-borrower
  if (!p.contact_id) return false;
  if (p === primaryBorrower || p === coBorrower) return false;
  const c = contactRowsByUuid.get(p.contact_id);
  const cap = c?.contact_data?.capacity;
  const capLower = cap ? String(cap).toLowerCase() : "";
  // Exclude explicitly primary/co-borrower participants
  return !capLower.includes("primary") && !capLower.includes("co-borrower") 
    && !capLower.includes("co-trustee") && !capLower.includes("trustee");
});
```

This is a ~7-line addition that adds a fallback `||` clause to the existing `find()`. No other code changes.

### Files changed
- `supabase/functions/generate-document/index.ts` — expand guarantor participant search (~7 lines added)

### No changes to
- Database schema
- Frontend code / UI
- Template files
- tag-parser.ts, field-resolver.ts, docx-processor.ts
- Any other edge functions

