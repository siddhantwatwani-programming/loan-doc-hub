## Issue

In the generated RE851D document, the BALLOON PAYMENT? section renders the three checkboxes vertically:

```
☑ YES
☐
☐
```

Only the first checkbox has its label ("YES"). The 2nd ("NO") and 3rd ("Unknown") checkbox labels are missing, so the result looks blank instead of showing all three options on a single line as required.

## Root Cause

The template's Balloon cell contains three glyph runs (`☐`/`☑`) but only the first one is followed by a "YES" text run. The `NO` and `Unknown` text labels are not present in the template (or live in a separate run that the template never paired correctly). The current post-render pass in `supabase/functions/generate-document/index.ts` (≈ lines 6008-6045) only flips the checked/unchecked glyph — it never injects missing labels — so 2 of the 3 lines render as a bare `☐`.

## Fix (single file: `supabase/functions/generate-document/index.ts`)

Extend the existing balloon YES/NO/Unknown safety pass (only this block — no other passes touched, no other templates touched):

1. While walking the next 3 glyph runs after `BALLOON PAYMENT?` in document order, capture each glyph run's full match span and the immediately-following XML up to the next `<w:p>` boundary in the same window.
2. For each of the 3 glyph slots, after rewriting the glyph to checked/unchecked state, **inspect the visible text already trailing that glyph run within its own paragraph**. If the expected label ("YES" for slot 0, "NO" for slot 1, "Unknown" for slot 2) is **not** already present (case-insensitive), append a sibling `<w:r>` with the label text immediately after the glyph's `</w:r>`:

   ```xml
   <w:r>
     <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr>
     <w:t xml:space="preserve"> LABEL</w:t>
   </w:r>
   ```

3. Reuse the existing `inserts.push({ at: -end, html: ... })` machinery — the label injection is encoded as either:
   - a pure insert (`at >= 0`) at the position immediately after the glyph run's `</w:r>` when no label is present, OR
   - skipped entirely when the label already exists (so re-runs are idempotent).

4. Detection of "label already present": after the glyph run's closing `</w:r>`, take the substring up to the next `</w:p>` (bounded to ~400 chars), strip XML tags, uppercase, and check for `YES` / `NO` / `UNKNOWN` token presence.

5. Logging: extend the existing `RE851D enc post-render` debug line to include `labelsInjected=[YES?,NO?,UNK?]` counts so regressions are visible.

### Behavior preservation

- Glyph state logic, key resolution, anchor detection, window bounds — all unchanged.
- If template already has all three labels (some property variants do), nothing is injected.
- Only the BALLOON YES/NO/Unknown pass is modified — no change to value-cell inserts (Principal/Monthly/Maturity/Amount), no change to other safety passes, other templates, UI, schema, dictionary, RLS, APIs, or DB.
- Output remains byte-identical for documents whose template already contains all three labels.

## Acceptance

- After regenerating the user's RE851D, BALLOON PAYMENT? row reads `☑ YES   ☐ NO   ☐ Unknown` (single visual line per slot, all three labels visible) with the correct option checked.
- 1-property and multi-property RE851D variants both render correctly.
- Existing Principal/Monthly/Maturity/Amount cell population (the prior fix) is untouched.
- No other templates regress.
