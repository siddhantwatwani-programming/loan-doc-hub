## Goal

Fix RE851D so the two `{{#if (eq pr_p_performeBy_N "Broker")}}…{{/if}}` lines render strictly per-property (Property #1 → uses property 1's value, … Property #5 → uses property 5's value), with no cross-property bleed and blank output for any non-"Broker" value.

## Root Cause

`pr_p_performeBy_N` is already in the per-property publisher (`property{N}.appraisal_performed_by` → `pr_p_performeBy_{N}`), the allowlist, and the anti-fallback shield. The remaining failure point is the **PROPERTY region detector** (`findAnchorOffsets` in `supabase/functions/generate-document/index.ts`, lines ~3451–3523):

- It locates PROPERTY blocks via "PROPERTY INFORMATION" gray-bar anchors, with a fallback regex for `PROPERTY #K`.
- When the gray-bar / `PROPERTY #K` text gets split across `<w:r>` runs in property #3-#5, fewer than 5 anchors are returned.
- For `_N` occurrences inside undetected PROPERTY blocks, `region.forcedIndex` is `null` and the code falls to the GLOBAL counter — which assigns wrong indices (or, when the canonical-key resolver kicks in for a literal `pr_p_performeBy_N`, returns the bare `pr_p_performeBy` value = property #1's "Broker").

## Fix (single file, additive — no schema or UI changes)

**File:** `supabase/functions/generate-document/index.ts`

1. **Harden PROPERTY block detection** in `findAnchorOffsets` so all 5 blocks are found even when Word splits the heading text:
   - Before calling `findAllNoCapture(/\bPROPERTY\s+INFORMATION\b/gi)` and the `PROPERTY #K` fallback, also scan the **xml-tag-stripped, whitespace-collapsed** text for the same anchors and map offsets back via `collapsedToOriginal` (the helper already exists in this block). This handles run-split headings.
   - If still fewer than the number of property records present in `fieldValues` (we already know `sortedPropIndices.length`), add a third fallback: locate each occurrence of `{{#if (eq pr_p_performeBy_N "Broker")}}` (the very tag in question) in document order, pair them up (BPO line + N/A line per property), and synthesize PROPERTY ranges around each pair. This guarantees per-property scoping for these two specific lines even if no heading anchor is detectable.

2. **Targeted post-rewrite safety pass** for `pr_p_performeBy_N` / `pr_p_performedBy_N`:
   - After the main region rewrite loop, scan `xml` for any **remaining literal** `pr_p_performeBy_N` / `pr_p_performedBy_N` occurrences (i.e., ones the region rewriter missed because `forcedIndex` was null and the GLOBAL branch was suppressed).
   - Walk these occurrences in document order. For each, determine the owning PROPERTY index by:
     a. Counting the number of PROPERTY anchors at-or-before this offset (1-indexed), OR
     b. If still 0, count the occurrence-pair index (1st pair → property 1, 2nd pair → property 2, …, capped at 5).
   - Rewrite the `_N` to `_K` for that property. This guarantees each line resolves to its own per-property field key.

3. **Hard guard against canonical-key fallback for these two keys**:
   - Extend the existing anti-fallback shield (already includes `"pr_p_performedBy"`, `"pr_p_performeBy"`) by also blanking the bare unsuffixed keys `pr_p_performeBy` and `pr_p_performedBy` to `""` (only for RE851D template) so that, in the worst case where a literal `_N` survives all rewrites, the resolver cannot return property #1's value via canonical fallback. Conditional then evaluates false → blank — matching the spec ("Other" → blank).

## Acceptance Criteria

- Each PROPERTY #K block in the generated RE851D doc resolves `pr_p_performeBy_N` strictly from `property{K}.appraisal_performed_by` (CSR Property → Property Details → Performed By).
- Value `"Broker"` → renders `BPO Performed by Broker` and `N/A` lines.
- Any other value (or empty) → both lines render blank.
- No bleed between property blocks; no global default fallback.

## Out of Scope

- No UI, dictionary, schema, or other-template changes.
- No changes to the (eq …) expression evaluator in `tag-parser.ts`.
- No edits beyond `supabase/functions/generate-document/index.ts`.
