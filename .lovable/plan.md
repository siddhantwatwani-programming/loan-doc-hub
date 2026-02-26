

## Problem

The field `property1.address` is defined in the field dictionary and referenced in the template merge tag `{{property1.address}}`, but the Property Details form **never renders an input for it**. The form only captures individual address components: `street`, `city`, `state`, `zip`, `county`. No value is ever saved for `property1.address`, so it resolves to empty during document generation.

## Fix

**File: `supabase/functions/generate-document/index.ts`**

Add an auto-computation block (similar to the existing `borrower.borrower_description` auto-computation at ~line 223) that constructs `property1.address` from its component fields when not already set.

After the existing borrower description auto-computation block (~line 238), add:

```typescript
// Auto-compute property1.address from component fields if not already set
const existingPropAddr = fieldValues.get("property1.address") || fieldValues.get("Property1.Address");
if (!existingPropAddr || !existingPropAddr.rawValue) {
  const street = fieldValues.get("property1.street")?.rawValue;
  const city = fieldValues.get("property1.city")?.rawValue;
  const state = fieldValues.get("property1.state")?.rawValue;
  const zip = fieldValues.get("property1.zip")?.rawValue;
  const county = fieldValues.get("property1.county")?.rawValue;

  const parts = [street, city, county, state, zip].filter(Boolean).map(String);
  if (parts.length > 0) {
    const fullAddress = parts.join(", ");
    fieldValues.set("property1.address", { rawValue: fullAddress, dataType: "text" });
    fieldValues.set("Property1.Address", { rawValue: fullAddress, dataType: "text" });
    console.log(`[generate-document] Auto-computed property1.address = "${fullAddress}"`);
  }
}
```

### What this does
- Checks if `property1.address` (or `Property1.Address`) already has a value
- If empty, constructs the full address from saved component fields (street, city, county, state, zip)
- Sets both casing variants so merge tags resolve regardless of case
- No UI, schema, or other logic changes

