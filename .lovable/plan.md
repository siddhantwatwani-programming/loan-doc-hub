## RE851D – Fix YES/NO "Remain Unpaid" Double-Check (Post-Render SDT Safety Pass)

### Root Cause

The "Do any of these payments remain unpaid?" YES/NO pair currently has only a **pre-render** safety pass (lines 3479–3556) that flips raw `☐/☑` glyphs in the template before rendering. After that, `processDocx → convertGlyphsToSdtCheckboxes` wraps each standalone glyph in a `<w:sdt>` block with its own `<w14:checked w14:val="0|1">` state. Word renders the SDT's intrinsic checked state, so any SDT whose internal state ends up `1` shows ☑ — producing the "both checked" symptom even when the visible glyph was rewritten.

The Owner Occupied pair already solved this same problem with a **post-render SDT-aware** safety pass (lines 3732–3943). We will mirror that for Remain Unpaid.

### Fix

Add a single post-render safety pass strictly scoped to RE851D, mirroring the existing Owner Occupied post-render pass, but anchored to the question text "Do any of these payments remain unpaid?" and bound to the per-property boolean `pr_li_currentDelinqu_K`.

For each PROPERTY #1–#5 region:
1. Locate the question anchor "Do any of these payments remain unpaid".
2. Find the next `<w:t>YES</w:t>` and `<w:t>NO</w:t>` label runs (case-insensitive, bounded look-ahead within the property region).
3. For each label, find the immediately preceding control — either an `<w:sdt>` checkbox block or a bare glyph run — using the same `findControlBefore` helper pattern.
4. Resolve `isYes` from `pr_li_currentDelinqu_K` (true → YES ☑ / NO ☐; false/missing → YES ☐ / NO ☑).
5. Rewrite each control:
   - SDT: update both `<w14:checked w14:val>` and the inner glyph in `<w:sdtContent>` via the existing `rewriteSdtChecked` helper.
   - Bare glyph run: direct ☐/☑ replacement preserving `<w:rPr>`.

### Acceptance

- Only one of YES / NO is checked per property.
- YES ☑ when `pr_li_currentDelinqu_K === true`; NO ☑ otherwise.
- Works for properties #1–#5.
- No changes to UI, schema, API, dictionary, or any other field/template logic.
- Owner Occupied pass remains unchanged.

### Files

- `supabase/functions/generate-document/index.ts` — add post-render Remain-Unpaid SDT-aware safety pass alongside the existing Owner Occupied one.

After the change the `generate-document` edge function will be redeployed.