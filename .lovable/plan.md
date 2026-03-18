

## Plan: Preserve Signature Section on Page 2 During Generation

### Problem
When the "Declaration of Oral Disclosure With Field Codes" template is re-uploaded, the previously injected `<w:pageBreakBefore>` page break is lost. The generation engine then produces a document where the Signature section shifts off Page 2 due to content length changes from merge tag replacement.

### Root Cause
The fix was applied directly to the stored template file. Each re-upload overwrites it. The fix must instead live in the **generation pipeline** so it applies automatically regardless of which template file is uploaded.

### Solution
Add a post-processing step in `supabase/functions/_shared/docx-processor.ts` that runs **after** merge tag replacement. It will:

1. Scan the processed `word/document.xml` for a paragraph containing the text `Signature:` (the distinctive marker of the signature block)
2. If found, check whether that paragraph already has `<w:pageBreakBefore/>`
3. If not, inject `<w:pageBreakBefore w:val="1"/>` into its `<w:pPr>` block (creating one if absent)

This ensures the Signature section always starts on a new page, regardless of how content above it reflows after tag replacement.

### File Changed
**`supabase/functions/_shared/docx-processor.ts`** — Add ~20 lines after the `replaceMergeTags` call (around line 43) to post-process only `word/document.xml`:

```typescript
// After replaceMergeTags, ensure Signature paragraph has page break
if (filename === "word/document.xml") {
  processedXml = ensureSignaturePageBreak(processedXml);
}
```

The `ensureSignaturePageBreak` function will:
- Match the `<w:p>` containing `Signature:` followed by underscores
- Insert `<w:pageBreakBefore w:val="1"/>` into its `<w:pPr>` if missing
- If no `<w:pPr>` exists, wrap the property in a new `<w:pPr>` block
- Leave all other paragraphs untouched

### What is NOT Changed
- No UI changes
- No database changes
- No changes to tag-parser.ts, formatting.ts, field-resolver.ts, or generate-document/index.ts
- No changes to upload-template or template management flows
- No other templates affected (the pattern targets `Signature:` + underscores specifically)
- Empty merge tags continue to be replaced with blank space (existing behavior, per user preference)

