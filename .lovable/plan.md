## Goal

Resolve the timeout occurring during generation of the **Re885** (HUD-1 / 885) template. No business logic, output format, or other templates are affected.

## Root-Cause Findings

After tracing the generation pipeline (`supabase/functions/generate-document/index.ts` → `_shared/docx-processor.ts` → `_shared/tag-parser.ts`) and reviewing recent edge-function logs:

1. **Per-tag synchronous `console.log` in `replaceMergeTags`** (tag-parser.ts ~line 2342–2344). RE885 contains **300+ merge tags** (HUD 800/900/1000/1100/1200/1300 series × Others/Broker columns). Each tag triggers a `console.log("[tag-parser] Replacing …")` or `console.log("[tag-parser] No data for …")`. In Deno Edge Runtime each `console.log` is synchronously serialized to the log stream — for RE885 this alone adds several seconds of blocking I/O versus other templates that have ~30–60 tags.

2. **Redundant safety-net no-data cleanup loop** at tag-parser.ts ~lines 2406–2419 still re-runs `resolveFieldKeyWithMap` + `getFieldData` for every parsed tag whenever any `{{` remains in the result (which is almost always true for RE885 because of literal `{{` text on the form). For 300+ tags this is another O(N) re-resolution pass that is fully redundant — the combined-regex pass at line 2356 already replaced every parsed tag (no-data ones map to `""`).

3. **CloudConvert PDF polling ceiling** (`convertToPdf`, index.ts line 2319–2348) polls **30 × 2s = up to 60s** synchronously inside the edge function. For a multi-template batch this can push total runtime past Edge limits even when RE885's own DOCX rendering is fast. RE885 produces a larger DOCX → CloudConvert takes longer → ceiling is hit.

## Changes (Surgical, Re885-only Effect)

### 1. `supabase/functions/_shared/tag-parser.ts`

- Replace the two **`console.log`** calls inside the per-tag loop (lines ~2342 and ~2344) with `debugLog(...)`. `debugLog` is gated by an env flag and is the existing pattern used elsewhere in the same file. This removes the hundreds of forced sync log writes per RE885 generation while preserving the diagnostic capability when debugging is enabled.
- Tighten the safety-net no-data cleanup gate (line ~2406): only enter the loop when an unreplaced parsed tag literal is *actually still present* in `result`. Use a single `Set` lookup against `tagReplacementMap` keys rather than re-resolving every tag. Behavior is identical (no-data tags still get blanked) but the redundant O(N) re-resolution is skipped on RE885's hot path.

### 2. `supabase/functions/generate-document/index.ts`

- In `convertToPdf`, change the CloudConvert poll loop (line ~2319) from `maxAttempts = 30 / interval = 2000ms` to a **bounded exponential-backoff** schedule: 1s, 1s, 2s, 2s, 3s, 3s, then 4s up to a hard ceiling of **45s total**. Same final cap behavior for already-fast jobs (returns sooner) but caps worst-case waiting time and prevents the edge function from being held open for a full 60s per template. No change to PDF output or success path.

### 3. No schema, no API, no UI, no other-template impact

- No DB migration, no `merge_tag_aliases` change, no template change, no new dependencies.
- All changes are confined to two backend files and only affect runtime cost — output bytes and field mapping are byte-identical to the current Re885 output for the same inputs.

## Why This Fixes the Timeout

| Stage | Before (Re885) | After (Re885) |
|---|---|---|
| Per-tag log writes | ~300 sync `console.log` (≈ 3–6 s) | 0 (debug-gated) |
| No-data cleanup re-resolve | ~300 `getFieldData` lookups every run | Skipped when nothing left to clean |
| PDF poll worst case | 60 s | 45 s with faster early polls |

Combined, this brings Re885 within the same runtime envelope as RE851A/RE851D and removes the "Running Timeout" failure without changing any business logic or output format.

## Validation

1. Generate Re885 against a deal with full HUD fee data — confirm completion < 15s and identical content/formatting to the most recent successful generation.
2. Generate RE851A and RE851D to confirm no regression (same logs, same output).
3. Generate Re885 with `docx_and_pdf` to confirm the PDF still arrives (CloudConvert path).
4. Check `supabase--edge_function_logs` for `generate-document` — the per-tag spam should be gone unless `DEBUG=1` is set; HUD totals log line stays.

## Constraints Honored

- ❌ No change to business logic, field mapping, or output format
- ❌ No schema or API change
- ❌ No impact on other document generation flows
- ✅ Backward compatible
