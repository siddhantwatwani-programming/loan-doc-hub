

## Plan: Remove "No Role Assigned" Flash on Login

### Problem
After login, the auth state resolves before the role is fetched (async call to `user_roles` table). During that brief window, `user` is set but `role` is still `null`, triggering the "No Role Assigned" message block in `AppLayout.tsx`.

### Fix
**File: `src/components/layout/AppLayout.tsx` (lines 150-161)**

Replace the "No Role Assigned" block with the same loading spinner used for the `loading` state. This way, while the role is being fetched, the user sees a spinner instead of an error message.

```tsx
if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
```

### No other changes
- No database, schema, or API changes
- No UI layout or component changes
- No route changes

