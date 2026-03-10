

## Fix: Cross-Paragraph Content Consumption in Tag Normalization

### Root Cause

The `curlyFragmentedPattern` regex in `normalizeWordXml` (tag-parser.ts, line 96) can match across paragraph boundaries, consuming entire pages of content:

```javascript
const curlyFragmentedPattern = /\{\{((?:[A-Za-z0-9_.| ]|<[^>]*>|\s)*?)\}\}/g;
```

Three factors combine to cause catastrophic content loss:

1. **`<[^>]*>`** matches ANY XML tag, including paragraph boundaries (`</w:p>`, `<w:p>`)
2. **`\s`** matches newlines between paragraphs
3. **Space (` `) in `[A-Za-z0-9_.| ]`** allows body text words to match

When a `{{tag}}` is fragmented such that `}}` lands in a different run, the regex searches forward for the next `}}`. It traverses paragraph boundaries (matched by `<[^>]*>` and `\s`) and body text (matched by alphanumeric chars and spaces). When it finds a `}}` from a tag pages later, the `cleanText` (XML-stripped, whitespace-removed) can match `[A-Za-z0-9_.]+` if the intermediate text has no punctuation before the first comma/parenthesis. The consolidation then replaces ALL matched content with `{{cleanText}}`, destroying pages of document content.

This explains:
- **4 pages missing**: Content between `{{ln_p_loanNumber` and a `}}` pages later was consumed
- **"Account Number: {{R Ekambaram"**: The `{{` survived, intermediate content was consumed, and "R Ekambaram" (resolved from a later tag) follows

The same vulnerability exists in the chevron `fragmentedPattern` (line 36) and `chevronFragmented` (line 191).

### Fix

**File: `supabase/functions/_shared/tag-parser.ts`** — 3 targeted regex changes:

**Change 1 (line 96):** Block paragraph boundaries in `curlyFragmentedPattern`:
```typescript
// Before:
const curlyFragmentedPattern = /\{\{((?:[A-Za-z0-9_.| ]|<[^>]*>|\s)*?)\}\}/g;

// After — negative lookahead prevents matching </w:p> and <w:p> tags:
const curlyFragmentedPattern = /\{\{((?:[A-Za-z0-9_.| ]|<(?!\/w:p>|w:p[\s>\/])[^>]*>|[ \t])*?)\}\}/g;
```
Two changes: (a) `<[^>]*>` → `<(?!\/w:p>|w:p[\s>\/])[^>]*>` blocks paragraph boundaries, (b) `\s` → `[ \t]` restricts to horizontal whitespace only (no newlines across paragraphs).

**Change 2 (line 36):** Same fix for chevron `fragmentedPattern`:
```typescript
// Before:
const fragmentedPattern = /«((?:<[^>]*>|\s)*?)([A-Za-z0-9_.]+)((?:<[^>]*>|\s)*?)»/g;

// After:
const fragmentedPattern = /«((?:<(?!\/w:p>|w:p[\s>\/])[^>]*>|[ \t])*?)([A-Za-z0-9_.]+)((?:<(?!\/w:p>|w:p[\s>\/])[^>]*>|[ \t])*?)»/g;
```

**Change 3 (line 191):** Same fix for final `chevronFragmented`:
```typescript
// Before:
const chevronFragmented = /«((?:[^»]|<[^>]*>)*)»/g;

// After:
const chevronFragmented = /«((?:[^»<]|<(?!\/w:p>|w:p[\s>\/])[^>]*>)*)»/g;
```

No other files changed. No database, UI, or other logic modifications.

