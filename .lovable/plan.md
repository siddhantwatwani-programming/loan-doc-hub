

# Performance Optimization & File Handling Fix

## Root Cause Analysis

### Issue 1: "File Not Found" Error
When opening more than 2 files, the `DealDataEntryInner` component calls `workspace.openFile()` inside `fetchDeal()` (line 142-150 of DealDataEntryPage.tsx). This is called on every mount, including when the workspace already has the file open. The real "File Not Found" message comes from `DealOverviewPage` (line 276) when the deal query returns null -- but the actual problem is that `resolveAllFields()` and `resolvePacketFields()` make heavy DB calls that can fail under concurrent load from multiple open tabs, causing cascading errors.

### Issue 2: Slow Table/Section Loading
The `resolveAllFields()` and `resolvePacketFields()` functions in `requiredFieldsResolver.ts` fetch `field_dictionary` from the database **every time** they are called, completely bypassing the `FieldDictionaryCacheProvider`. With 3+ open files, this means 3+ redundant full-table fetches of `field_dictionary` on every load. This is the primary bottleneck.

### Issue 3: Tab Limit
The 10-tab limit is already implemented in `WorkspaceContext` and `DealsPage`. No changes needed.

## Implementation Plan

### Fix 1: Cache-Aware Field Resolution
**File:** `src/lib/requiredFieldsResolver.ts`

Add optional cache parameter to both `resolveAllFields()` and `resolvePacketFields()` so they can use the pre-fetched field dictionary data instead of querying the database.

- `resolveAllFields(cachedEntries?)` -- if cache is provided, use it instead of fetching `field_dictionary`
- `resolvePacketFields(packetId, cachedEntries?)` -- after fetching `template_field_maps` (deal-specific), use cache for `field_dictionary` lookups instead of a separate DB query

This eliminates the largest redundant query per open file.

### Fix 2: Pass Cache into useDealFields
**File:** `src/hooks/useDealFields.ts`

Update `fetchData()` to pass the cached field dictionary entries into `resolveAllFields()` and `resolvePacketFields()`, so those functions skip their own `field_dictionary` fetch when cache is available.

### Fix 3: Prevent Duplicate openFile Calls
**File:** `src/pages/csr/DealDataEntryPage.tsx`

In `fetchDeal()`, the `workspace.openFile()` call at line 142-150 re-registers the file on every fetch (including re-fetches after save). Add a guard to only call `openFile()` if the file is not already in the workspace's `openFiles` array.

### Fix 4: Debounce fetchData in useDealFields
**File:** `src/hooks/useDealFields.ts`

Add a guard to prevent `fetchData()` from running while a previous fetch is still in progress (use a ref-based `isFetching` flag). This prevents duplicate concurrent fetches when the component re-renders rapidly.

## Technical Details

### resolveAllFields with Cache

```text
Before: resolveAllFields() -> fetches ALL field_dictionary rows from DB
After:  resolveAllFields(cachedEntries?) -> uses cachedEntries if provided, skips DB fetch
```

### resolvePacketFields with Cache

```text
Before: 
  1. Fetch packet_templates (deal-specific, needed)
  2. Fetch template_field_maps (deal-specific, needed)  
  3. Fetch field_dictionary by IDs (REDUNDANT with cache)

After:
  1. Fetch packet_templates (deal-specific, needed)
  2. Fetch template_field_maps (deal-specific, needed)
  3. Lookup field_dictionary entries from cache map (zero DB calls)
```

### Performance Impact

```text
Before (3 open files, no packet):
  resolveAllFields: 3 full field_dictionary fetches
  TMO tab sections: 3 more fetches (or cache hit)
  Total field_dictionary queries: 3-6

After (3 open files, no packet):
  resolveAllFields: 0 fetches (all from cache)
  TMO tab sections: 0 fetches (from cache)
  Total field_dictionary queries: 0
```

## Files Modified

1. `src/lib/requiredFieldsResolver.ts` -- Add optional cache parameter to resolveAllFields and resolvePacketFields
2. `src/hooks/useDealFields.ts` -- Pass cache into resolver functions, add fetch guard
3. `src/pages/csr/DealDataEntryPage.tsx` -- Guard duplicate workspace.openFile() calls

## No Changes To

- Database schema or tables
- RLS policies
- Edge functions
- UI layout or component structure
- WorkspaceContext, WorkspaceTabBar, or confirmation dialogs
- Existing save/update APIs
- Existing form components

