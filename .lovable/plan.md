## RE851A Part 2 checkbox assessment

You do **not** need to change the field mapping.

### What is already correct
- The generator already derives the broker-capacity booleans from the existing UI field/key path.
- `or_p_isBrkBorrower` is already published for template conditionals.
- Derived aliases already exist:
  - `or_p_brkCapacityAgent`
  - `or_p_brkCapacityPrincipal`

### Root cause in the uploaded RE851A
In the uploaded template, Part 2 is authored as literal text:
- `[ ] A. Agent in arranging a loan on behalf of another`
- `[x] B. Principal as a borrower ...`

That means the current document engine cannot reliably toggle those markers because it is built to handle:
- Handlebars tags like `{{#if or_p_isBrkBorrower}}...{{/if}}`
- checkbox glyphs like `☑ / ☐`
- native Word checkbox controls

It does **not** currently treat literal bracket markers `[ ] / [x]` as dynamic checkbox targets.

### Secondary issue
The uploaded Part 2 “B” label text is longer than some of the existing fallback label variants, so label-based matching is not guaranteed on this exact template version.

## Recommended fix
Keep the existing mapping exactly as-is and fix the rendering layer only.

### Preferred option
Update only the two checkbox symbols in the RE851A template to use the existing boolean key:
- `{{#if or_p_isBrkBorrower}}☐{{else}}☑{{/if}} A.`
- `{{#if or_p_isBrkBorrower}}☑{{else}}☐{{/if}} B.`

This preserves:
- labels
- spacing
- alignment
- layout
- all other sections

### Code-only fallback if template text must stay `[ ] / [x]`
Implement a narrow parser enhancement that only swaps the bracket marker immediately before the exact Part 2 A/B labels, without touching any other section.

## Implementation plan
1. Keep the current field mapping and boolean derivation unchanged.
2. Support the uploaded Part 2 authoring pattern by one of these minimal paths:
   - preferred: use Handlebars glyph toggles in the two RE851A Part 2 lines only
   - fallback: extend the parser to recognize `[ ]` / `[x]` markers for those exact A/B labels
3. Expand the exact label matching for the uploaded B sentence so the full RE851A wording is covered.
4. Verify the final output behavior:
   - `or_p_isBrkBorrower = true` → A unchecked, B checked
   - `false/null` → A checked, B unchecked
   - no layout movement
   - no effect on Balloon Payment or other checkbox logic

## Technical details
- No UI change
- No API/backend contract change
- No database change
- No field mapping change
- No document section restructuring
- Only checkbox symbol resolution in RE851A Part 2 should be adjusted

If you approve, the safest implementation is to support this exact RE851A Part 2 template pattern without touching any other mappings or sections.