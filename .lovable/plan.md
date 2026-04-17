

## Root cause (remaining)

The previous fix (value-comparison restore) helps with stale identical caches, but the dot still appears on opening DL-2026-0191 because of **key-format mismatches** between what the session cache stores and what the snapshot rebuilds.

In `src/hooks/useDealFields.ts` (lines 548–584):

- The "saved snapshot" (`valuesMap`) keys come from DB rows translated through `resolveDbKeyToLegacy(...)` plus prefix-reconstruction logic for multi-entity records (lines 487–535) and field defaults (line 542).
- The session cache's `dirtyKeys` are written by `updateValue` using **whatever key the UI component happened to pass in** — this can be a legacy dot key, a DB key, a prefixed multi-entity key, or a charge/insurance/notes pseudo-key (e.g. `charge.<id>.amount`).
- When those forms don't line up exactly (different prefix scheme, different canonical form, charge id rebuild, etc.), `valuesMap[cachedKey] ?? ''` returns `''` while `cached.unsavedValues[cachedKey]` is a real string → falsely "different" → file marked dirty on open with no user input.

The user's acceptance criterion is unambiguous: **"When a loan file is opened, it should always load in a clean state."** Trying to perfectly reconcile every key-format variant is fragile and risks regressions across 60+ updateValue call sites.

## Fix (single, surgical change)

In `src/hooks/useDealFields.ts`, replace the cache-restore block (lines 548–584) with a clean-load-only behavior:

- Always set `values` and `valuesRef.current` to the freshly rebuilt `valuesMap` (DB + defaults).
- Always set `savedValuesSnapshotRef.current` to the same `valuesMap`.
- Always set `dirtyFieldKeys = new Set()` and `setIsDirty(false)`.
- Always call `clearSessionCache(dealId)` on load so no stale entry can ever resurrect a phantom dirty state on subsequent opens.

This guarantees:
- Opening any loan file (including DL-2026-0191) loads clean — no dot.
- The dot only appears after a real `updateValue(...)` call from a user edit (existing logic at lines 600–636 unchanged).
- Save still clears dirty + cache (lines 1083–1087 unchanged).
- Tab switching never triggers dirty (no other code path sets dirty on mount).

### Trade-off acknowledged

The mid-edit hard-refresh "restore unsaved values" recovery path is removed. This is intentional and aligns with the user's explicit acceptance criteria. Save/discard workflow, tab logic, routing, schema, APIs, and UI components are untouched.

## Files touched

- `src/hooks/useDealFields.ts` — replace the cache-restore branch (current lines 548–584) with the clean-load behavior above. No other files modified.

## Acceptance check (manual)

1. Open DL-2026-0191 (and any other file) → no dot.
2. Edit a field → dot appears.
3. Save → dot disappears.
4. Switch between open file tabs → no random dots.
5. Reopen any previously-edited-and-discarded file → no dot.

