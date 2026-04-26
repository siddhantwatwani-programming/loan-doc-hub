RE851A "IS BROKER ALSO A BORROWER?" — Option B unchecked when CSR is checked

Root cause:
- After conditional/merge-tag resolution, several checkbox-glyph "dedup" passes in
  `tag-parser.ts` collapsed two adjacent checkbox glyphs into one when they were
  separated only by whitespace/XML tags.
- Their non-greedy gap pattern `(?:\s|<[^>]*>)*?` allowed the gap to span
  paragraph boundaries (`</w:p>` … `<w:p>` are XML tags too).
- For the RE851A Part 2 A/B rows, when the CSR checkbox was checked, the A
  paragraph resolved to `☐` and the B paragraph to `☑`. The dedup then dropped
  the B `☑`, leaving Option B blank.

Fix (engine-only, minimal):
- Paragraph-scope every checkbox-glyph dedup gap with a negative lookahead that
  excludes `</w:p>` and any new `<w:p>` start, so dedup never crosses paragraphs.
  Updated three sites in `supabase/functions/_shared/tag-parser.ts`:
    - the post merge-tag dedup pass
    - both dedup blocks inside `replaceStaticCheckboxLabel` (leading + trailing)
    - the plain-text fallback path
- Broaden truthy-value detection per the user's explicit ask, only on the
  broker-borrower path:
    - `generate-document/index.ts` accepts `true`, `"true"`, `"yes"`, `"y"`,
      `"1"`, `"checked"`, `"on"` for `or_p_isBrkBorrower` derivation.
    - The SDT-checkbox truthy check in `tag-parser.ts` accepts the same set
      (defensive; matches existing behavior elsewhere).

Template logic remains unchanged:
```handlebars
{{#if or_p_isBrkBorrower}}☐{{else}}☑{{/if}} A. Agent in arranging a loan on behalf of another
{{#if or_p_isBrkBorrower}}☑{{else}}☐{{/if}} B. Principal as a borrower on funds from which broker will directly or indirectly benefit...
```

No changes to UI, schema, permissions, field mappings, or the DOCX template.
Files changed:
- supabase/functions/_shared/tag-parser.ts
- supabase/functions/generate-document/index.ts
