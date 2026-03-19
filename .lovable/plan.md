

# Fix: Template Dropdown Rendering Behind Modal

## Problem
The `SelectContent` dropdown in the "Manage Templates" dialog renders behind the modal overlay due to z-index stacking.

## Solution
Add a high z-index class and portal container to the `SelectContent` component on line 435 of `PacketManagementPage.tsx`.

### Change
**File: `src/pages/admin/PacketManagementPage.tsx` (line 435)**

Update:
```tsx
<SelectContent>
```
To:
```tsx
<SelectContent className="z-[200] bg-background border-border">
```

This follows the project's established z-index layering standard where dropdowns within modals use `z-[200]` to appear above dialog overlays (`z-[60]`).

No other files or logic are modified.

