

## Fix: Cross-Paragraph Content Consumption in `parseWordMergeFields`

### Root Cause

The previous fix correctly added paragraph boundary protection to `curlyFragmentedPattern` in `normalizeWordXml` (line 96). However, `parseWordMergeFields` has its OWN regex patterns that match across paragraph boundaries:

**Line 230** — `curlyPattern`:
```javascript
const curlyPattern = /\{\{([^}|]+)(?:\s*\|\s*([^}]+))?\}\}/g;
```
`[^}|]+` matches ANY character except `}` and `|` — including XML tags, newlines, and body text across paragraphs. When a `{{tag}}` couldn't be consolidated by normalization (because `}}` is in a different paragraph), this pattern matches from `{{` all the way to the next `}}` found pages later, capturing the entire document body as a "tag name".

Then `replaceMergeTags` (line 842) does `result.split(tag.fullMatch).join(resolvedValue)`, which replaces the giant matched blob with either a resolved value or empty string — destroying pages of content.

This explains:
- **5 pages missing**: Content between `{{ln_p_loanNumber` and a distant `}}` was captured as one "tag" and replaced
- **"Account Number: {{R Ekambaram"**: The `{{` from an unconsolidated tag followed by content from a resolved field

**Line 215** — `unicodePattern` has the same vulnerability:
```javascript
const unicodePattern = /«([^»]+)»/g;
```

### Fix

**File: `supabase/functions/_shared/tag-parser.ts`** — 2 changes:

**Change 1 (line 215):** Exclude `<` from chevron pattern to prevent matching across XML elements:
```typescript
const unicodePattern = /«([^»<]+)»/g;
```

**Change 2 (line 230):** Exclude `<` from curly brace pattern:
```typescript
const curlyPattern = /\{\{([^}<|]+)(?:\s*\|\s*([^}<]+))?\}\}/g;
```

After normalization, properly consolidated tags contain no XML between their delimiters. Tags that span paragraphs (and couldn't be consolidated) will now be safely skipped instead of consuming content. No other files changed.

