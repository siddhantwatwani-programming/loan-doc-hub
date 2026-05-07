## Goal

RE851D currently fails Single Doc generation with `CPU Time exceeded`. The logs show the function runs ~10s wall, ~2s+ CPU before the kill — and Cloud's hard ceiling is ~2s CPU. Fix it without changing UI, schema, or other document templates.

Scope is strictly limited to `supabase/functions/generate-document/index.ts` for code paths gated by `/851d/i.test(template.name || "")`. No other template flow, no UI, no DB.

## Where the CPU is going (from logs + code review)

1. **`findAnchorOffsets` (line ~3537)** builds a per-character `strippedChars: string[]` and `map: number[]` over the entire `word/document.xml` (~4 MB) — that's 4M+ array pushes plus a 4M-entry collapsed-index map. Pure CPU + heap pressure, runs once per content part.
2. **Seven post-render "safety passes"** (Owner Occupied, Multiple Properties, Remain Unpaid, Cure Delinquency, 60-day, Encumbrance-of-Record, Encumbrance value injection) each re-walk `word/document.xml`:
   - rebuild a visible-text projection (now cached via `__getVisProj`, good)
   - run multiple `RegExp.exec` loops with `[\s\S]*?` patterns over multi-MB strings
   - call `xml.slice(...)` per match for nested control searches
   - several still independently rebuild fallback anchors when the cached projection is empty
3. **`_N` placeholder expansion (line 3927)** loops `tagsByLengthDesc` and runs a fresh `regex.exec` per tag over the full 4 MB XML. Already pre-filtered by `xml.includes`, but the inner `isConsumed` walks an unbounded `consumed: Array<[number,number]>` for every match — O(N×rewrites) on dense PROPERTY blocks.
4. **Tag-parser `conditionalBlocks=409ms`** is the single biggest first-render phase. RE851D is conditional-heavy (per-property `{{#if}}` blocks).

## Plan

### A. Replace per-character anchor projection with bulk segment slicing
In `findAnchorOffsets` (RE851D `_N` expansion, line ~3537):
- Stop building `strippedChars[]` + `map[]` per character.
- Build the same projection using the same compact-segment approach already used by `__getVisProj` (line ~4587): `Int32Array` for `txtStart`/`xmlStart`/`segLen` plus a binary-search `lookup`.
- Reuse the same projection for the PROP/PART anchor scan and the `_N` rewrite region resolver.

### B. Make `isConsumed` O(1)
In the `_N` rewrite loop (line ~3917):
- Track `consumed` as a sorted array of disjoint ranges and binary-search the start offset, OR
- Since longest-first ordering means overlapping shorter tags share the same start, drop the linear `consumed[]` scan and rely on the existing `consumedStarts: Set<number>` plus a separate small array only for slot/glyph tags whose suffixes legitimately differ in span.

### C. Share one projection across all 7 safety passes
- Move `__getVisProj` and the property-range computation above the first safety pass (already done) and ensure every pass that currently rebuilds fallback `propAnchors` reuses `__getVisProj(filename, xml).propAnchorsRaw` directly when available.
- Cache the per-pass `propRanges` array on the projection so each pass doesn't recompute it.

### D. Fast-skip safety passes that have nothing to do
Each pass already does an `xml.indexOf(...)` cheap-skip. Add the same guard to passes that currently fall through to the unzip/rezip even when the anchor text is missing in this particular DOCX (Owner Occupied, Multiple Properties, Encumbrance value injection). This avoids paying the projection cost on irrelevant content parts (`word/header*`, `word/footer*`).

### E. Reuse a single decoded XML string across passes
The `__xmlGet` cache exists. Audit the 7 passes and remove any leftover `decoder.decode(bytes)` calls that bypass the cache (e.g., `decoder2`, `decoder3`, `decoder4` locals are still declared but should not be used; verify and remove). Same for `encoder` calls — only the final flush should re-encode.

### F. Bound the BALLOON glyph regex window properly
The encumbrance value-injection pass (line ~6165) creates a fresh `RegExp` per anchor and runs `glyphRe.exec(slice)` with `[\s\S]*?` — fine on small slices, but verify `rawWinEnd - rawWinStart` is capped (currently `winVisStart + 600` chars in visible space → translate to a **raw byte cap of 4 KB max** to bound regex backtracking on dense XML).

### G. Tag-parser conditionalBlocks micro-pass
First-render `conditionalBlocks=409ms` is the largest single contributor. Without changing parser semantics:
- For RE851D, pre-strip the well-known per-property conditional block patterns to a single matched form before the parser runs, OR
- Skip the parser's full-document re-scan when the only conditionals present are the RE851D `(eq pr_p_occupanc_N "...")` and `(eq pr_p_performeBy_N "...")` families that the post-render safety passes already authoritatively resolve.

This is the riskiest item; we will gate it behind `/851d/i.test(template.name)` and verify with the existing Deno tests in `supabase/functions/_shared/tag-parser.*.test.ts` so other templates are unaffected.

### H. Diagnostic timing log
Add a single per-pass `performance.now()` log line so future regressions are easy to attribute. RE851D-only.

## Out of scope (explicitly)

- No DB schema changes.
- No changes to UI, CSR forms, field dictionary, save APIs.
- No changes to other templates' generation paths.
- No background-job/polling refactor — we're staying within the existing synchronous edge function and bringing CPU under the limit. (If after the above we still exceed the limit on the worst-case 5-property × multi-lien deal, we will revisit asynchronous offload as a separate proposal.)

## Acceptance criteria

- RE851D Single Doc generation completes for the current 5-property deal without `CPU Time exceeded`.
- All previously-correct fields (Property, Lien, Encumbrance Remaining/Expected/Total, YES/NO checkboxes) still populate.
- Other templates (RE885, RE851A, etc.) generate identically — verified by running existing `tag-parser.*.test.ts` Deno tests.
- Edge function logs show the per-pass timings and a non-zero `processedDocx` upload.
