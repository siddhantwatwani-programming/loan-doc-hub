

# Plan: Fix Document Formatting Corruption During Generation

## Root Cause Analysis

After deep investigation of the entire generation pipeline (`tag-parser.ts`, `docx-processor.ts`, `field-resolver.ts`, `generate-document/index.ts`), I identified **three distinct corruption sources** that collectively cause page layout shifts, spacing changes, and structural damage:

### Corruption Source 1: Overly broad paragraph matching (HIGH IMPACT)
**File**: `tag-parser.ts`, line 80

```text
Current:  if (!para.includes('{') && !para.includes('«') && !para.includes('»'))
Problem:  Single '{' matches ANY paragraph with a curly brace — not just merge tags
```

Word documents contain `{` in field codes, formulas, legal citations, and other non-tag contexts. Every such paragraph gets `<w:lastRenderedPageBreak/>`, `<w:bookmarkStart/>`, `<w:bookmarkEnd/>`, and `<w:proofErr/>` stripped — destroying page break hints and cross-references throughout the document. This is the primary cause of page count changes and layout shifts.

**Fix**: Change the check to require actual merge tag delimiters: `{{` (double brace), `«`, or `»`.

### Corruption Source 2: Fragmented dot/underscore consolidation uses same broad check (MEDIUM IMPACT)
**File**: `tag-parser.ts`, lines 123, 163, 179

The paragraph containment checks for fragmented underscore and dot consolidation also use `paragraph.includes('{')` — catching paragraphs with single `{` characters. When consolidation fires, it collapses multiple XML `<w:r>` runs into plain text, destroying run-level formatting (bold/italic/font transitions within the paragraph).

**Fix**: Same pattern — require `{{` instead of `{`.

### Corruption Source 3: Unbalanced brace detection causes malformed tag processing (LOW IMPACT)
**File**: `tag-parser.ts`, lines 1057-1068

The edge function logs show `6 opening {{ and 5 closing }}` — an unbalanced count. The `parseWordMergeFields` curly pattern `([^}<|]+)` does not exclude `{`, so a stray `{{{field}}` gets captured with `tagName = "{{field"`. The cleanup then does `result.split(tag.fullMatch).join('')`, which could match unintended document content.

**Fix**: Add `{` to the exclusion set in the curly pattern capture group.

## Implementation (Single File: `tag-parser.ts`)

### Change 1: Line 80 — Tighten paragraph delimiter check
```text
Before: if (!para.includes('{') && !para.includes('\u00AB') && !para.includes('\u00BB'))
After:  if (!para.includes('{{') && !para.includes('\u00AB') && !para.includes('\u00BB'))
```

### Change 2: Lines 123, 163, 179 — Tighten paragraph containment checks in fragmented consolidation
Replace all three instances of:
```text
paragraph.includes('{') && paragraph.includes('}')
```
with:
```text
paragraph.includes('{{') && paragraph.includes('}}')
```

### Change 3: Line 420 — Fix curly pattern capture to exclude `{`
```text
Before: const curlyPattern = /\{\{([^}<|]+)(?:\s*\|\s*([^}<]+))?\}\}/g;
After:  const curlyPattern = /\{\{([^{}<|]+)(?:\s*\|\s*([^{}<]+))?\}\}/g;
```

## What This Does NOT Change
- No UI/component changes
- No database/schema changes
- No template file changes
- No changes to `docx-processor.ts`, `field-resolver.ts`, or `generate-document/index.ts`
- Label-based replacement stays (per user preference)
- Missing values still blank in place (per user preference)
- All existing merge tag detection, resolution, and formatting logic remains identical

## Expected Outcome
- Paragraphs without actual merge tags are left completely untouched (bit-for-bit identical to template)
- Page break hints (`<w:lastRenderedPageBreak/>`) preserved in all non-tag paragraphs
- Bookmarks preserved in all non-tag paragraphs
- Run-level formatting preserved in non-tag paragraphs
- Only paragraphs containing `{{...}}` or `«...»` get structural cleanup for tag processing

