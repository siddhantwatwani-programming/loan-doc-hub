
# Fix: Borrower and Lender Data Not Saving/Loading

## Problem Summary

When entering data for Borrowers and Lenders in a deal:
- Data does not persist after saving
- Reopening a deal shows empty Borrower and Lender sections

## Root Cause Analysis

The system has a **field key mapping mismatch** between the UI and database:

| Component | Field Key Pattern | Example |
|-----------|------------------|---------|
| Field Dictionary | Canonical keys | `lender.first_name`, `borrower.first_name` |
| UI Components | Indexed prefixes | `lender1.first_name`, `borrower1.first_name` |

**Why it fails:**

1. **On Save (`useDealFields.ts` lines 350-352)**:
   ```text
   fieldIdMap contains: { "lender.first_name": "uuid-123", ... }
   UI sends: "lender1.first_name"
   Lookup: fieldIdMap["lender1.first_name"] = undefined
   Result: Field SKIPPED (no save occurs)
   ```

2. **On Load**: Same mapping issue prevents data from being associated with indexed UI fields

## Solution

Modify `useDealFields.ts` to handle the indexed prefix pattern by:

1. **Extracting the canonical key** from indexed keys during save (e.g., `lender1.first_name` -> `lender.first_name`)
2. **Storing the full indexed key** in the JSONB structure to preserve multi-entity relationships
3. **Loading indexed keys correctly** from stored JSONB data

### Technical Implementation

**File: `src/hooks/useDealFields.ts`**

#### 1. Add Helper Function to Extract Canonical Key

```text
// Extracts canonical key from indexed key
// e.g., "lender1.first_name" -> "lender.first_name"
// e.g., "borrower2.address.city" -> "borrower.address.city"
function getCanonicalKey(indexedKey: string): string {
  return indexedKey
    .replace(/^(borrower)\d+\./, '$1.')
    .replace(/^(coborrower)\d+\./, 'coborrower.')
    .replace(/^(lender)\d+\./, '$1.')
    .replace(/^(property)\d+\./, 'property.')
    .replace(/^(co_borrower)\d+\./, 'co_borrower.');
}
```

#### 2. Modify Save Logic (saveDraft function)

Update the field lookup to use the canonical key for dictionary ID lookup while preserving the indexed key for storage:

```text
for (const fieldKey of fieldKeysToSave) {
  // Get canonical key for dictionary lookup
  const canonicalKey = getCanonicalKey(fieldKey);
  const fieldDictId = fieldIdMap[canonicalKey] || fieldIdMap[fieldKey];
  
  if (!fieldDictId) continue;
  
  // Find field using canonical key
  const field = resolvedFields?.fields.find(
    f => f.field_key === canonicalKey || f.field_key === fieldKey
  );
  if (!field) continue;
  
  // ... rest of save logic (use fieldKey for storage to preserve index)
}
```

#### 3. Modify Load Logic (fetchData function)

Update the value extraction to preserve indexed keys when loading:

```text
// When building valuesMap, store using the original indexed key if present
// The JSONB structure should store the indexed key alongside the value
```

### Changes Summary

| Location | Change |
|----------|--------|
| `useDealFields.ts` | Add `getCanonicalKey()` helper function |
| `useDealFields.ts` (line ~225-230) | Update `fieldIdMap` building to include indexed variations |
| `useDealFields.ts` (line ~350-356) | Update save logic to resolve canonical keys |
| `useDealFields.ts` (line ~251-260) | Update load logic to handle indexed keys |

### Alternative Approach: Store Indexed Keys Directly

A simpler alternative is to **store the full indexed field key** as a string identifier in the JSONB, alongside the `field_dictionary_id`. This allows the system to:

1. Look up field metadata via canonical `field_dictionary_id`
2. Preserve the indexed relationship via stored field key
3. Load data back using the stored indexed key

This approach requires adding an `indexed_key` property to the JSONB structure:

```text
{
  "uuid-123": {
    "indexed_key": "lender1.first_name",  // NEW: preserve indexed key
    "value_text": "John",
    "value_number": null,
    "value_date": null,
    "value_json": null,
    "updated_at": "...",
    "updated_by": "..."
  }
}
```

## Impact

- **No database schema changes** - uses existing JSONB structure
- **No breaking changes** - backward compatible with existing data
- **Fixes both save and load** operations for multi-entity sections
- **Affects**: Borrower, Lender, Property, Co-Borrower sections (all indexed entities)
