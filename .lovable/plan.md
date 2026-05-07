## Plan to fix RE851D CPU timeout

I will optimize only the RE851D generation path in `supabase/functions/generate-document/index.ts` and, if needed, add a small RE851D-specific fast path in the shared DOCX tag parser. No UI, CSR data, or database schema changes.

## What I found

Recent logs show RE851D reaches the render/post-render stage and then exceeds the CPU limit:

- `processDocx` render itself is about 530ms, with `conditionalBlocks` as the largest parser phase.
- The function then runs many RE851D post-render passes over the same ~3.9MB `word/document.xml`.
- Several post-render questionnaire passes scan all 5 anchors but report `missing/duplicate controls`, meaning they are spending CPU without changing output.
- The existing code already caches unzip/zip, but it still repeats large XML scans, label/control searches, and property range calculations across separate passes.

## Implementation steps

1. **Add a single RE851D context object**
   - Compute template flags once: `isTemplate851D`, `isTemplate851A`, `isTemplate885`.
   - Build property indices, property count, property ranges, and common boolean values once.
   - Reuse these values for preprocessing and post-render safety logic instead of recomputing them in every pass.

2. **Consolidate RE851D post-render YES/NO safety passes**
   - Merge the four similar questionnaire passes into one bounded pass:
     - `remain unpaid`
     - `cure the delinquency`
     - `60 day(s) or more delinquent`
     - `encumbrances of record`
   - For each property range, scan only that local range/window once and queue rewrites in a shared rewrite list.
   - Reuse one common checkbox toggle helper instead of redefining it in each pass.
   - Preserve the same acceptance behavior: if controls are not present, skip safely; do not rewrite unrelated checkboxes.

3. **Keep owner-occupied and multiple-property fixes, but remove duplicated scans**
   - Reuse the shared visible-text projection and property ranges.
   - Avoid repeated text projection rebuilds after every skipped or no-op pass.
   - Only mark XML dirty when actual replacements are queued.

4. **Optimize RE851D `_N` preprocessing**
   - Build `Set`s for `RE851D_INDEXED_TAGS`, `PART1_TAGS`, and `PART2_TAGS` once outside hot offset checks.
   - Replace repeated `new Set(...)` construction in `resolveRegion()` with reused sets.
   - Keep the region-aware `_N` replacement behavior intact.

5. **Skip label-based fallback for RE851D when explicit merge tags are used**
   - RE851D output is driven by explicit merge tags plus targeted RE851D safety passes, not the generic label map.
   - Use an empty/effectively disabled label map for RE851D in `processDocx` unless the template has no merge markers.
   - This removes a full `labelReplace` scan over the 3.9MB XML while preserving targeted RE851D checkbox corrections.

6. **Add RE851D performance proof logs**
   - Log concise timings for:
     - `_N` preprocessing
     - `processDocx`
     - combined post-render pass
     - final flush/upload prep
   - Keep logs minimal so they help confirm the CPU reduction without adding meaningful overhead.

## Validation

After implementation, regenerate RE851D for deal `DL-2026-0235` and confirm logs show:

- No `CPU Time exceeded`.
- `RE851D Part1 rollup` values still publish correctly:
  - P1 remaining `324.00`, expected `0.00`, total `324.00`
  - P2 remaining `23423.00`, expected `48234.00`, total `71657.00`
  - P3 remaining `0.00`, expected `54567.00`, total `54567.00`
  - P4 remaining `0.00`, expected `0.00`, total `0.00`
- Generated DOCX uploads successfully.
- Other document templates remain unaffected because all changes are gated to RE851D.