

# Fix: Document Generation "CPU Time exceeded" for RE885 Template

## Root Cause

The edge function exceeds the **2-second CPU time limit** while processing the 628KB `word/document.xml`. The logs confirm the function boots, fetches data, downloads the template, begins XML processing, and then hits `CPU Time exceeded` during the tag-parser normalization phase. The generation_jobs record stays stuck in "running" status because the function is killed before it can update the record.

Previous "Success" entries in the job history are likely for smaller templates; this specific RE885 template (7 pages, 628KB XML, multiple complex tables) has always been too CPU-intensive for the synchronous pipeline.

Key CPU bottlenecks identified:
1. **`isConditionTruthy` entity-existence scan** (tag-parser.ts line 739-743): Calls `.toLowerCase()` on every key in `fieldValues` for EACH conditional check — O(n) per call with no caching
2. **Synchronous response blocking**: The entire generation must complete within the CPU budget before any response is sent, meaning a CPU kill = HTTP error + stale job record
3. **`processEachBlocks`** (tag-parser.ts line 972-979): Uses `new RegExp()` per entity scan instead of pre-built index

## Solution: Async Generation + CPU Optimization

### Part 1: Async Background Processing (generate-document/index.ts)

Refactor the main handler to:
1. Create the generation job record (already done)
2. **Return immediately** with `{ jobId, status: "running", results: [], successCount: 0, failCount: 0 }`
3. Use `EdgeRuntime.waitUntil()` to run the actual generation in the background
4. Background task updates the job record to "success" or "failed" when done
5. If CPU limit kills the background task, add a **stale job cleanup** — any job "running" for >120 seconds gets marked "failed"

The frontend already has **realtime subscriptions** on both `generation_jobs` and `generated_documents` tables, so it will automatically detect completion.

### Part 2: Frontend Adaptation (DealDocumentsPage.tsx)

Update `handleGenerate` to:
1. Accept the immediate "running" response as success (not an error)
2. Show toast: "Document generation started" instead of waiting for completion
3. Let the existing realtime subscription handle completion notification
4. Add a **stale job timeout**: if a job stays "running" for >2 minutes, show a "Generation may have timed out" indicator

### Part 3: CPU Optimization (tag-parser.ts)

Fix the remaining O(n) linear scan in `isConditionTruthy`:
- Reuse the `getLowerFieldValuesIndex()` from field-resolver.ts to build a lowercase key index once
- Replace the `for (const [k, v] of fieldValues.entries())` loop with a prefix scan against the pre-built index
- This eliminates thousands of redundant `.toLowerCase()` calls per conditional evaluation

### Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/generate-document/index.ts` | Wrap generation in `EdgeRuntime.waitUntil()`, return immediately, add stale job cleanup |
| `src/pages/csr/DealDocumentsPage.tsx` | Handle async "running" response, show start toast, add stale job timeout display |
| `supabase/functions/_shared/tag-parser.ts` | Optimize `isConditionTruthy` entity scan with cached lowercase index |

### What This Does NOT Change
- No database schema changes
- No template modifications
- No changes to field resolution logic, formatting, or DOCX processing pipeline
- No changes to other edge functions
- No UI layout changes

### Expected Impact
- Document generation requests return instantly (no more HTTP timeout errors)
- Large templates process in the background with full CPU budget available
- If CPU limit is still hit, the job is cleanly marked "failed" instead of stuck "running"
- Frontend shows real-time progress via existing realtime subscriptions

