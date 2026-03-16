

## Fix: `{{br_p_fullName}}` not populating in document generation

### Root Cause

The generate-document edge function builds the `fieldValues` map using **dot-notation keys** from indexed storage (e.g., `borrower1.full_name` → bridged to `borrower.full_name`). However, merge tags like `{{br_p_fullName}}` resolve to the field_dictionary's `field_key` (`br_p_fullName`), which never gets added to the `fieldValues` map. There is no bridge between `br_p_fullName` and `borrower.full_name`.

This affects **all** borrower, lender, broker, co-borrower, property, and other fields that use the `br_p_*` / `ld_p_*` / `bk_p_*` naming convention in templates. The `fullName` placeholder is just the first symptom.

### Fix (single file change)

**File:** `supabase/functions/generate-document/index.ts`

After the existing field value population loop (around line 213, after the "Bridge indexed entity keys" block), add a new bridging step:

1. Import the `legacyKeyMap` reverse mapping or build it inline from the `field_dictionary` data already fetched (`allFieldDictMap`).
2. For each entry in `allFieldDictMap`, check if the `field_key` (e.g., `br_p_fullName`) is already in `fieldValues`. If not, check if there's a matching value under any known dot-notation alias by looking up the `canonical_key` in the field_dictionary or by scanning fieldValues for a matching `indexed_key` reference.

Concretely, the approach:
- The `allFieldDictMap` already maps `field_dictionary_id → { field_key, canonical_key, ... }`.
- When iterating deal section values (lines 163-188), the code already resolves `fieldDict.field_key` (which is `br_p_fullName`) and sets it in fieldValues — **but only when no `indexed_key` is present**.
- The issue is that borrower fields **always** have an `indexed_key` (e.g., `borrower1.full_name`), so line 173 uses the `indexed_key` instead of `fieldDict.field_key`. Line 178-185 then tries to also set the canonical `field_key`, but only when `!canonicalHasIndex` — and `br_p_fullName` doesn't have an index pattern, so it should be set.

Let me re-examine the actual logic more carefully: the condition at line 181 checks if `fieldDict.field_key` matches `/^[a-zA-Z_]+\d+\./` (e.g., `property1.street`). `br_p_fullName` does NOT match this pattern, so it SHOULD be set at line 183. Let me trace why it's not.

The second pass (lines 191-200) also tries to set `fieldDict.field_key` if not already present. So `br_p_fullName` should be getting set... unless the field_dictionary entry for borrower `full_name` has a *different* field_key than `br_p_fullName`.

**Key insight:** The data is stored in `deal_section_values` with the field_dictionary_id as the JSONB key (composite: `borrower1::<uuid>`). The UUID `69d7cead-...` maps to `br_p_fullName` in field_dictionary. But this deal has **no borrower section data at all** — the query showed only `loan_terms` and `broker` sections exist. The field simply has no data entered.

However, the edge function logs show `borrower1.full_name` data doesn't exist either. The log says `[tag-parser] No data for br_p_fullName` — this is correct because no borrower data was saved for this deal.

**Wait** — but the user says the placeholder "should populate." Let me reconsider: perhaps the borrower name IS entered but stored in a different way, or perhaps the auto-compute for `Borrower.Name` should also set `br_p_fullName`.

Looking at line 234-250: there's auto-compute for `borrower.borrower_description` using `borrower1.full_name`, but there's no auto-compute that sets `br_p_fullName`. The existing auto-compute for `Broker.Name` (line 302-317) sets both `Broker.Name` and `broker.name`, but there's no equivalent for borrower `br_p_fullName`.

### Revised Root Cause

For this deal, borrower data IS entered (the logs show `Broker.Name` was auto-computed from `broker1.first_name` etc., and `borrower.borrower_description` attempted computation). The logs show the function found 49 field values. But `br_p_fullName` has no data.

The real issue: when borrower data is stored with composite key `borrower1::<field_dict_id>`, the `indexed_key` in the JSONB value is `borrower1.full_name`. The code at line 173 sets `fieldValues["borrower1.full_name"]` and at line 183 should also set `fieldValues["br_p_fullName"]`. But looking more carefully at the condition:

```
if (indexedKey && indexedKey !== fieldDict.field_key) {
  const canonicalHasIndex = /^[a-zA-Z_]+\d+\./.test(fieldDict.field_key);
  if (!canonicalHasIndex) {
    fieldValues.set(fieldDict.field_key, ...);  // sets br_p_fullName
  }
}
```

This SHOULD set `br_p_fullName`. Unless the deal simply has no borrower data entered — which my database query confirmed: only `loan_terms` and `broker` sections exist for this deal.

### Actual Solution

The borrower data doesn't exist in this deal's `deal_section_values`. The `br_p_fullName` field has no value to populate. However, the auto-compute block (lines 234-250) does try to build `borrower.borrower_description` from `borrower1.full_name` — if that data existed.

The fix should add an auto-compute step that also sets `br_p_fullName` from `borrower1.full_name` (or vice versa) — similar to how `Broker.Name` is auto-computed. This ensures that even if data is stored under one key variant, the other variant is also available.

**In `supabase/functions/generate-document/index.ts`**, after the borrower description auto-compute block (around line 250), add:

```typescript
// Auto-compute br_p_fullName from borrower name fields if not already set
const existingBrPFullName = fieldValues.get("br_p_fullName");
if (!existingBrPFullName || !existingBrPFullName.rawValue) {
  // Try borrower1.full_name first (indexed key)
  const b1FullName = fieldValues.get("borrower1.full_name") || fieldValues.get("borrower.full_name");
  if (b1FullName && b1FullName.rawValue) {
    fieldValues.set("br_p_fullName", { rawValue: b1FullName.rawValue, dataType: "text" });
    console.log(`[generate-document] Auto-computed br_p_fullName = "${b1FullName.rawValue}"`);
  } else {
    // Assemble from first + middle + last name components
    const firstName = fieldValues.get("borrower1.first_name")?.rawValue || fieldValues.get("borrower.first_name")?.rawValue || fieldValues.get("br_p_firstName")?.rawValue;
    const middleName = fieldValues.get("borrower1.middle_initial")?.rawValue || fieldValues.get("borrower.middle_initial")?.rawValue || fieldValues.get("br_p_middleInitia")?.rawValue;
    const lastName = fieldValues.get("borrower1.last_name")?.rawValue || fieldValues.get("borrower.last_name")?.rawValue || fieldValues.get("br_p_lastName")?.rawValue;
    const nameParts = [firstName, middleName, lastName].filter(Boolean).map(String);
    if (nameParts.length > 0) {
      const fullName = nameParts.join(" ");
      fieldValues.set("br_p_fullName", { rawValue: fullName, dataType: "text" });
      console.log(`[generate-document] Auto-computed br_p_fullName from components = "${fullName}"`);
    }
  }
}

// Also bridge the reverse: if br_p_fullName has data but borrower.full_name doesn't
const resolvedBrPFullName = fieldValues.get("br_p_fullName");
if (resolvedBrPFullName?.rawValue) {
  if (!fieldValues.has("borrower.full_name")) {
    fieldValues.set("borrower.full_name", resolvedBrPFullName);
  }
  if (!fieldValues.has("borrower1.full_name")) {
    fieldValues.set("borrower1.full_name", resolvedBrPFullName);
  }
}
```

### Summary

- **1 file modified**: `supabase/functions/generate-document/index.ts`
- **Change**: Add auto-compute bridging for `br_p_fullName` from dot-notation borrower name fields (and vice versa), following the same pattern as existing `Broker.Name` and `Borrower.Address` auto-compute blocks
- **No schema changes, no new tables, no UI changes**

