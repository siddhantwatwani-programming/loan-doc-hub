

## Analysis

Looking at the screenshot and code, I can identify two issues:

1. **Tab bar alignment**: The `WorkspaceTabBar` starts at `left-16` (collapsed) or `left-64` (expanded), which aligns with the main content area. But looking at the screenshot, the tab bar content appears to overlap with scrolling page content because `bg-muted/30` is semi-transparent — scrolled content shows through. Need to use a fully opaque background.

2. **Logo quality**: The logo has `drop-shadow-sm` and basic styling. For better appearance in both themes, I'll add a dark-mode invert filter or improve contrast, and increase the rendered size slightly for clarity.

## Plan

### 1. Fix WorkspaceTabBar background opacity and alignment
**File: `src/components/layout/WorkspaceTabBar.tsx`**
- Change `bg-muted/30` to `bg-background` so the tab bar has a fully opaque background that matches the app theme, preventing scrolled content from bleeding through.
- The `left-16`/`left-64` positioning already aligns with the sidebar edge (where search bar starts), so horizontal alignment is correct.

### 2. Improve logo appearance for both themes
**File: `src/components/layout/AppSidebar.tsx`**
- Increase logo height from `h-10` to `h-12` for better visibility.
- Add `dark:brightness-110 dark:contrast-110` classes to improve logo legibility in dark mode.
- Keep `drop-shadow-sm` and `object-contain` for clean rendering.

### Files to modify
- `src/components/layout/WorkspaceTabBar.tsx` (line 33: change `bg-muted/30` → `bg-background`)
- `src/components/layout/AppSidebar.tsx` (line 187: update logo classes)

