

## Fix: "Continuing Authorization" Document Fields Not Populating

### Root Cause

The **document generation** engine (`tag-parser.ts`) and the **validation** engine (`validate-template/index.ts`) use different XML normalization strategies:

- **Validation** (works correctly): Strips all `<w:rPr>` formatting blocks first, then consolidates adjacent text runs. Tags are detected.
- **Generation** (broken): Preserves `<w:rPr>` blocks to maintain formatting, but the run-consolidation regex on line 42 only matches `</w:t></w:r><w:r><w:t>` — it does **not** skip over `<w:rPr>...</w:rPr>` blocks sitting between `<w:r>` and `<w:t>`.

Result: When Word splits a tag like `{{Borrower.Name}}` across multiple runs with formatting properties between them, the generation normalizer fails to consolidate them. The logs confirm: **"Found 0 merge tags"** across all XML files.

### Fix

**File: `supabase/functions/_shared/tag-parser.ts`, line 42**

Update the run-consolidation regex to allow an optional `<w:rPr>...</w:rPr>` block between `<w:r>` and `<w:t>`:

```
// Current (line 42):
result = result.replace(/<\/w:t><\/w:r><w:r(?:\s[^>]*)?>(?:\s*)<w:t(?:\s[^>]*)?>/g, '');

// Fixed:
result = result.replace(/<\/w:t><\/w:r><w:r(?:\s[^>]*)?>(?:\s*(?:<w:rPr>[\s\S]*?<\/w:rPr>)?\s*)<w:t(?:\s[^>]*)?>/g, '');
```

This allows the regex to match and consolidate adjacent runs even when Word inserts formatting metadata between them. The first run's formatting is preserved (its `<w:rPr>` remains intact), so the visual appearance of the document is maintained.

### Scope

| File | Change |
|------|--------|
| `supabase/functions/_shared/tag-parser.ts` | Single regex update on line 42 |

No other files, UI components, database schema, or logic are modified.

