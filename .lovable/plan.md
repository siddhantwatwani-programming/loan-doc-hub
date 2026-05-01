## Problem

In RE851D, the per-property checkboxes (`{{property_type_sfr_owner_N}}`, `{{property_type_commercial_N}}`, etc.) appear identical across all property blocks — and in the screenshots the literal `{{property_type_sfr_owner_N}}` placeholders are visibly **un-rewritten** in some property blocks.

The publisher logic itself is correct: `fieldValues` does set `property_type_*_1`, `_2`, `_3`, … independently per property (verified at lines 1041–1155 of `supabase/functions/generate-document/index.ts`). The bug is upstream — in the **`_N` → `_K` rewriter** that runs over the raw template XML.

## Root cause

The `_N` rewriter (lines ~2548–3049, `supabase/functions/generate-document/index.ts`) operates **directly on the raw zipped DOCX XML before `normalizeWordXml` runs**. It uses a plain regex like `/property_type_sfr_owner_N/g` on the raw XML.

Microsoft Word frequently splits a single placeholder across multiple `<w:r>` runs after authoring edits, e.g.:

```text
<w:r><w:t>{{property_type_sfr_owner_</w:t></w:r><w:r><w:t>N}}</w:t></w:r>
```

When that happens, the regex never matches that occurrence — so:
- The `_N` is **not** rewritten to `_1`/`_2`/`_3`/etc.
- The merge-tag resolver later (after `normalizeWordXml` joins the runs) sees the literal key `property_type_sfr_owner_N`, has no value for it, and either prints the raw `{{...}}` text or leaves the checkbox blank.

The diagnostic log confirms uneven rewrite counts per property block (`PROP#1=17, PROP#2=14, PROP#3=12, PROP#4=12, PROP#5=13`), which is exactly what intermittent run-fragmentation produces — some property blocks happen to have a clean single-run placeholder, others don't.

This also explains why the same value appears across all properties: when the rewriter misses a `_N` in a given block, the resolver falls back to a generic key (or to index 1's published bare aliases at `property_type_sfr_owner` without `_N`), so every un-rewritten block ends up showing index 1's checkbox state.

## Fix

Make the `_N` rewriter resilient to Word run fragmentation by **normalizing each XML part before scanning for `_N` placeholders**.

### Single, scoped edit

In `supabase/functions/generate-document/index.ts`, inside the existing RE851D `_N` preprocessing loop (`for (const filename of orderedNames)` around line 2825):

1. Right after `let xml = decoder.decode(bytes);` (line 2837), call the existing `normalizeWordXml(xml, template.name)` from `_shared/tag-parser.ts` to merge fragmented runs and flatten merge-field structures.
2. Run the existing `_N` → `_K` rewriter logic on the **normalized** XML.
3. Write the normalized + rewritten XML back into the zip.

That's sufficient — `normalizeWordXml` is idempotent, and running it earlier just means the later `processDocx` call will normalize an already-normalized part (a no-op fast-path).

### Why this is safe and minimal

- No change to the publisher (`fieldValues.set(...)` lines 979–1155 stay untouched — they were already correct per-index).
- No change to the rewriter's region detection, allow-listing, or counter logic.
- No change to template files, schema, dictionary, UI, or other documents.
- `normalizeWordXml` is the same function used downstream in `processDocx`; no new behavior is introduced — it's just moved earlier in the pipeline for the RE851D `_N` pass.
- The `if (!xml.includes("_N")) continue;` early-exit (line 2838) still works because normalization preserves text content.

### Verification

After the fix, with a deal that has 3 properties of different types (e.g. SFR Owner-Occupied, Commercial, Land Income Producing):

1. Generate RE851D.
2. Each property block must show **exactly one** ☒ in the Property Type checkbox group, matching the corresponding CSR row.
3. No literal `{{property_type_*_N}}` placeholders should remain in the rendered DOCX.
4. The `RE851D regions` log line should show consistent rewrite counts per property block (e.g. `PROP#1=17, PROP#2=17, PROP#3=17, ...` instead of the current uneven `17/14/12/12/13`).
5. Existing single-property RE851D templates and other documents (RE851A, RE885, etc.) must regenerate unchanged — confirmed by spot-checking a non-RE851D template.

## Files touched

- `supabase/functions/generate-document/index.ts` — one added line inside the RE851D `_N` preprocessing loop (call `normalizeWordXml` on `xml` before scanning).

## Out of scope

- No schema, UI, or dictionary changes.
- No changes to `tag-parser.ts`, `docx-processor.ts`, or `field-resolver.ts`.
- No changes to the property-type publisher mapping logic — only the rewriter's input is being normalized.
