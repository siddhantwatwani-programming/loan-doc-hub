

## Fix: Document Formatting Changes During Generation

### Root Cause

The `normalizeWordXml` function in `tag-parser.ts` strips three types of **content-bearing** inline elements that directly affect document layout:

| Element | Purpose | Impact of Removal |
|---------|---------|------------------|
| `<w:tab/>` | Tab character (alignment stops) | Text shifts position, columns misalign |
| `<w:noBreakHyphen/>` | Non-breaking hyphen character | Words that should stay together may reflow |
| `<w:softHyphen/>` | Optional hyphen (line break hint) | Line breaks may change |

These were being stripped at lines 33-35 alongside actual metadata elements (`proofErr`, `lastRenderedPageBreak`, `bookmarkStart/End`) that are safe to remove. But `<w:tab/>`, `<w:noBreakHyphen/>`, and `<w:softHyphen/>` represent **visible document content** — removing them destroys the template's spacing, alignment, and line structure.

### Fix

**File: `supabase/functions/_shared/tag-parser.ts`** — Remove lines 33-35 that strip these three content elements.

The remaining strippable elements (`proofErr`, `lastRenderedPageBreak`, `bookmarkStart/End`) are pure metadata with no visual effect and are safe to keep removing.

No other files changed. No database, UI, or other logic modifications.

