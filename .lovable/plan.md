

## Problem

The document generation engine (`generate-document/index.ts`) injects participant contact data for **Primary Borrower**, **Co-Borrower**, **Lender**, and **Broker** — but has **no injection logic for "Additional Guarantor"** participants.

The screenshot confirms participant "xyz" (B-00007) exists with capacity "Borrower - Additional Guarantor". However, the engine never reads this participant's contact data into `br_ag_fullName` or `br_p_guaranto*` field keys, so `{{br_ag_fullName}}` always resolves to blank.

The `canonical_key` mapping (`br_ag_fullName` → `br_p_guarantoFullName`) set previously is correct but useless because neither key ever gets populated.

## Fix

**Single change in `supabase/functions/generate-document/index.ts`** — add ~20 lines after the co-borrower injection block (after line 421) to find and inject the Additional Guarantor participant.

### What the new code does

1. Searches `borrowerParticipants` for one whose contact `capacity` includes "additional guarantor" (case-insensitive)
2. If found, extracts the contact's name fields (first, middle, last → full name)
3. Injects values into both `br_p_guaranto*` keys (for canonical resolution) and `br_ag_fullName` directly (for direct tag match)
4. Uses the existing `setIfEmpty` helper — no new helpers needed

### Exact insertion point

After line 421 (after co-borrower injection, before lender injection):

```typescript
// Inject additional guarantor
const guarantorParticipant = borrowerParticipants.find((p: any) => {
  if (!p.contact_id) return false;
  const c = contactRowsByUuid.get(p.contact_id);
  const cap = c?.contact_data?.capacity;
  return cap && String(cap).toLowerCase().includes("additional guarantor");
});

if (guarantorParticipant?.contact_id) {
  const gc = contactRowsByUuid.get(guarantorParticipant.contact_id);
  if (gc) {
    const cd = gc.contact_data || {};
    const firstName = cd.first_name || gc.first_name || "";
    const middleName = cd.middle_initial || "";
    const lastName = cd.last_name || gc.last_name || "";
    const assembledName = [firstName, middleName, lastName].filter(Boolean).join(" ");
    const fullName = assembledName || cd.full_name || gc.full_name || "";
    const email = cd.email || gc.email || "";
    const phone = cd["phone.cell"] || cd["phone.work"] || cd["phone.home"] || gc.phone || "";

    setIfEmpty("br_p_guarantoFullName", fullName);
    setIfEmpty("br_p_guarantoFirstName", firstName);
    setIfEmpty("br_p_guarantoLastName", lastName);
    setIfEmpty("br_p_guarantoMiddleInitia", middleName);
    setIfEmpty("br_ag_fullName", fullName);
    setIfEmpty("br_ag_firstName", firstName);
    setIfEmpty("br_ag_lastName", lastName);
    setIfEmpty("br_ag_email", email);
    setIfEmpty("br_ag_phone", phone);

    debugLog(`[generate-document] Injected guarantor contact fields from participant (contact ${gc.contact_id})`);
  }
}
```

### Files changed
- `supabase/functions/generate-document/index.ts` — ~20 lines added after line 421

### No changes to
- Database schema
- Frontend code / UI
- Template files
- tag-parser.ts, field-resolver.ts, docx-processor.ts
- Any other edge functions

