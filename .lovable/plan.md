## Problem

In `supabase/functions/generate-document/index.ts`, the RE851D `_N` placeholder rewrite (lines 2257–2361) uses a **single global occurrence counter per tag across the entire document**. The RE851D template uses the same `_N` tags in three different regions:

1. **PART 1 — Loan to Value Ratio** (repeated rows): `pr_p_appraiseValue_N`, `ln_p_loanToValueRatio_N`
2. **PART 2 — Securing Properties** (repeated rows): `pr_p_address_N`, `pr_p_appraiseValue_N`, `ln_p_loanToValueRatio_N`
3. **PROPERTY #1 … #5** (5 fixed blocks): full per-property field set including `propertytax.*_N`, `pr_p_yearBuilt_N`, `pr_p_squareFeet_N`, `pr_p_construcType_N`, `pr_p_occupanc_N`, `pr_p_appraiseValue_N`, `pr_p_appraiseDate_N`.

Because the counter is shared, occurrences in PART 1 are numbered `_1.._K`, PART 2 continues `_K+1..`, and the property sections receive indices well past `_5`. The anti-fallback shield (lines 1150–1192) then blanks them. Result: only PROPERTY #1 (and only the first row of each Part 1 / Part 2) populates.

The expected behavior is **per-region occurrence numbering reset to 1 at the start of each repeating region** so every region produces `_1, _2, _3, …` mapped to `Property[0], Property[1], Property[2], …`.

## Fix (single edge-function change, additive)

Edit only `supabase/functions/generate-document/index.ts` inside the existing `if (/851d/i.test(template.name || ""))` block (~line 2265). No DB, UI, dictionary, schema, or template changes. No other code paths are touched.

### Step 1 — Detect region boundaries in `word/document.xml`

Before iterating tags, scan the decoded XML for region anchors and collect their character offsets (case-insensitive, tolerant of XML run-splits via stripping XML tags for the search-string match only):

- **Region A (PART 1)**: from the visible heading text matching `PART 1` (or `LOAN TO VALUE RATIO`) up to the next heading.
- **Region B (PART 2)**: from `PART 2` (or `SECURING PROPERTIES`) up to the first `PROPERTY #1`.
- **Region C₁..C₅ (PROPERTY #1..#5)**: from each `PROPERTY #K` heading up to the next `PROPERTY #K+1` heading (or end of body for #5).

Implementation note: do the offset scan against a copy of the XML where tags are normalized to a single space, but apply rewrites to the original XML. Maintain a parallel `original→stripped` offset map (or simpler: locate anchor strings with a regex on the raw XML allowing `<[^>]+>` between every character of the heading word — same trick used elsewhere in this file for tag detection). If anchor detection fails for any region, fall back to the current global-counter behavior for that region only (logged) so we never regress.

### Step 2 — Per-region counters

Replace the single `counters: Map<tag, number>` with **per-region counters**: `regionCounters: Map<regionId, Map<tag, number>>`. For each `replace()` callback, determine the current match's character offset (use `RegExp.exec` in a `while` loop instead of `String.replace` with a function) and pick the counter for the region whose `[start, end)` contains the offset. Region C₁ rewrites consume `_1`, C₂ consume `_1` (reset), etc.

For PART 1 and PART 2 the counter ALSO resets at the region boundary, so the first row in PART 1 gets `_1`, second `_2`, …, and PART 2 likewise restarts at `_1`. This gives exact alignment with `Property[0]..Property[N-1]`.

### Step 3 — Tag-list scoping per region

Restrict the rewritten tag set per region to the families that actually appear there, so a stray match in the wrong region cannot be miscounted:

- **Region A (PART 1)**: `pr_p_appraiseValue_N`, `ln_p_loanToValueRatio_N`.
- **Region B (PART 2)**: `pr_p_address_N`, `pr_p_appraiseValue_N`, `ln_p_loanToValueRatio_N`.
- **Region C_K (PROPERTY #K)**: the full existing `RE851D_INDEXED_TAGS` list.
- Anything outside any detected region: keep current global behavior (preserves backward compatibility).

### Step 4 — Property-section forced index

For each `PROPERTY #K` region, additionally force every `_N` rewrite inside that region to resolve to `_K` (not just the running counter). This is the strongest guarantee for the per-property blocks: PROPERTY #2 always gets `_2` regardless of how many tag occurrences appear inside the block. PART 1 and PART 2 keep the running per-region counter (because they have no fixed K).

### Step 5 — Overflow / missing-property handling

Unchanged: indices > 5 in PART 1 / PART 2 still resolve to `_overflow{n}` (guaranteed-empty). For PROPERTY #K where `Property[K-1]` is absent, the per-index publisher (lines 769–796) does not publish aliases, the anti-fallback shield blanks the `_K` tags, and the block renders blank — matching the spec ("Do NOT duplicate or reuse previous data").

### Step 6 — Checkbox logic verification (no change)

- **OWNER OCCUPIED** (`pr_p_occupancySt_N`): already publishes `_yes/_no/_yes_glyph/_no_glyph` per index at lines 1021–1045 with the spec's "Owner → YES, else → NO" semantics.
- **TAX DELINQUENT**: already publishes `propertytax_delinquent_N_yes/_no/_yes_glyph/_no_glyph` at lines 1117–1146 with `true → YES, false → NO`.

These already exist; verifying they remain unchanged is the only action.

### Step 7 — Diagnostic log

Emit one summary line:

```
[generate-document] RE851D regions: A=[start,end] B=[start,end] C1..C5=[...]; rewrites per region: {...}
```

So future regressions are diagnosable from a single log line.

## Files To Edit

- `supabase/functions/generate-document/index.ts` — only the existing RE851D `_N`-preprocessing block (~lines 2265–2361). Estimated ~80 net additional lines, all inside the existing `try/catch`.

## Acceptance Criteria Mapping

| Criterion | Resolution |
|---|---|
| PART 1 rows align to `Property[0..N-1]` | Step 2 per-region counter resets at PART 1 start |
| PART 2 rows align to `Property[0..N-1]` | Step 2 per-region counter resets at PART 2 start |
| PROPERTY #K populates from `Property[K-1]` | Step 4 forces `_K` inside each PROPERTY #K region |
| No duplication of `Property[0]` | Per-region counters + per-section forced index eliminate the global-counter spillover |
| 1–5 properties dynamic | Existing `propertyIndices` set + anti-fallback shield (lines 1150–1192) handle missing properties; no change required |
| Checkbox YES/NO correct | Already correct (Step 6) |
| Document still generates | Change is fully contained within existing `try/catch`; failure of region detection falls back to current behavior |

## Out of Scope (unchanged)

- DB schema, RLS, UI components, dictionary entries, template files
- Address-keyed `propertytax` bridge (already in place from prior fix)
- Per-index publisher and anti-fallback shield (already in place)
- Memory rule "RE851D Multi-Property Mapping" — extend description to mention region-scoped `_N` rewrite after merge.

## Memory Update (post-merge)

Append to `mem://features/document-generation/re851d-multi-property-mapping`: "_N placeholders are rewritten per-region (PART 1, PART 2, PROPERTY #K) with counters reset at each region boundary; PROPERTY #K regions force the index to K so per-property blocks always pull from `Property[K-1]`."
