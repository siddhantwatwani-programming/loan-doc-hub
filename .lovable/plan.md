
# Application Performance Optimization

## Root Cause Analysis

After thorough code analysis, the following performance bottlenecks have been identified:

### Critical Issues

1. **N+1 Query Problem in External Modification Detector** (`useExternalModificationDetector.ts`)
   - Lines 112-139: For every field value in `deal_section_values`, the hook makes **individual** database queries for `user_roles` and `profiles` tables inside a loop
   - A deal with 100 field values triggers 200+ sequential database calls on mount
   - This runs for **every open workspace file** simultaneously

2. **Duplicate Field Dictionary Fetches** (`useDealFields.ts`)
   - The hook calls `resolveAllFields()` or `resolvePacketFields()` which fetches the entire `field_dictionary` table
   - Then immediately fetches `field_dictionary` **again** (lines 259-266) for TMO tab sections
   - Each open workspace file duplicates these calls

3. **No Caching of Shared Data**
   - `fetchFieldVisibility()` in `useFieldPermissions` fetches the entire `field_dictionary` on every mount
   - Field dictionary data is identical across all open deals but fetched independently per file
   - With 3 open files, field_dictionary is fetched 6-9 times on load

4. **Keep-Alive Multiplied API Calls**
   - The workspace Keep-Alive architecture mounts ALL open deal components simultaneously
   - Each mounted `DealDataEntryInner` independently runs: `useDealFields`, `useEntryOrchestration`, `useExternalModificationDetector`, `useFieldPermissions`
   - With 5 open files, this means 20+ parallel hook instances making 50+ API calls on load

5. **Duplicate React Key in ChargesTableView** (`ChargesTableView.tsx` lines 68-69)
   - `accruedInterest` column is defined twice in `DEFAULT_COLUMNS`, causing the React key warning visible in console logs
   - Causes React reconciliation issues

### Secondary Issues

6. **Unnecessary Realtime Subscriptions** - `useEntryOrchestration` creates a realtime channel per open deal file, even for internal CSR users who don't need participant orchestration

7. **AbortError from concurrent Supabase calls** - The "signal is aborted without reason" error in console is caused by too many simultaneous Supabase requests being created and canceled

## Optimization Plan

### Fix 1: Batch Queries in External Modification Detector
**File:** `src/hooks/useExternalModificationDetector.ts`

Replace the N+1 loop (individual queries per field) with batch queries:
- Collect all unique `updated_by` user IDs from field values
- Make ONE query to `user_roles` for all user IDs
- Make ONE query to `profiles` for external user IDs only
- Process results in memory

This reduces 200+ queries to 3 queries per deal.

### Fix 2: App-Level Field Dictionary Cache
**New file:** `src/hooks/useFieldDictionaryCache.ts`

Create a shared cache using React Context that:
- Fetches field_dictionary ONCE at app level
- Provides cached data to all `useDealFields`, `useFieldPermissions`, and `useExternalModificationDetector` instances
- Uses a simple "fetch once, share everywhere" pattern with `useRef` to prevent duplicate fetches
- Exposes `fieldDictionary`, `fieldVisibility`, and loading state

**File:** `src/components/layout/AppLayout.tsx`
- Wrap content with `FieldDictionaryCacheProvider`

### Fix 3: Use Cache in useDealFields
**File:** `src/hooks/useDealFields.ts`

- Accept cached field dictionary data as parameter or from context
- Remove the duplicate TMO tab sections fetch (lines 259-266) by using cached data
- Only fetch deal-specific data (`deal_section_values`, `packet_templates`, `template_field_maps`)

### Fix 4: Use Cache in useFieldPermissions
**File:** `src/hooks/useFieldPermissions.ts`

- Use the shared field dictionary cache instead of calling `fetchFieldVisibility()` independently
- Eliminates redundant `field_dictionary` fetch per component mount

### Fix 5: Fix Duplicate Key in ChargesTableView
**File:** `src/components/deal/ChargesTableView.tsx`

- Remove the duplicate `accruedInterest` entry from `DEFAULT_COLUMNS` (line 69)
- This fixes the React key warning in console

### Fix 6: Skip Unnecessary Hooks for Internal Users
**File:** `src/hooks/useEntryOrchestration.ts`

- Early-return with default state for internal (CSR/admin) users
- Skip the realtime subscription for internal users since they don't need participant orchestration
- This eliminates unnecessary database queries and realtime channels

### Fix 7: Lazy-Initialize External Modification Detector
**File:** `src/hooks/useExternalModificationDetector.ts`

- Skip fetching for non-active workspace files (pass an `enabled` flag)
- Only fetch when the file tab becomes active

**File:** `src/pages/csr/DealDataEntryPage.tsx`
- Pass `enabled` flag based on whether the file is the active workspace file

## Technical Details

### Field Dictionary Cache Structure
```text
FieldDictionaryCacheProvider
  |-- Fetches field_dictionary ONCE
  |-- Stores: Map<id, FieldDictEntry>, Map<field_key, FieldVisibility>
  |-- Consumers:
       |-- useDealFields (skip redundant fetch)
       |-- useFieldPermissions (skip redundant fetch)
       |-- useExternalModificationDetector (field_key lookup)
```

### Performance Impact Estimate
```text
Before (3 open files):
  field_dictionary fetches: ~9 calls
  External mod detector: ~600 calls (200 per file)
  Realtime channels: 3
  Total API calls on load: ~620+

After (3 open files):
  field_dictionary fetches: 1 call (cached)
  External mod detector: ~9 calls (3 batched per file)
  Realtime channels: 0 (CSR users)
  Total API calls on load: ~15
```

### Files Created
1. `src/hooks/useFieldDictionaryCache.ts` - Shared cache provider and hook

### Files Modified
1. `src/hooks/useExternalModificationDetector.ts` - Batch queries, add enabled flag
2. `src/hooks/useDealFields.ts` - Use cached field dictionary, remove duplicate fetch
3. `src/hooks/useFieldPermissions.ts` - Use cached field dictionary
4. `src/hooks/useEntryOrchestration.ts` - Early-return for internal users
5. `src/components/deal/ChargesTableView.tsx` - Remove duplicate column key
6. `src/components/layout/AppLayout.tsx` - Add cache provider
7. `src/pages/csr/DealDataEntryPage.tsx` - Pass enabled flag to external mod detector

### No Changes To
- Database schema or tables
- RLS policies
- Edge functions
- UI layout or component structure
- Save/update APIs
- Existing form components or field rendering
