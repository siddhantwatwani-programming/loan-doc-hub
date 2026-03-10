

## Fix: Borrower Certification Fields Not Populating

### Root Cause

The `splitOpenBraces` and `splitCloseBraces` regex patterns (lines 59, 66 in `tag-parser.ts`) expect adjacent runs to follow the pattern `</w:t></w:r><w:r...><w:t...>`, but Word frequently inserts `<w:rPr>...</w:rPr>` (run properties) between the `<w:r>` and `<w:t>` elements:

```text
Actual XML:  {</w:t></w:r><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>{
Expected:    {</w:t></w:r><w:r><w:t>{
```

Because the regex `<w:r[^>]*><w:t[^>]*>` cannot match `<w:r><w:rPr>...</w:rPr><w:t>`, the `{{` braces are never consolidated. The subsequent `curlyFragmentedPattern` (line 82) expects literal `{{` to be present, so it also fails. Result: 0 merge tags detected.

The same issue affects `fragmentedDot` and `fragmentedUnderscore` patterns — `<w:rPr>` blocks between runs prevent consolidation.

### Fix

**File: `supabase/functions/_shared/tag-parser.ts`** — Update 4 regex patterns (lines 55, 59, 66, 73) to allow optional `<w:rPr>...</w:rPr>` blocks between `<w:r>` and `<w:t>`:

Replace the inter-run XML fragment pattern from:
```
<\/w:t><\/w:r><w:r[^>]*><w:t[^>]*>
```
to:
```
<\/w:t><\/w:r><w:r[^>]*>(?:\s*<w:rPr>[\s\S]*?<\/w:rPr>)?\s*<w:t[^>]*>
```

This accounts for the `<w:rPr>` formatting block that Word inserts between the run element and text element, without stripping it (preserving formatting for non-tag content).

| Line(s) | Pattern | Change |
|---------|---------|--------|
| 55 | `fragmentedUnderscore` | Add optional `<w:rPr>` between `<w:r>` and `<w:t>` |
| 59 | `splitOpenBraces` | Add optional `<w:rPr>` between `<w:r>` and `<w:t>` |
| 66 | `splitCloseBraces` | Add optional `<w:rPr>` between `<w:r>` and `<w:t>` |
| 73 | `fragmentedDot` | Add optional `<w:rPr>` between `<w:r>` and `<w:t>` |

No other files changed. No database, UI, or other logic modifications.

