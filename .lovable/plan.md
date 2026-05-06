# Fix: RE851D "Generation timed out (CPU limit exceeded)"

## Root cause

From the edge function logs:
- `Memory limit exceeded` immediately before shutdown
- `word/document.xml` is **~4 MB** for this RE851D job (5 properties)
- The slow stage isn't `processDocx` itself (601 ms). It's that **after** `processDocx`, there are **8 separate post-render safety passes**, and each one independently:
  1. `fflate.unzipSync(processedDocx)` (decompress full DOCX)
  2. Decode every content XML part
  3. Mutate `word/document.xml`
  4. `fflate.zipSync(rezip)` (recompress full DOCX)

Confirmed unzip/zip pairs in `supabase/functions/generate-document/index.ts`:

```
4377 / 4597   owner-occupied
4632 / 4874   multiple-properties
4913 / 5100   remain-unpaid
5132 / 5311   cure-delinquency
5341 / 5520   60-day delinquent
5551 / 5729   encumbrance-of-record YES/NO
5748 / 6012   encumbrance value cells + balloon glyphs
```

That's **7 full unzip + zip cycles on a 4 MB ZIP**, on top of the initial `processDocx` cycle. With a 4 MB document.xml each cycle costs hundreds of ms of CPU and a fresh ~30 MB working set in fflate buffers + decoded strings + rewritten strings. On the 5-property RE851D this exceeds the edge function's CPU/memory budget — exactly what the log shows.

The other RE851D template (≤2 properties) succeeds because document.xml is much smaller, so the 7× cost stays under the limit.

## Fix (minimal, behavior-preserving)

Wrap **all RE851D post-render safety passes** into a **single unzip → mutate → rezip** cycle.

### File to change
`supabase/functions/generate-document/index.ts` only.

### Approach

1. After the existing `processDocx(...)` call (~line 4340), if the template is RE851D, do **one** `fflate.unzipSync(processedDocx)` and decode each content part (`word/document.xml`, headers, footers) **once** into a `Map<filename, string>` of mutable XMLs.
2. Refactor each of the 7 post-render passes into a small helper `mutateXml(filename, xml) => xml` that reads/writes from this in-memory map instead of unzipping/rezipping. The XML-mutation logic inside each pass stays **byte-for-byte identical** — only the surrounding "load XML / save XML" plumbing changes.
3. After all passes run, do **one** `fflate.zipSync(...)` to produce the final `processedDocx`.
4. Preserve every existing log line and `try/catch` boundary so a failure in one pass still falls through to the next (current behavior).
5. Non-RE851D templates: no change at all.

### Why this fixes the timeout

- Eliminates 6 of 7 redundant unzip/zip cycles on a 4 MB ZIP → cuts post-render CPU by ~85%.
- Eliminates 6 of 7 4 MB string decode/encode round-trips → resolves `Memory limit exceeded`.
- Single rezip at the end means total post-render work scales with mutation count, not pass count.

### What is NOT changing

- No change to merge-tag resolution, field publishers, region detection, or the per-pass mutation logic.
- No change to non-RE851D templates.
- No change to `processDocx`, `tag-parser.ts`, `docx-processor.ts`.
- No change to UI, schema, dictionary, RLS, or APIs.
- Output document content is identical; only the build pipeline is consolidated.

### Acceptance

- The 5-property RE851D job that currently fails with "Generation timed out (CPU limit exceeded)" completes successfully.
- Log lines `[generate-document] RE851D post-render … safety pass: N pairs forced in word/document.xml` still appear with the same counts.
- Existing 1–3 property RE851D outputs are byte-equivalent (same checkbox states, same encumbrance cells).
