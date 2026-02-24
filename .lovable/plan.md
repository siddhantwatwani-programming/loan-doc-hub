

# Multi-File Workspace Tabs for CSR Portal

## Overview
Implement a persistent, browser-tab-like workspace system that allows CSRs to open up to 10 deal files simultaneously, switch between them instantly without data loss, and manage unsaved changes with proper confirmation dialogs.

## Architecture

```text
+---------------------------------------------+
|  AppHeader (user info, theme, logout)        |
+---------------------------------------------+
|  WorkspaceTabBar (file tabs with close btns) |
|  [Dashboard] [DL-2026-0120 x] [DL-2026-0121 x] |
+---------------------------------------------+
|  AppSidebar  |  Active File Content          |
|              |  (all open files rendered,    |
|              |   inactive ones hidden)       |
+---------------------------------------------+
```

## Implementation Steps

### Step 1: Create WorkspaceContext
**New file:** `src/contexts/WorkspaceContext.tsx`

Global state store managing:
- `openFiles[]` - array of `{ id, dealNumber, dealState, productType, openedAt }`
- `activeFileId` - currently active file ID
- `fileStates{}` - per-file cached state (isDirty flag tracked via useDealFields)
- Functions: `openFile()`, `closeFile()`, `switchToFile()`, `setFileDirty()`, `getFileDirty()`
- Max 10 file limit enforcement
- State resets on logout only (no sessionStorage persistence -- resets on browser refresh per spec)

### Step 2: Create WorkspaceTabBar Component
**New file:** `src/components/layout/WorkspaceTabBar.tsx`

- Rendered inside AppLayout, between AppHeader and main content
- Shows a "Dashboard" tab (always present, not closeable)
- Shows one tab per open file displaying deal_number
- Each file tab has a close (X) button
- Active tab: blue background, bold text
- Inactive tab: light grey background
- Dirty indicator: bullet (bullet) on tabs with unsaved changes
- Clicking a tab calls `switchToFile()` and navigates to `/deals/:id/edit`
- Clicking Dashboard navigates to `/dashboard`

### Step 3: Create Close Confirmation Dialog
**New file:** `src/components/workspace/CloseConfirmationDialog.tsx`

Modal shown when closing a tab with unsaved changes:
- Title: "Do you want to save changes before leaving?"
- Buttons: "Save & Close", "Discard", "Stay"
- "Save & Close" triggers saveDraft, then closes
- "Discard" closes without saving
- "Stay" cancels the close action

### Step 4: Create Save Confirmation Dialog
**New file:** `src/components/workspace/SaveConfirmationDialog.tsx`

Modal shown when clicking "Save Draft" (only if unsaved changes exist):
- Title: "Do you want to save changes?"
- Buttons: "Yes", "No"
- "Yes" proceeds with save
- "No" cancels

### Step 5: Create Max Files Warning Dialog
**New file:** `src/components/workspace/MaxFilesDialog.tsx`

Modal shown when trying to open an 11th file:
- Message: "You can open up to 10 files. Please close one before opening another."
- Buttons: "Close a file", "Cancel"

### Step 6: Create WorkspaceFileRenderer Component
**New file:** `src/components/workspace/WorkspaceFileRenderer.tsx`

Uses the Keep-Alive pattern:
- Renders ALL open file DealDataEntryPage components simultaneously
- Each wrapped in its own DealNavigationProvider
- Inactive files are hidden via CSS (`display: none` / `hidden` class)
- Active file is visible
- Components stay mounted, preserving all state (form data, scroll, sub-tabs, filters)

### Step 7: Modify AppLayout
**File:** `src/components/layout/AppLayout.tsx`

- Wrap children with `WorkspaceProvider`
- Add `WorkspaceTabBar` below AppHeader
- Adjust main content `pt` to account for tab bar height (~40px more)
- When workspace has open files and active file, render `WorkspaceFileRenderer` instead of `<Outlet />` for deal edit routes
- `<Outlet />` still used for non-deal routes (Dashboard, admin pages, etc.)

### Step 8: Modify DealDataEntryPage Save Flow
**File:** `src/pages/csr/DealDataEntryPage.tsx`

- Import and use `useWorkspace()` context
- When opening a deal (on mount), call `openFile()` to register in workspace
- Track dirty state: call `setFileDirty(id, isDirty)` whenever `isDirty` changes
- Wrap "Save Draft" button click with save confirmation dialog (show only if `isDirty`)
- After successful save, call `setFileDirty(id, false)`

### Step 9: Modify DealsPage Navigation
**File:** `src/pages/csr/DealsPage.tsx`

- When CSR clicks "Enter Data" on a deal, call `openFile()` from workspace context
- If 10 files already open, show MaxFilesDialog instead of navigating
- On successful open, navigate to `/deals/:id/edit`

### Step 10: Modify DealOverviewPage Navigation
**File:** `src/pages/csr/DealOverviewPage.tsx`

- Same workspace integration for "Enter Data" button
- Check file limit before opening

### Step 11: URL Sync
- Active file route stays as `/deals/:id/edit`
- Switching tabs updates the URL via `navigate()`
- Dashboard tab navigates to `/dashboard`
- Sub-tab state preserved via existing DealNavigationContext (sessionStorage)

## Technical Details

### WorkspaceContext Interface
```text
interface OpenFile {
  id: string;
  dealNumber: string;
  state: string;
  productType: string;
  openedAt: number;
}

interface WorkspaceState {
  openFiles: OpenFile[];
  activeFileId: string | null;
  dirtyFiles: Set<string>;
  openFile(file: OpenFile): boolean;  // returns false if at limit
  closeFile(id: string): void;
  switchToFile(id: string): void;
  setFileDirty(id: string, dirty: boolean): void;
  isFileDirty(id: string): boolean;
  isAtLimit(): boolean;
}
```

### Keep-Alive Rendering Strategy
All open DealDataEntryPage instances remain mounted. Only CSS visibility toggles. This means:
- No refetching data on tab switch
- No form state loss
- No scroll position reset
- Instant switching
- Sub-tab state preserved (DealNavigationContext per deal)

### Layout Height Adjustment
- AppHeader: 48px (h-12)
- WorkspaceTabBar: ~40px (h-10)
- Main content padding-top increases from `pt-12` to `pt-[88px]` (or similar)
- WorkspaceTabBar positioned fixed below header with matching left offset for sidebar

### Files Created
1. `src/contexts/WorkspaceContext.tsx`
2. `src/components/layout/WorkspaceTabBar.tsx`
3. `src/components/workspace/CloseConfirmationDialog.tsx`
4. `src/components/workspace/SaveConfirmationDialog.tsx`
5. `src/components/workspace/MaxFilesDialog.tsx`
6. `src/components/workspace/WorkspaceFileRenderer.tsx`

### Files Modified
1. `src/components/layout/AppLayout.tsx` - Add WorkspaceProvider, TabBar, and FileRenderer
2. `src/components/layout/AppHeader.tsx` - Adjust z-index if needed
3. `src/pages/csr/DealDataEntryPage.tsx` - Register with workspace, dirty tracking, save confirmation
4. `src/pages/csr/DealsPage.tsx` - Workspace-aware file opening
5. `src/pages/csr/DealOverviewPage.tsx` - Workspace-aware file opening

### No Changes To
- Database schema
- APIs or edge functions
- Existing UI components (forms, sub-navigation, field inputs)
- DealNavigationContext (continues to handle sub-tab persistence)
- useDealFields hook (unchanged)
- Sidebar, theme, auth contexts

