

# Plan: Fix Document Formatting Corruption During Generation

## Root Cause

In `tag-parser.ts` lines 77-88, three global XML element removals run against the **entire** document XML before any tag detection:

```text
Line 77:  Remove ALL <w:proofErr.../> (spell-check markers)
Line 86:  Remove ALL <w:lastRenderedPageBreak/> (page break hints)  
Line 87-88: Remove ALL <w:bookmarkStart.../> and <w:bookmarkEnd.../>
```

These are applied to **every paragraph** in the document — even paragraphs with zero merge tags. This causes:

- **Page structure changes**: `lastRenderedPageBreak` tells Word where page breaks were. Removing it forces Word to recalculate, shifting content across pages.
- **Bookmark loss**: `bookmarkStart/End` are used for cross-references, TOC entries, form fields, and cursor positioning. Removing them corrupts document structure.
- **Dirty XML triggering re-encoding**: Even if no merge tags exist in the document, these removals make the XML differ from the original, causing the docx-processor to re-encode the entire file (instead of preserving original bytes).

A 6-page template with tags only in page 1 still gets all bookmarks, page breaks, and proof markers stripped from all 6 pages.

## Fix (Single File Change)

**File**: `supabase/functions/_shared/tag-parser.ts`

**Change**: Replace the 3 global removal lines (77, 86-88) with paragraph-scoped removals that only strip these elements from paragraphs containing merge tag delimiters (`{{`, `}}`, `«`, `»`).

```text
Before (global):
  result = result.replace(/<w:proofErr[^/]*\/>/g, '');
  result = result.replace(/<w:lastRenderedPageBreak\/>/g, '');
  result = result.replace(/<w:bookmarkStart[^/]*\/>/g, '');
  result = result.replace(/<w:bookmarkEnd[^/]*\/>/g, '');

After (scoped to tag-containing paragraphs only):
  result = result.replace(/<w:p[\s>][\s\S]*?<\/w:p>/g, (para) => {
    // Only strip in paragraphs that contain merge tag delimiters
    if (!para.includes('{') && !para.includes('«') && !para.includes('»')) {
      return para;
    }
    let cleaned = para;
    cleaned = cleaned.replace(/<w:proofErr[^/]*\/>/g, '');
    cleaned = cleaned.replace(/<w:lastRenderedPageBreak\/>/g, '');
    cleaned = cleaned.replace(/<w:bookmarkStart[^/]*\/>/g, '');
    cleaned = cleaned.replace(/<w:bookmarkEnd[^/]*\/>/g, '');
    return cleaned;
  });
```

This preserves all structural elements in non-tag paragraphs (the vast majority of the document), maintaining identical page count, spacing, alignment, and bookmark structure.

## No Other Changes

- No UI/component changes
- No database/schema changes  
- No template file changes
- No changes to docx-processor.ts or field-resolver.ts

