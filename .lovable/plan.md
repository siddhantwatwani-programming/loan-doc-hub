

## Root Cause Analysis

The "File Not Found" error and data loss occur due to a **race condition between auth session recovery and Supabase queries**.

When the user navigates between pages (or the browser tab loses/regains focus), the `AuthContext` may experience a transient `SIGNED_OUT` event. During this brief window, the Supabase client's auth token is invalid. If a page component fires a query during this window:

1. **DealOverviewPage** (`/deals/:id`): The `fetchDealData` runs immediately on mount via `useEffect(() => { if (id) fetchDealData(); }, [id])`. If the session token is stale, RLS blocks the query → `deal` stays `null` → "File Not Found" is shown.

2. **DealDataEntryPage** (`/deals/:id/edit`): The `fetchDeal` function catches the error and calls `workspace.closeFile(id)` (line 171-172), which **removes the workspace tab entirely**, causing perceived "data loss". The user must re-login because the session eventually recovers but the UI is already in an error state.

### Fix: Two targeted changes

**1. `src/pages/csr/DealOverviewPage.tsx`** — Verify session before querying

Add a session check at the start of `fetchDealData`. If no valid session exists, retry once after a short delay (giving `AuthContext` time to recover the session). This prevents showing "File Not Found" during transient auth drops.

```typescript
const fetchDealData = async () => {
  try {
    // Ensure auth session is available before querying (prevents RLS failures during transient session drops)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // Wait briefly for session recovery, then retry once
      await new Promise(r => setTimeout(r, 1000));
      const { data: { session: retrySession } } = await supabase.auth.getSession();
      if (!retrySession) {
        // Still no session — don't show "File Not Found", just keep loading
        return;
      }
    }
    // ... existing fetch logic
```

**2. `src/pages/csr/DealDataEntryPage.tsx`** — Don't close workspace tabs on transient errors

In the `fetchDeal` catch block (lines 168-179), add a session check before closing the workspace file. If the error is due to a missing session, retry instead of destroying the tab.

```typescript
} catch (error) {
  console.error("Error fetching deal:", error);
  // Check if this is a transient auth issue before closing workspace tab
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    // Transient auth drop — retry after recovery delay
    await new Promise(r => setTimeout(r, 1500));
    const { data: { session: retrySession } } = await supabase.auth.getSession();
    if (retrySession) {
      // Session recovered — retry fetch
      hasFetchedDealRef.current = false;
      fetchDeal();
      return;
    }
  }
  // Only close workspace file if session is valid (real 404/permission error)
  if (workspace && workspace.openFiles.find(f => f.id === id)) {
    workspace.closeFile(id);
  } else {
    toast({ title: "Error", description: "Failed to load file", variant: "destructive" });
  }
}
```

### What this does NOT change
- No database/schema changes
- No UI layout changes
- No changes to auth flow, workspace persistence, or document generation
- The `AuthContext` session recovery mechanism remains unchanged

