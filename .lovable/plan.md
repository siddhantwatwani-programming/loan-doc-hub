

## Fix: Document Formatting Broken During Generation

### Root Cause

Line 42 in `supabase/functions/_shared/tag-parser.ts` contains a global run-consolidation regex:

```
result = result.replace(/<\/w:t><\/w:r><w:r(?:\s[^>]*)?>(?:\s*(?:<w:rPr>[\s\S]*?<\/w:rPr>)?\s*)<w:t(?:\s[^>]*)?>/g, '');
```

This merges **every** adjacent `<w:r>` element in the document — not just those containing fragmented tags. When it merges runs, it discards the `<w:rPr>` (run properties) block of the second run, which contains font name, size, bold, italic, color, spacing, etc. This is why populated fields shift positions and break formatting.

The targeted patterns on lines 45-162 already handle every fragmented tag case (chevrons, curly braces, dots, underscores, conditionals, etc.) by matching XML between tag parts without destroying surrounding runs.

### Fix

**File: `supabase/functions/_shared/tag-parser.ts`** — Remove line 42 (the aggressive global run-consolidation regex). The comment block on lines 37-41 should also be removed since it describes the deleted behavior.

No other changes needed. The 15+ targeted fragmentation handlers that follow already cover all tag detection scenarios.

| File | Change |
|------|--------|
| `supabase/functions/_shared/tag-parser.ts` | Remove lines 37-42 (global run consolidation) |

