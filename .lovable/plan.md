

## Root cause

The "false dirty dot" on freshly opened tabs comes from `src/hooks/useDealFields.ts` lines 548-563. On `fetchData()`:

1. DB values are loaded into `valuesMap`, then defaults from `field_dictionary.default_value` are merged in (lines 542-546).
2. `readSessionCache(dealId)` then re-applies any cached "dirty keys" from sessionStorage and **unconditionally calls `setIsDirty(true)`** if the cache has any dirty keys.

This causes false-positive dirty state in two scenarios:

- **Stale cache** — A previous tab/page lifecycle wrote dirty keys to `sessionStorage` (key `deal-values-<dealId>`) and was discarded/closed without clearing it (e.g. close-without-save discard, browser reload mid-edit, navigation away). Reopening the file blindly trusts the cache.
- **Identical values** — Even when cached "unsaved" values are byte-identical to what's now in DB (e.g. server already saved them, or another tab saved them), the code still marks every cached key dirty without comparing.

In both cases, the `useEffect` at `DealDataEntryPage.tsx:296-300` propagates `isDirty=true` into `WorkspaceContext.setFileDirty`, lighting up the tab's warning dot before the user has touched anything.

## Fix (single, surgical change)

In `src/hooks/useDealFields.ts`, replace the unconditional cache-restore block (lines 548-568) with a value-comparison restore:

- Build the merged values map (DB + defaults) — call this the canonical "saved snapshot".
- If there is a session cache, iterate its `dirtyKeys` and **only keep a key as dirty if `cached.unsavedValues[k] !== savedSnapshot[k]`**.
- Build the final `values` from the snapshot, overlaying only the truly-dirty cached values.
- Set `dirtyFieldKeys` to the filtered set; set `isDirty` to `filtered.size > 0`.
- If the filtered set is empty, call `clearSessionCache(dealId)` so the stale entry doesn't keep haunting future opens.
- Always set `savedValuesSnapshotRef.current` to the DB+defaults snapshot (unchanged behavior).

This preserves the legitimate "restore unsaved edits after refresh" UX and only suppresses the false-dirty case.

## Files touched

- `src/hooks/useDealFields.ts` — replace lines 548-568 with the comparison-aware restore described above. No other files, no schema/API/UI/tab-logic/save-workflow changes.

## Acceptance check (manual)

1. Open a fresh loan file → no dot.
2. Edit a field → dot appears.
3. Save → dot disappears.
4. Edit, close tab via Discard → reopen file → no dot (stale cache no longer falsely flagged; cache also cleared if values match DB).
5. Edit, hard-refresh browser → reopen file → dot still appears with values restored (legitimate recovery preserved).

