

## Fix: Broker Contact Lookup Missing in Document Generation

### Root Cause

The `generate-document` Edge Function's contact lookup block (lines 202-323) fetches **borrower** and **lender** contacts from the `contacts` table but does NOT fetch **broker** contacts. Since the Broker section was moved from Deals to Contacts, broker field data (license, first name, last name) no longer exists in `deal_section_values`. The originating vendor ID (e.g., `BR-00001`) is stored at `loan_terms.details_originating_vendor`, but the code never scans for `BR-` prefixed IDs to look up from the contacts table.

This causes:
- `bk_p_brokerLicens` resolving to the wrong value (broker name instead of license) due to fallback logic or field collisions
- `bk_p_firstName` and `bk_p_lastName` being empty, causing the entire "Broker's Representative" line to disappear
- Leftover `{{` braces when partial/incorrect data is injected

### Fix: One change in `supabase/functions/generate-document/index.ts`

Add broker contact lookup alongside the existing borrower/lender lookups in the contact resolution block (~line 210). Specifically:

1. **Scan for broker contact ID**: Read `loan_terms.details_originating_vendor` from `fieldValues` (which stores the `BR-XXXXX` ID). Add it to `contactIdsToFetch`.

2. **Inject broker contact data**: After fetching contacts, find the broker contact row (`contact_type === 'broker'`) and call the existing `injectContact()` helper with:
   - Dot prefixes: `["broker1", "broker"]` 
   - Short prefix: `"bk_p"`

3. **Inject license number**: The `injectContact` helper already injects `license_number` into dot-notation keys. Add explicit injection of `bk_p_brokerLicens` from `contact_data.license_number` since the existing `injectContact` shortPrefix logic doesn't cover this specific truncated key.

### Technical Detail

In the contact lookup block (around line 210), after the existing borrower/lender ID scanning:

```typescript
// Also scan for broker contact IDs (BR-XXXXX pattern)
const brokerContactId = fieldValues.get("loan_terms.details_originating_vendor")?.rawValue;
if (brokerContactId && typeof brokerContactId === "string" && brokerContactId.startsWith("BR-")) {
  if (!contactIdsToFetch.includes(brokerContactId)) {
    contactIdsToFetch.push(brokerContactId);
  }
}
```

Then after the lender injection block (around line 321), add:

```typescript
// Inject broker contact data
for (const cr of contactRows) {
  if ((cr as any).contact_type === "broker") {
    injectContact(cr, ["broker1", "broker"], "bk_p");
    // Inject broker license explicitly (truncated key not covered by generic shortPrefix logic)
    const cd = (cr as any).contact_data || {};
    const license = cd.license_number || cd.License || (cr as any).license_number || "";
    if (license) {
      setIfEmpty("bk_p_brokerLicens", String(license));
      setIfEmpty("broker.License", String(license));
      setIfEmpty("broker1.license_number", String(license));
    }
    console.log(`[generate-document] Injected broker contact fields from ${(cr as any).contact_id}`);
    break;
  }
}
```

### What this does NOT change
- No database schema changes
- No UI changes
- No changes to tag-parser, field-resolver, or formatting logic
- No changes to borrower/lender contact lookup
- No changes to template processing or DOCX manipulation

