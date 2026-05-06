# Fix: RE851D generation timeout — eliminate per-pass XML decode/encode

## What's still slow

The earlier fix already reduced 7 unzip/zip cycles to 1. But each of the 7 RE851D safety passes still does, on the **same 4 MB `word/document.xml`**:

1. `new TextDecoder("utf-8").decode(bytes)` — full 4 MB byte→string decode
2. Iterates **every file in the ZIP** to populate a per-pass `rezip` map
3. Runs its regex scans
4. `new TextEncoder().encode(xml)` — full 4 MB string→byte encode (even when nothing changed in that pass)

7 passes × 4 MB decode + scan + encode = the remaining CPU spike. The "Generation timed out (CPU limit exceeded)" / `CPU Time exceeded` log confirms this — the unzip/zip cost is now negligible (`unzip=1ms zip=23ms` in the logs), but post-render passes never reach the final flush.

## Fix (single file: `supabase/functions/generate-document/index.ts`)

Promote the existing `__re851dPassCache` from a `Record<string, Uint8Array>` to a small object holding **both** the original bytes map AND a parallel **decoded-XML cache** (`Record<string, string>`) for content-bearing parts only (`word/document.xml`, `word/header*`, `word/footer*`).

### New helpers (replace `__passUnzip` / `__passZip`)

```text
__passLoadXml(filename):   string       // decode once, cache forever
__passSaveXml(filename, xml):           // store mutated string in cache, mark dirty
__passListContentParts(): string[]      // names of content-bearing parts, ordered
```

The cache is populated lazily on first `__passLoadXml` call. Subsequent passes reuse the **already-decoded string** — no re-decode, no re-encode, no per-pass file walk.

### Rewrite each of the 7 passes (mechanical)

For each pass currently shaped like:

```
const unzipped = __passUnzip(processedDocx);
const rezip = {};
for (filename, bytes of unzipped) {
  if (!isContent) { rezip[filename] = [bytes, {level:0}]; continue; }
  let xml = decoder.decode(bytes);
  ... mutate xml ...
  if (mutated) rezip[filename] = [encoder.encode(xml), {level:0}];
  else         rezip[filename] = [bytes, {level:0}];
}
if (didMutate) processedDocx = __passZip(rezip);
```

Replace with:

```
for (filename of __passListContentParts()) {
  let xml = __passLoadXml(filename);
  ... mutate xml ...   // EXACTLY the same mutation logic, byte-for-byte
  if (mutated) __passSaveXml(filename, xml);
}
```

The **mutation logic inside each pass is unchanged** — same regexes, same anchor detection, same rewrite ordering, same logs. Only the surrounding load/save plumbing changes.

### Final flush (already exists, ~line 6064)

The final `if (__re851dPassCache) { ... fflate.zipSync(...) }` block is updated to:
1. Re-encode the dirty XML strings back to bytes.
2. Merge with the untouched binary bytes from the original unzip.
3. `fflate.zipSync` once.

### Behavior preservation

- Per-pass `try/catch` boundaries kept — a failure in one pass still falls through to the next.
- All `[generate-document] RE851D … safety pass: N pairs forced in word/document.xml` log lines preserved.
- Non-RE851D templates: zero change.
- Output document content is byte-equivalent for working cases (1–2 properties).

### Why this fixes the timeout

- 7× full-XML decode → 1× decode total (cache hit on passes 2–7).
- 7× full-XML encode → 1× encode at the final flush (only for parts actually mutated).
- 7× `Object.entries(unzipped)` walk + per-file `rezip` map build → eliminated entirely.
- Net: post-render CPU on a 5-property RE851D drops by an estimated ~80% on top of the prior fix, well under the edge function budget.

## Out of scope

- No change to merge-tag resolution, field publishers, region detection, or per-pass mutation logic.
- No change to `processDocx`, `tag-parser.ts`, `docx-processor.ts`.
- No change to other templates, UI, schema, dictionary, RLS, APIs.
- No new database tables, no schema migration.

## Acceptance

- The 5-property RE851D job that currently fails with "Generation timed out (CPU limit exceeded)" completes successfully.
- All existing `[generate-document] RE851D … safety pass` log lines still appear with the same counts.
- Existing 1–3 property RE851D outputs are byte-equivalent (same checkbox states, same encumbrance cells, same Performed By mapping).
