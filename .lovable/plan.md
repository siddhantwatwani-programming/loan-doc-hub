## RE851D – Eliminate Repeated Per-Character Text Projections (CPU Timeout Fix)

### Root cause
The seven RE851D post-render safety passes (lines ~4419–6113 of `supabase/functions/generate-document/index.ts`) already share an unzip + XML decode/encode cache (`__passUnzip` / `__xmlGet` / `__xmlSet`, lines 4374–4417). However, each pass that needs to anchor on visible text (Owner Occupied, Multi-Properties, Remain Unpaid, Cure Delinquency, Q1 Paid Off, Encumbrance label-anchor) **independently rebuilds a visible-text projection** of the entire `word/document.xml`:

```text
const buf: string[] = []; const map: number[] = [];
let i = 0;
while (i < xml.length) {
  if (xml[i] === "<") { ... buf.push(" "); map.push(i); ... }
  buf.push(xml[i]); map.push(i); i++;
}
```

On a 5-property document `word/document.xml` is ~3–4 MB, so each projection is ~3–4 M iterations × push() into two arrays. With 6 passes that is ~24 M iterations + ~48 M array growths, all on the same unchanged XML — directly responsible for the "CPU limit exceeded" failure.

The same passes also each rescan for `"PROPERTY INFORMATION"` anchors over the projection.

### Fix (single file: `supabase/functions/generate-document/index.ts`)

Add a **shared visible-text projection cache** alongside the existing `__re851dPassCache` / `__xmlStrCache` (lines 4373–4417), and refactor the 6 per-character projection loops to consume it. No template, schema, UI, or other-document changes.

#### 1. Add cache + builder (insert after line 4417)
```ts
type VisProj = {
  txt: string;            // visible text with single-space tag boundaries
  map: number[];          // visible-index -> raw xml offset
  rawToVis: Map<number, number>; // raw xml offset -> visible-index (sparse)
  propAnchorsRaw: number[]; // first up-to-5 raw offsets of "PROPERTY INFORMATION"
  propRanges: Array<{ k: number; start: number; end: number }>;
};
const __visCache: Record<string, VisProj> = {};
const __invalidateVis = (filename: string) => { delete __visCache[filename]; };

// Build a single visible-text projection using bulk slicing (NOT per-char push)
// so the projection cost stays O(N) but constant-factor is ~10× smaller than
// the per-char push loops currently in each pass.
const __getVis = (filename: string, xml: string): VisProj => {
  const cached = __visCache[filename];
  if (cached) return cached;

  const parts: string[] = [];
  const segStarts: number[] = []; // raw start of each text segment
  const segLens: number[] = [];   // length of each text segment in xml
  let i = 0;
  while (i < xml.length) {
    const lt = xml.indexOf("<", i);
    if (lt === -1) {
      parts.push(xml.slice(i));
      segStarts.push(i);
      segLens.push(xml.length - i);
      break;
    }
    if (lt > i) {
      parts.push(xml.slice(i, lt));
      segStarts.push(i);
      segLens.push(lt - i);
    }
    // Synthetic single space at tag boundary, mapped to '<' offset.
    parts.push(" ");
    segStarts.push(lt);
    segLens.push(0); // marker for the single synthetic space
    const gt = xml.indexOf(">", lt);
    if (gt === -1) break;
    i = gt + 1;
  }
  const txt = parts.join("");
  // Build map[] lazily by walking segments — only allocated once per file.
  const map = new Int32Array(txt.length); // typed array = 4× smaller than number[]
  let v = 0;
  for (let s = 0; s < parts.length; s++) {
    const part = parts[s];
    const start = segStarts[s];
    const len = segLens[s];
    if (len === 0) {
      // synthetic space
      map[v++] = start;
    } else {
      for (let k = 0; k < part.length; k++) map[v++] = start + k;
    }
  }
  // PROPERTY INFORMATION anchors — computed once.
  const propAnchorsRaw: number[] = [];
  const propRe = /\bPROPERTY\s+INFORMATION\b/gi;
  let m: RegExpExecArray | null;
  while ((m = propRe.exec(txt)) !== null) {
    propAnchorsRaw.push(map[m.index] ?? 0);
    if (propAnchorsRaw.length >= 5) break;
  }
  const propRanges: VisProj["propRanges"] = [];
  for (let pi = 0; pi < propAnchorsRaw.length; pi++) {
    propRanges.push({
      k: pi + 1,
      start: propAnchorsRaw[pi],
      end: pi + 1 < propAnchorsRaw.length ? propAnchorsRaw[pi + 1] : xml.length,
    });
  }
  // rawToVis kept sparse: only the passes that need it (encumbrance label
  // pass) build it lazily from `map`. Keeping it empty here avoids a 4 MB
  // Map allocation that 5 of the 6 passes never touch.
  const rawToVis = new Map<number, number>();
  const proj: VisProj = { txt, map: Array.from(map), rawToVis, propAnchorsRaw, propRanges };
  __visCache[filename] = proj;
  return proj;
};
```

Notes:
- The builder uses `xml.indexOf("<", i)` + `xml.slice` to copy text segments in bulk (V8 SIMD fast path) instead of pushing one character at a time. Same output, ~10× faster constant factor.
- `map` is built into an `Int32Array` (4 bytes per entry vs. ~8–32 for boxed `number`), then converted once for API parity with existing call sites.
- Property-information anchors and ranges are computed exactly once and reused by every pass.

#### 2. Wire `__xmlSet` to invalidate the projection
Modify `__xmlSet` (line 4397) so that whenever a pass mutates a content part the cached projection for that file is dropped:
```ts
const __xmlSet = (filename: string, xml: string): Uint8Array => {
  __xmlStrCache[filename] = xml;
  __xmlDirty.add(filename);
  __invalidateVis(filename); // NEW
  return (__re851dPassCache && __re851dPassCache[filename]) || new Uint8Array(0);
};
```
This guarantees correctness: if pass N rewrites XML, pass N+1 rebuilds the projection from the new bytes.

#### 3. Replace the per-character projection loops in each pass
For each of the six locations that currently build `buf` / `map` per character, replace the build block with:
```ts
const __vp = __getVis(filename, xml);
const txt = __vp.txt;
const map = __vp.map;
const propAnchorsRaw = __vp.propAnchorsRaw;
const propRanges = __vp.propRanges;
```

Affected sites (existing line numbers):
- 4444–4477 (Owner-Occupied safety pass)
- 4740–4760 (Multi-Properties pass — already builds `map`/`buf` plus uses anchors)
- 4998–5030 (Remain-Unpaid pass)
- 5217–5240 (Cure-Delinquency pass)
- 5426–5450 (Q1 Paid-Off pass — same shape)
- 5635–5660 (next post-render pass — same shape)
- 5863–5882 (Encumbrance label-anchor pass — also uses `rawToVis`; build it lazily here only if needed)

Each call site loses ~25 lines of per-char loop and the redundant `PROPERTY INFORMATION` re-scan. Behavior is byte-identical because `txt`, `map`, and the anchor list are produced by the same algorithm — only the build mechanics change.

#### 4. Out of scope (NOT modified)
- All RE851D in-render publishers (lines ~938–1788), encumbrance rollup, anti-fallback shield, and `_N` preprocessing.
- The 7 pass bodies' rewrite/anchor logic — only the projection-build prologue is replaced.
- `processDocx`, `tag-parser.ts`, `normalizeWordXml`, integrity check.
- Any other document type, UI, schema, RLS, dictionary, or template.

### Expected impact
- `word/document.xml` projection built **once** per generation instead of 6×.
- `PROPERTY INFORMATION` anchor scan done **once** instead of 6×.
- Per-char `push()` loops replaced with bulk `slice` segments → ~10× constant-factor speedup on the one remaining build.
- Net CPU drop on a 5-property RE851D: roughly 60 × (4 MB scan + array growth) → 1 × bulk-slice scan, well under the edge function CPU limit.

### Acceptance verification
1. Generate RE851D for a 5-property / multi-lien deal — completes without "CPU limit exceeded".
2. Per-property Remaining / Expected / Total values unchanged from the most recent successful run (same publishers, same data).
3. All 7 safety passes still log their "forced" / "anchored" diagnostic lines with the same counts.
4. Other document types (RE885, HUD-1, etc.) generate identically — they never touch the new helpers.
5. Word + Google Docs both open the resulting `.docx` (existing `DOCX_INTEGRITY` check still runs).
