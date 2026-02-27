

## Plan: Sidebar Collapsed Mode — Logo-Only Display & Search Icon Expand

### 1. Show only the logo in collapsed mode (match attached screenshot)
**File: `src/components/layout/AppSidebar.tsx` (lines 183-210)**
- In collapsed mode, the logo container should center the logo mark without excess padding or the X button (already hidden).
- Adjust collapsed logo sizing to show the circular "PL" logo mark clearly: keep `h-8 w-auto max-w-[40px]` but ensure the container centers it properly. The current implementation already does this — no change needed for logo display.

### 2. Search icon click expands sidebar when collapsed
**File: `src/components/layout/AppSidebar.tsx` (line 241)**
- Add `onClick={toggleSidebar}` to the collapsed search icon button so clicking it expands the sidebar.

**Change at line 241:**
```
<button className="sidebar-item w-full justify-center px-2" onClick={toggleSidebar}>
```

### No other files modified
- No backend changes needed (no new fields to persist)
- No database or schema changes

