## Fix RE851D "Are there multiple properties on the loan?" YES/NO checkbox

### Root cause
The publisher (`pr_p_multipleProperties_{yes,no}_glyph`) and four `field_dictionary` rows already exist. Inspecting the generated `Re851d_v11.docx` shows the merge-tag span resolved to empty (`...preserve"> YES    NO`) — the glyph runs were stripped between parser → glyph→SDT converter → shield, so neither box renders.

Every other RE851D YES/NO pair (Remain-Unpaid, Owner-Occupied, Cure-Delinquency, Property Type) already has a **post-render label-anchored safety pass** that guarantees a glyph survives. Multiple-Properties is the only one missing one.

### Change (additive only)
Insert one new safety-pass block in `supabase/functions/generate-document/index.ts`, immediately after the "Remain Unpaid" pass and before the "Owner-Occupied" pass (~line 3777). The block:

- Anchors on text `Are there multiple properties on the loan` (global, not per-property).
- Picks the next 2 glyph runs (`☐|☑|☒`) within a 4 KB window using the same `glyphRunRe` regex used by sibling passes.
- Skips any glyph that overlaps an already-queued rewrite (`rewrites` / `consumed`).
- Forces YES/NO based on `sortedPropIndices.length`: `>1` → YES ☑ NO ☐; `==1` → YES ☐ NO ☑.
- Logs `RE851D multiple-properties YES/NO anchored: count=N isMultiple=…`.

The original publisher (lines 929–937) and dictionary rows remain primary; this pass is a pure fallback.

### Out of scope
- No template, UI, schema, API, packet, or other-template changes.
- No new field_dictionary rows.
- No changes to the publisher, anti-fallback shield, glyph→SDT converter, or any unrelated RE851D pass.

### Acceptance
- Loan DL-2026-0235 (3 properties) → YES ☑, NO ☐.
- Single-property deal → YES ☐, NO ☑.
- Zero-property deal → unchanged (no rewrite).
- All other RE851D outputs identical to current.

### Files modified
1. `supabase/functions/generate-document/index.ts` — insert ~55-line safety pass block in the existing RE851D post-rewrite section (~line 3777).
2. Memory: append safety-pass note to `mem://features/document-generation/re851d-multiple-properties-checkbox`.