

# Plan: Fix Three Unpopulated Placeholders in Document Generation

## Root Cause Analysis

### 1. `{{currentDate}}` — No matching field value injected
The system injects `systemDate` (line 218 of `generate-document/index.ts`) but the template uses `{{currentDate}}`. There is no field_dictionary entry or alias for `currentDate`, so it never resolves.

**Fix**: Also inject `currentDate` alongside `systemDate` at line 219.

### 2. `{{pr_p_address}}` — Auto-compute uses wrong key prefix
The property address auto-compute (lines 239-269) looks for `property1.street`, `property1.city`, etc. But actual field values are stored under `pr_p_street`, `pr_p_city`, `pr_p_state`, `pr_p_zip`, `pr_p_county` (the new naming convention). The auto-compute never finds the component fields, so `pr_p_address` is never computed.

**Fix**: After the existing `propertyN.address` auto-compute block, add a second pass that checks `pr_p_*` keys and sets `pr_p_address` from `pr_p_street`, `pr_p_city`, `pr_p_state`, `pr_p_zip`, `pr_p_county`.

### 3. `{{pr_li_lienHolder}}` — Composite key prefix mismatch
Property section data is stored with composite keys like `property2::uuid`. The code at line 166 extracts the UUID and resolves via field_dictionary to `pr_li_lienHolder`. However, the `indexed_key` stored in the JSONB data (line 173) may use patterns like `property2.lien_holder`, which takes priority. The field value ends up stored under `property2.lien_holder` instead of `pr_li_lienHolder`. When `{{pr_li_lienHolder}}` is looked up, it doesn't find a match because the fieldValues map uses the indexed_key.

**Fix**: After field value loading, add a reverse-mapping pass that also stores values under their canonical `field_key` from field_dictionary when an `indexed_key` was used. This ensures `pr_li_lienHolder` is populated in fieldValues even when data was stored with an indexed entity prefix.

## Implementation (Single File)

**File**: `supabase/functions/generate-document/index.ts`

### Change 1: Lines 218-219 — Add `currentDate` injection
```typescript
fieldValues.set("systemDate", { rawValue: systemDate, dataType: "date" });
fieldValues.set("currentDate", { rawValue: systemDate, dataType: "date" });
console.log(`[generate-document] Injected systemDate and currentDate: ${systemDate}`);
```

### Change 2: After line 269 — Add `pr_p_*` address auto-compute
```typescript
// Auto-compute pr_p_address from pr_p_* component fields (new naming convention)
const existingPrPAddr = fieldValues.get("pr_p_address");
if (!existingPrPAddr || !existingPrPAddr.rawValue) {
  const street = fieldValues.get("pr_p_street")?.rawValue;
  const city = fieldValues.get("pr_p_city")?.rawValue;
  const state = fieldValues.get("pr_p_state")?.rawValue;
  const zip = fieldValues.get("pr_p_zip")?.rawValue;
  const county = fieldValues.get("pr_p_county")?.rawValue;
  const country = fieldValues.get("pr_p_country")?.rawValue;
  const parts = [street, city, state, country, zip].filter(Boolean).map(String);
  if (parts.length > 0) {
    const fullAddress = parts.join(", ");
    fieldValues.set("pr_p_address", { rawValue: fullAddress, dataType: "text" });
    console.log(`[generate-document] Auto-computed pr_p_address = "${fullAddress}"`);
  }
}
```

### Change 3: After field value loading (after line 188) — Ensure field_key is always populated alongside indexed_key
Add a reverse-mapping pass so that when data was stored under an `indexed_key` (e.g., `property2.lien_holder`), the canonical `field_key` from field_dictionary (e.g., `pr_li_lienHolder`) is also set if not already present:
```typescript
// Ensure field_dictionary field_key is populated even when indexed_key took priority
for (const sv of (sectionValues || [])) {
  for (const [key, data] of Object.entries(sv.field_values || {})) {
    const fieldDictId = key.includes("::") ? key.split("::")[1] : key;
    const fieldDict = allFieldDictMap.get(fieldDictId);
    if (fieldDict && !fieldValues.has(fieldDict.field_key)) {
      const rawValue = extractRawValueFromJsonb(data, fieldDict.data_type || "text");
      fieldValues.set(fieldDict.field_key, { rawValue, dataType: fieldDict.data_type || "text" });
    }
  }
}
```

## What This Does NOT Change
- No UI/component changes
- No database/schema changes
- No template file changes
- No changes to tag-parser.ts, docx-processor.ts, or field-resolver.ts
- No changes to existing auto-compute logic (only additions after it)
- Label-based replacement behavior unchanged
- All existing field resolution priority unchanged

