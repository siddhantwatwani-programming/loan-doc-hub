
# Plan: Fix Activity Log Scroll Not Showing

## Problem Analysis
The Activity Log in the Deal Overview page is not showing a scrollbar when there are many entries. After investigating the code:

1. **Root Cause**: The `ActivityLogViewer` component uses Radix UI's `ScrollArea` with only `maxHeight` styling:
   ```tsx
   <ScrollArea style={{ maxHeight }} className="pr-4">
   ```

2. **Why It Fails**: Radix UI's ScrollArea requires an explicit `height` property (not just `maxHeight`) to properly calculate and display scrollbars. The internal `Viewport` component uses `h-full` which relies on the parent having a defined height.

## Solution
Modify the `ActivityLogViewer` component to properly enable scrolling by setting `height` in addition to `maxHeight`, or by adding `overflow-y-auto` to ensure the scroll behavior works correctly.

## Technical Details

### File to Modify
**`src/components/deal/ActivityLogViewer.tsx`** (line 295)

### Current Code
```tsx
<ScrollArea style={{ maxHeight }} className="pr-4">
```

### Updated Code
```tsx
<ScrollArea style={{ height: maxHeight, maxHeight }} className="pr-4">
```

This ensures:
- The ScrollArea has an explicit height that triggers the scrollbar when content exceeds it
- The `maxHeight` acts as a cap so the container doesn't grow beyond the specified value
- All activity log entries remain accessible via scrolling
- No logs are hidden or truncated

## Impact
- Only the `ActivityLogViewer` component is modified
- No changes to existing layout, log order, or styling
- The fix applies everywhere the component is used (currently `DealOverviewPage`)
