

# Make Generated Checkboxes Editable and Consistent

## Problem
Checkboxes generated from merge tags (e.g., `{{ln_p_amortized}}`) are rendered as plain Unicode glyphs (☑/☐) — static text that cannot be clicked or toggled in Word. Other checkboxes in the document use native Word SDT (Structured Document Tag) checkboxes, which are interactive and editable.

## Solution
When a merge tag or label-based replacement resolves to a boolean/checkbox value, replace the entire `<w:r>` containing the tag with a proper Word SDT checkbox XML structure instead of a plain glyph. This makes all generated checkboxes:
- Editable (clickable in Word)
- Visually consistent with existing SDT checkboxes in the document

## Technical Details

### File: `supabase/functions/_shared/tag-parser.ts`

1. **Add a helper function** `buildSdtCheckboxXml(isChecked: boolean, rPr?: string): string` that generates the correct Word OOXML for an interactive checkbox:
   - `<w:sdt>` wrapper with `<w:sdtPr>` containing `<w14:checkbox>`, `<w14:checked>`, and `<w14:checkedState>`/`<w14:uncheckedState>` elements
   - Display character in `<w:sdtContent>` using the same font and glyph codes as existing checkboxes in the document (MS Gothic font, `☒` = 2612, `☐` = 2610)
   - Preserves the original run's formatting (`<w:rPr>`) where possible

2. **Modify merge tag replacement** (around line 1426-1434): When `fieldData.dataType === 'boolean'` or the tag has a `checkbox` transform, instead of calling `formatCheckbox()` which returns a plain glyph, set a flag so the replacement injects the full SDT XML structure rather than just text within the existing `<w:t>`.

3. **Modify label-based checkbox replacement** (`replaceStaticCheckboxLabel`, line 571): When replacing a static glyph (☐/☑/☒) next to a label, replace the entire `<w:r>` containing the glyph with an SDT checkbox XML block instead of just swapping the character.

4. **Update `formatCheckbox()`** usage: The function itself stays unchanged (still used for non-document contexts), but in the document generation path, boolean fields route through the new SDT builder.

### File: `supabase/functions/_shared/formatting.ts`
No changes needed — `formatCheckbox` remains as-is for non-document uses.

## What Will NOT Change
- SDT checkbox processing (`processSdtCheckboxes`) — already working correctly
- Document generation pipeline, templates, or field resolution logic
- Any UI components or database schema
- Non-checkbox merge tag replacement
- Template upload or validation logic

