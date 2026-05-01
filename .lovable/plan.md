## Fix RE851D Property Section Detection

### Problem

The edge function logs confirm the failure:

```
RE851D regions: PART1=[22919,136073], PART2=[136073,2427477], PROPS=[]
```

`PROPS=[]` means **zero property section anchors are detected**. The current strict regex requires the literal phrase `PROPERTY #K PROPERTY INFORMATION` as one contiguous run, but in the actual template the heading "PROPERTY INFORMATION" is either on a separate line, in a different table cell, or absent — so all `_N` tags in property blocks fall through to the global PART 2 counter, leaving Property #1, #2, #3 blank or duplicated.

### Fix (single file)

**File:** `supabase/functions/generate-document/index.ts` (around lines 2374–2398)

1. **Loosen the property heading regex** to detect `PROPERTY #1` … `PROPERTY #5` headings on their own, with optional trailing text:
   - New pattern: `/\bPROPERTY\s*#\s*([1-5])\b(?![^\n]{0,80}(secured|deed of trust|trust deed))/gi` — matches the heading anywhere it appears in standalone form, while a small negative lookahead avoids inline mentions like "secured by Property #1" inside PART 2 prose.
   - Additionally, only accept anchors whose XML offset is **at or after `part2Start`** (property detail blocks always come after PART 2), which eliminates any stray PART 1 mentions.

2. **Deduplicate by `k`, keep the first occurrence** (already done) and sort by offset (already done).

3. **Diagnostic logging:** extend the existing `regionLog` line so it prints each detected property anchor offset and the per-region rewrite counts (e.g., `PROP#1=12 rewrites, PROP#2=12, PROP#3=12`) to make future debugging trivial.

### What is NOT changed

- No template edits, no schema changes, no UI changes.
- PART 1 / PART 2 anchor regexes unchanged.
- Tag allowlists, forced-index logic, longest-first matching, reverse-offset rewrite — all unchanged.
- Counter reset behavior for PART 1 / PART 2 — unchanged.
- Global fallback counter behavior — unchanged.

### Acceptance

After deployment, regenerating RE851D for a deal with 3 properties should show in the logs:

```
PROPS=[{k:1,...},{k:2,...},{k:3,...}]; rewrites per region: PART1=6, PART2=24, PROP#1=N, PROP#2=N, PROP#3=N
```

and Property #1, #2, #3 sections in the document populate from the matching CSR property indices with no fallback to Property[0].