

## Investigation: Why Generated Document is 1 Page Instead of 3

### Root Cause

The `normalizeWordXml` function in `supabase/functions/_shared/tag-parser.ts` **destructively strips all `<w:rPr>` (run property) blocks** from the document XML at line 26:

```js
result = result.replace(/<w:rPr>[\s\S]*?<\/w:rPr>/g, '');
```

`<w:rPr>` blocks contain **all run-level formatting**: font name, font size, bold, italic, colors, spacing, etc. Removing them causes every text run to fall back to the default (small) font, collapsing a 3-page formatted document into ~1 page.

A secondary contributor is line 484 in `removeConditionalBlock`, which removes **all empty paragraphs globally** — including intentional spacing paragraphs used for layout.

### Fix (2 changes in `supabase/functions/_shared/tag-parser.ts`)

**Change 1 — Remove the global `<w:rPr>` strip (line 26)**
Delete this line entirely. Instead, update the run consolidation regex (line 42) to optionally skip over `<w:rPr>` blocks between adjacent runs, so tag detection still works while preserving formatting:

```js
// Before (line 42):
result = result.replace(/<\/w:t><\/w:r><w:r(?:\s[^>]*)?>(?:\s*)<w:t(?:\s[^>]*)?>/g, '');

// After:
result = result.replace(/<\/w:t><\/w:r><w:r(?:\s[^>]*)?>(?:\s*(?:<w:rPr>[\s\S]*?<\/w:rPr>)?\s*)<w:t(?:\s[^>]*)?>/g, '');
```

**Change 2 — Scope empty paragraph cleanup to the conditional block area only (line 484)**
Currently removes all empty `<w:p>` elements from the entire document. Change it to only clean up empty paragraphs near the removed block (within a limited range), preserving intentional spacing elsewhere.

### Files Modified
- `supabase/functions/_shared/tag-parser.ts` (lines 26, 42, 484)

### No Other Changes
- No UI changes
- No database/schema changes
- No changes to other shared modules or the generate-document function

