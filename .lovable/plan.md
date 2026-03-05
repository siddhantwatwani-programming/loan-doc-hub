

## Plan: Fix Loan Documents Page Unexpected Refresh

### Root Cause Analysis

After reviewing the `DealDocumentsPage.tsx` and related components, I identified these issues causing state resets:

1. **`fetchData()` resets loading state**: The `fetchData` function (line 231) sets `setLoading(true)` every time it's called — including after generation (line 394) and after template upload (line 580). When `loading` becomes `true`, the entire page unmounts and shows a spinner (lines 593-598), destroying all UI state (selections, scroll position, filters, form values). When loading finishes, everything remounts from scratch.

2. **Real-time subscription cascade**: The Supabase real-time channel (lines 196-227) calls `fetchGeneratedDocuments()` and `fetchRecentJobs()` on every database change event. While these don't set `loading=true`, they update state that feeds into `useMemo` computations (line 462), causing unnecessary re-renders.

3. **`handleAllDocsClick` force-remount trick**: In `WorkspaceTabBar.tsx` (lines 22-28), when already on `/deals`, it appends a `_r=timestamp` search param to force a remount. If the user clicks "All Loan Documents" from the documents page, it navigates to `/deals`, unmounting the documents page entirely.

### Planned Changes

**File: `src/pages/csr/DealDocumentsPage.tsx`**
- Split `fetchData` into two flows:
  - **Initial load**: Sets `loading = true`, shows spinner, fetches everything — only on first mount.
  - **Refresh/reload**: Fetches data in the background WITHOUT setting `loading = true`, preserving all UI state.
- Update `handleGenerate` (line 394) and `handleTemplateUpload` (line 580) to call the background refresh instead of the full `fetchData`.
- Add a dedicated `handleRefresh` function for the Refresh button that also does a background data reload.
- Wrap real-time subscription callbacks with a guard to prevent rapid consecutive fetches (simple debounce/flag).

**No other files will be modified.** The WorkspaceTabBar behavior is standard navigation (clicking "All Loan Documents" should navigate to `/deals`), so it stays as-is.

### What This Fixes
- Clicking Generate → data refreshes silently, UI state preserved
- Clicking Upload → data refreshes silently, UI state preserved
- Real-time updates → data refreshes silently, no visible state reset
- Explicit Refresh button → controlled data reload, UI state preserved
- All other clicks (checkboxes, fields, sort buttons, tabs) → no data fetch triggered, state preserved

