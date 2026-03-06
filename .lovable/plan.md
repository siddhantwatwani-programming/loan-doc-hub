

## Analysis

After thorough codebase review, the existing architecture already has defensive measures for tab switching:
- `forceMount` + CSS `hidden` on all `TabsContent` (line 945 of DealDataEntryPage)
- Centralized `values` state in `useDealFields` hook at the `DealDataEntryInner` level
- `hasLoadedRef` guard preventing refetches

However, there are scenarios where unsaved data can still be lost:
1. **Component unmount on page navigation** — When a CSR navigates via sidebar to Dashboard/other pages and back to the deal (if accessed via `/deals/:id/data` instead of workspace `/deals/:id/edit`)
2. **External user navigation** — External users don't have workspace; navigating away unmounts the page entirely
3. **Browser refresh / session loss** — `hasLoadedRef` resets, fetching fresh data from DB overwrites in-memory unsaved changes

## Plan

### 1. Add sessionStorage-backed unsaved values cache in `useDealFields`

**What**: Add a sessionStorage layer that persists unsaved field values as the user types, keyed by `deal-values-{dealId}`.

**How**:
- In `updateValue`, after updating React state, also write the changed value to a sessionStorage cache object
- In `fetchData`, after loading DB values, check if sessionStorage has cached unsaved values for this deal and merge them on top (unsaved changes take priority)
- In `saveDraft` (on success), clear the sessionStorage cache
- In `resetDirty`, clear the sessionStorage cache
- In `removeValuesByPrefix`, update the sessionStorage cache accordingly

This ensures that even if the component unmounts and remounts, unsaved changes are restored from sessionStorage.

### 2. Persist dirty field keys alongside cached values

**What**: Store the set of dirty field keys in the same sessionStorage entry so that on restore, the dirty state indicators (tab highlights, field highlights) are also restored accurately.

**How**:
- The sessionStorage entry will be: `{ unsavedValues: Record<string, string>, dirtyKeys: string[] }`
- On restore, rebuild `dirtyFieldKeys` Set and set `isDirty = true` if any keys exist

### Files to modify
- `src/hooks/useDealFields.ts` — Add sessionStorage read/write logic in `updateValue`, `fetchData`, `saveDraft`, `resetDirty`, and `removeValuesByPrefix`

No new files, no database changes, no UI changes. This is a data persistence layer addition only.

