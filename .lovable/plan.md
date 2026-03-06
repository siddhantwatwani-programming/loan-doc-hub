

## Analysis

After exhaustive search of the entire codebase, **there is no application-level auto-reload logic**:

- No `window.location.reload()`, `location.reload()`, or `location.href` reassignment
- No `setInterval` or `setTimeout` with reload behavior
- No polling mechanisms
- `refetchOnWindowFocus` is already set to `false` in the QueryClient config
- No `visibilitychange` handler that triggers reloads (the one in DealDataEntryPage only persists drafts on background, it does not reload)

### What IS happening

The "automatic reloads" are caused by **Vite's Hot Module Replacement (HMR)** — when Lovable pushes code changes to the project, Vite detects file changes and performs a full page reload (when it can't do a hot update). This is a development-environment behavior, not application code.

The realtime subscriptions (e.g., `DealsPage` subscribing to `deals` table changes) do **silent background data refetches**, not page reloads. These are working correctly.

### Recommendation

**There are no code changes to make.** The application does not contain any auto-reload logic. The reloads observed are from:

1. **Vite HMR** — triggered when code is edited/saved in Lovable (development only; will not happen in production/published builds)
2. **Browser-level behavior** — the preview iframe may reload when Lovable's build system detects changes

The `hmr.overlay: false` is already configured in `vite.config.ts` (line 13), which suppresses the error overlay but doesn't prevent HMR reloads.

### What's already protected

- Session storage preserves workspace tabs (`WorkspaceContext`)
- Session storage preserves deal navigation state (`DealNavigationContext`)  
- Session storage preserves unsaved form values (`useDealFields` sessionStorage cache — recently added)
- `hasLoadedRef` guards prevent unnecessary refetches on tab switches

**No code changes are needed.** The application state is already well-preserved across navigation, and there is no auto-reload code to disable. The reloads the user sees are from the Lovable development environment's build system, which does not affect production deployments.

