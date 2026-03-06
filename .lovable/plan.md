

## Analysis

The application has **no auto-reload logic**. The reloads the user experiences when switching browser tabs are caused by **Vite HMR in the Lovable preview environment**, not by application code.

However, there is one application-level behavior triggered on tab switch: the `visibilitychange` and `pagehide` event listeners in `DealDataEntryPage.tsx` (lines 304-324) that auto-save drafts when the tab becomes hidden. While this doesn't cause a reload, it does trigger network requests on every tab switch, which combined with Vite HMR could contribute to instability. Per the user's confirmation, these handlers should be disabled.

The unsaved data is already protected by the `sessionStorage` cache in `useDealFields`, so removing background auto-save will not cause data loss.

## Plan

### 1. Remove visibilitychange and pagehide handlers from DealDataEntryPage.tsx

**File**: `src/pages/csr/DealDataEntryPage.tsx`

Remove the `useEffect` block (lines 304-324) that registers `visibilitychange` and `pagehide` event listeners. Also remove the `persistDraftOnBackground` callback (lines 289-302) and the related refs/variables (`shouldHandleBackgroundPersist` at line 264, `isDirtyRef`, `savingRef`, `isActiveRef` at lines 273-287) that are only used by these handlers.

No other functionality references these variables or handlers — they exist solely for the background auto-save feature.

### Files to modify
- `src/pages/csr/DealDataEntryPage.tsx` — Remove background persistence logic (lines 264, 273-324)

No database changes. No UI changes. No other files affected.

