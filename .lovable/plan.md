

## Fix: Merge Tags Not Detected Due to XML Whitespace Between Runs

### Root Cause

All fragmentation-handling regex patterns in `normalizeWordXml` assume XML elements are tightly packed (no whitespace between `</w:t>`, `</w:r>`, `<w:r>`, `<w:t>`). In practice, Word DOCX XML commonly includes newlines and indentation between these elements:

```xml
<w:r>
  <w:rPr><w:b/></w:rPr>
  <w:t>{</w:t>
</w:r>
<w:r>
  <w:t>{br_p_fullName}}</w:t>
</w:r>
```

The current `splitOpenBraces` pattern:
```
/\{((?:<\/w:t><\/w:r><w:r[^>]*>...)+)\{/g
```
requires `</w:t></w:r><w:r>` with NO whitespace between tags. When whitespace exists, the brace consolidation fails, so `{{` never appears as a literal pair. Subsequently, `curlyFragmentedPattern` (which requires `{{` to start) can't match either, and `curlyPattern` in `parseWordMergeFields` can't match because XML tags are between the field name characters.

This explains why the logs show **"Found 0 merge tags"** and all `{{br_p_fullName}}`, `{{ln_p_loanNumber}}`, etc. remain unreplaced in the generated document.

Additionally, the previous fix changed `\s` to `[ \t]` in `curlyFragmentedPattern`, `fragmentedPattern`, and `chevronFragmented` to block cross-paragraph matching. This was overly restrictive — it blocks newlines within the XML of a **single** paragraph. The paragraph boundary protection (negative lookahead on `</w:p>` and `<w:p>`) is sufficient; `\s` can safely be restored.

### Fix

**File: `supabase/functions/_shared/tag-parser.ts`** — 6 targeted changes:

**Change 1 (line 36):** Restore `\s` in `fragmentedPattern`:
```typescript
const fragmentedPattern = /«((?:<(?!\/w:p>|w:p[\s>\/])[^>]*>|\s)*?)([A-Za-z0-9_.]+)((?:<(?!\/w:p>|w:p[\s>\/])[^>]*>|\s)*?)»/g;
```

**Change 2 (line 45-49):** Add `\s*` between XML elements in chevron fragmentation:
```typescript
const leftChevronFragmented = /«((?:\s*<\/w:t>\s*<\/w:r>\s*<w:r(?:[^>]*)>\s*<w:t(?:[^>]*)>)+)/g;
const rightChevronFragmented = /((?:\s*<\/w:t>\s*<\/w:r>\s*<w:r(?:[^>]*)>\s*<w:t(?:[^>]*)>)+)»/g;
```

**Change 3 (line 52):** Add `\s*` in `fragmentedUnderscore`:
```typescript
const fragmentedUnderscore = /([A-Za-z0-9]+)(\s*<\/w:t>\s*<\/w:r>\s*<w:r(?:[^>]*)>(?:\s*<w:rPr>[\s\S]*?<\/w:rPr>)?\s*<w:t(?:[^>]*)>)_(\s*<\/w:t>\s*<\/w:r>\s*<w:r(?:[^>]*)>(?:\s*<w:rPr>[\s\S]*?<\/w:rPr>)?\s*<w:t(?:[^>]*)>)?([A-Za-z0-9]+)/g;
```

**Change 4 (lines 56, 63):** Add `\s*` in `splitOpenBraces` and `splitCloseBraces`:
```typescript
const splitOpenBraces = /\{((?:\s*<\/w:t>\s*<\/w:r>\s*<w:r[^>]*>(?:\s*<w:rPr>[\s\S]*?<\/w:rPr>)?\s*<w:t[^>]*>)+)\{/g;
const splitCloseBraces = /\}((?:\s*<\/w:t>\s*<\/w:r>\s*<w:r[^>]*>(?:\s*<w:rPr>[\s\S]*?<\/w:rPr>)?\s*<w:t[^>]*>)+)\}/g;
```

**Change 5 (lines 79, 87):** Add `\s*` in `fragmentedDot` and `fragmentedDotInRun`:
```typescript
const fragmentedDot = /([A-Za-z0-9_]+)((?:\s*<\/w:t>\s*<\/w:r>\s*<w:r[^>]*>(?:\s*<w:rPr>[\s\S]*?<\/w:rPr>)?\s*<w:t[^>]*>)+)\.([A-Za-z0-9_]+)/g;

const fragmentedDotInRun = /([A-Za-z0-9_]+)\s*<\/w:t>\s*<\/w:r>\s*<w:r[^>]*>(?:\s*<w:rPr>[\s\S]*?<\/w:rPr>)?\s*<w:t[^>]*>\.\s*<\/w:t>\s*<\/w:r>\s*<w:r[^>]*>(?:\s*<w:rPr>[\s\S]*?<\/w:rPr>)?\s*<w:t[^>]*>([A-Za-z0-9_]+)/g;
```

**Change 6 (line 96):** Restore `\s` in `curlyFragmentedPattern`:
```typescript
const curlyFragmentedPattern = /\{\{((?:[A-Za-z0-9_.| ]|<(?!\/w:p>|w:p[\s>\/])[^>]*>|\s)*?)\}\}/g;
```

### Safety

The paragraph boundary protection (`<(?!\/w:p>|w:p[\s>\/])`) prevents all these patterns from crossing paragraph boundaries. Restoring `\s` and adding `\s*` only allows matching whitespace that exists between XML elements within the same paragraph — which is standard DOCX formatting.

No other files changed. No database, UI, or other logic modifications.

