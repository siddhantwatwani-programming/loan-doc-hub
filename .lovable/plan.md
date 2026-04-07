

## Plan: Fix Re851a Part 3 Checkbox Checking Without Format Changes

### Root Cause

The `replaceStaticCheckboxLabel` function in `tag-parser.ts` replaces checkbox glyph characters (☐→☑) using regex. For the Amortization checkboxes, the label aliases `FULLY AMORTIZED` and `AMORTIZED PARTIALLY` are active in `merge_tag_aliases`, triggering this replacement. The regex can match across XML run boundaries or capture extra content, which corrupts font properties and alignment in the generated document.

For Payment Frequency (MONTHLY/WEEKLY), the aliases are already deactivated (`is_active: false`), so those checkboxes are NOT being toggled at all — explaining why they don't check.

### The Fix

**Convert all 4 checkboxes from label-based replacement to merge-tag-based replacement.** This means:

1. **Add merge tags to the Re851a template** — Place `{{ln_p_amortizedPartially}}`, `{{ln_p_amortized}}`, `{{ln_p_paymentMonthly}}`, and `{{ln_p_paymentWeekly}}` directly where the ☐ glyph characters currently sit in the template XML, replacing ONLY the glyph character with the merge tag.

2. **Deactivate the 2 active label aliases** — Set `is_active = false` for `FULLY AMORTIZED` and `AMORTIZED PARTIALLY` so `replaceStaticCheckboxLabel` no longer runs for these fields.

3. **No code changes needed** — The engine already:
   - Derives boolean values at lines 736-747 of `generate-document/index.ts`
   - Formats booleans as ☑/☐ via `formatByDataType` → `formatCheckbox`
   - Replaces `{{tag}}` merge tags in standard single-pass replacement

### Why This Preserves Formatting

Standard merge tag replacement (`{{tag}}` → `☑`) operates within a single `<w:t>` element. It replaces only the tag text, never touching `<w:rPr>` (font properties), run boundaries, or surrounding text. The font, spacing, and alignment of the original template cell remain untouched.

### Steps

**Step 1: Database migration** — Deactivate 2 label aliases:
```sql
UPDATE merge_tag_aliases SET is_active = false
WHERE id IN (
  '522cabd9-cca7-4e71-a440-a5c5437efdba',
  '85543566-dd1f-4ed2-8ea6-d58fd6dfd662'
);
```

**Step 2: Update Re851a template in storage** — Download the DOCX, unpack it, and in `word/document.xml`:
- Find the 4 checkbox glyph characters (☐) adjacent to labels FULLY AMORTIZED, AMORTIZED PARTIALLY, MONTHLY, WEEKLY
- Replace each ☐ character with its corresponding merge tag: `{{ln_p_amortized}}`, `{{ln_p_amortizedPartially}}`, `{{ln_p_paymentMonthly}}`, `{{ln_p_paymentWeekly}}`
- Keep ALL surrounding XML (fonts, runs, table cells, spacing) completely unchanged
- Repack and re-upload the template

### What Does NOT Change
- No code changes to `tag-parser.ts`
- No code changes to `generate-document/index.ts`
- No UI changes
- No schema changes
- No changes to derivation logic
- Template layout, fonts, table structure, and alignment remain identical

### Files / Data Changed

| Target | Change |
|---|---|
| Database migration | Set `is_active = false` for 2 amortization label aliases |
| Re851a template (storage) | Replace 4 static ☐ glyphs with merge tags |

