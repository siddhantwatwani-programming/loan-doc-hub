

# Fix: File Tab Scrolling, File Loading Errors & Performance Optimization

## Overview
Three interconnected issues are identified in the workspace system: horizontal tab scrolling not working properly, "Unable to load file" errors when opening multiple files, and degraded performance with multiple open files. Root causes traced to Radix ScrollArea limitations, concurrent API overload, and lack of deferred loading for inactive workspace files.

## Problem Analysis

### 1. Tab Bar Horizontal Scrolling
**Root Cause:** Radix UI's `ScrollArea` component applies `overflow: hidden` on its viewport and relies on its own virtual scrollbar rendering. This can fail silently with horizontally-expanding `min-w-max` content, making tabs beyond the visible area unreachable.

### 2. "Unable to load file" Errors
**Root Cause:** When multiple deal files are opened, ALL `DealDataEntryInner` instances mount simultaneously (keep-alive architecture). Each triggers `fetchDeal()` + `useDealFields.fetchData()` + `useExternalModificationDetector` concurrently. With 5-10 files, this creates 15-30+ simultaneous API calls, overwhelming the browser's connection pool and triggering `Failed to fetch` / timeout errors.

### 3. Performance Degradation
**Root Cause:** Every mounted (but hidden) file runs its full data-fetching lifecycle on mount. The `useDealFields` hook fetches field_dictionary (mitigated by cache), deal_section_values, and builds complex value maps for every open file simultaneously. The `saveDraft` function performs sequential per-section upserts which compounds when multiple files have unsaved changes.

## Implementation Plan

### Change 1: Replace Radix ScrollArea with Native Scrolling (WorkspaceTabBar.tsx)
Replace the `ScrollArea`/`ScrollBar` wrapper in the tab bar with a native `div` using `overflow-x-auto overflow-y-hidden` and custom scrollbar styling. Native browser horizontal scrolling is more reliable for this use case.

- Remove `ScrollArea` and `ScrollBar` imports
- Replace with a `div` that has `overflow-x-auto overflow-y-hidden` classes
- Add thin scrollbar styling via Tailwind utility classes

### Change 2: Deferred Loading for Inactive Workspace Files (useDealFields.ts)
Add an `active` parameter to `useDealFields` so that hidden (inactive) workspace files skip their initial data fetch until the user switches to them.

- Add `active: boolean` parameter (default `true`) to `useDealFields`
- Guard `fetchData` to only run when `active` is true
- When `active` transitions from false to true, trigger fetch if data hasn't loaded yet
- Pass `isActiveTab` from `DealDataEntryInner` to `useDealFields`

### Change 3: Deferred Deal Fetch for Inactive Files (DealDataEntryPage.tsx)
Similarly defer the `fetchDeal()` call in `DealDataEntryInner` until the file becomes the active workspace tab.

- Use the workspace context to determine if this file is the active tab
- Only call `fetchDeal()` when active or when first becoming active
- Show a lightweight skeleton/spinner for inactive-but-not-yet-loaded files

### Change 4: Batch Section Saves (useDealFields.ts)
The current `saveDraft` does sequential `maybeSingle()` + `update/insert` per section. Consolidate to reduce round-trips.

- Fetch all existing `deal_section_values` for the deal in a single query at the start of save
- Build all section payloads in memory
- Perform upserts using fewer sequential calls (group inserts together, group updates together)

### Change 5: Memoize Heavy Computations (DealDataEntryPage.tsx)
Wrap expensive computed values that recalculate on every render.

- Memoize the section tab rendering logic
- Ensure `computeCalculatedFields` doesn't re-trigger unnecessarily during save

## Files Modified

1. **`src/components/layout/WorkspaceTabBar.tsx`** - Replace ScrollArea with native overflow scrolling
2. **`src/hooks/useDealFields.ts`** - Add `active` parameter for deferred loading; batch save optimization
3. **`src/pages/csr/DealDataEntryPage.tsx`** - Pass `isActiveTab` to hooks; defer `fetchDeal`; memoize tab rendering
4. **`src/components/workspace/WorkspaceFileRenderer.tsx`** - Pass active state to children

## No Changes To
- Database schema, tables, or RLS policies
- Edge functions
- Existing save/update API patterns
- UI layout of forms, modals, or sections
- Document generation flow
- Any other components not listed above

