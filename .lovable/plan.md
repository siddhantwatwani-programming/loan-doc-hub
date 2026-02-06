
# Fix: Borrower Records Disappearing After Navigation

## Problem Identified

When multiple borrowers are added to a deal, their data is being **overwritten** in the database. This happens because:

1. The database stores field values in JSONB with `field_dictionary_id` as the key
2. Both `borrower1.first_name` and `borrower2.first_name` map to the **same** `field_dictionary_id` 
3. When saving, the second borrower's values overwrite the first borrower's values

For example, when you add:
- Borrower 1: John Smith
- Borrower 2: Jane Doe

After save, only "Jane Doe" (Borrower 2) data remains because it overwrote "John Smith" (Borrower 1).

---

## Solution: Composite Key Storage

Change the JSONB storage key from just `field_dictionary_id` to a **composite key** that includes the indexed prefix.

### Current Storage Model (Broken)
```json
{
  "26ef46a5-...": { "indexed_key": "borrower2.first_name", "value_text": "Jane" }
}
```
Only stores the last borrower's data.

### New Storage Model (Fixed)
```json
{
  "borrower1::26ef46a5-...": { "indexed_key": "borrower1.first_name", "value_text": "John" },
  "borrower2::26ef46a5-...": { "indexed_key": "borrower2.first_name", "value_text": "Jane" }
}
```
Stores each borrower's data separately.

---

## Files to Modify

### 1. `src/hooks/useDealFields.ts`

**Save Logic Changes (lines 398-455):**
- Modify the storage key generation to use composite keys for indexed fields
- Add helper function `getStorageKey(indexedFieldKey, fieldDictId)` that returns:
  - `{prefix}::{fieldDictId}` for indexed fields (e.g., `borrower1::uuid`)
  - `{fieldDictId}` for non-indexed fields (backward compatible)

**Load Logic Changes (lines 268-295):**
- Parse composite keys when loading data
- Extract the indexed prefix from the storage key when present
- Fall back to using `indexed_key` property for backward compatibility

### 2. Migration Helper

The fix will be backward compatible:
- **New data** uses composite keys for multi-entity fields
- **Old data** with `indexed_key` property continues to work during load
- No database schema changes required

---

## Technical Details

### New Helper Functions in useDealFields.ts

```typescript
// Extract prefix from indexed key (borrower1.first_name -> borrower1)
function getIndexedPrefix(fieldKey: string): string | null {
  const match = fieldKey.match(/^(borrower\d+|coborrower\d+|lender\d+|property\d+|broker\d+)\./);
  return match ? match[1] : null;
}

// Generate storage key for JSONB
function getStorageKey(fieldKey: string, fieldDictId: string): string {
  const prefix = getIndexedPrefix(fieldKey);
  return prefix ? `${prefix}::${fieldDictId}` : fieldDictId;
}

// Parse storage key back to components
function parseStorageKey(storageKey: string): { prefix: string | null; fieldDictId: string } {
  if (storageKey.includes('::')) {
    const [prefix, fieldDictId] = storageKey.split('::');
    return { prefix, fieldDictId };
  }
  return { prefix: null, fieldDictId: storageKey };
}
```

### Save Logic Update

```typescript
// Line 454: Change from
sectionUpdates[section][fieldDictId] = fieldValueObj;

// To:
const storageKey = getStorageKey(fieldKey, fieldDictId);
sectionUpdates[section][storageKey] = fieldValueObj;
```

### Load Logic Update

```typescript
// Line 273: Update to handle composite keys
Object.entries(fieldValues).forEach(([storageKey, fieldData]) => {
  const { prefix, fieldDictId } = parseStorageKey(storageKey);
  const fieldMeta = fieldDictIdToMeta.get(fieldDictId);
  
  if (fieldMeta && fieldData) {
    const value = extractTypedValueFromJsonb(fieldData, fieldMeta.data_type);
    if (value) {
      // Use indexed_key if stored, reconstruct from prefix+canonical, or use canonical
      let keyToUse = fieldData.indexed_key;
      if (!keyToUse && prefix) {
        const canonicalField = fieldMeta.field_key.replace(/^(borrower|lender|property|broker)\./, '');
        keyToUse = `${prefix}.${canonicalField}`;
      }
      keyToUse = keyToUse || fieldMeta.field_key;
      valuesMap[keyToUse] = value;
    }
  }
});
```

---

## Testing Checklist

After implementation:
1. Add Borrower 1 with test data
2. Add Borrower 2 with different data
3. Click "Save Draft"
4. Navigate to another tab (e.g., Property)
5. Return to Borrower tab
6. Verify both borrowers appear in the table with correct data
7. Reload the page and verify data persists

---

## Scope

- **Modified**: `src/hooks/useDealFields.ts` only
- **No changes to**: UI components, database schema, APIs, or document generation
- **Backward compatible**: Existing data with `indexed_key` continues to load correctly
