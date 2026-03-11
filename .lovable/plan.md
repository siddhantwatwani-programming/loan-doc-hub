

## Deep Analysis: Document Generation Field Population & Layout Issues

### Root Cause

The edge function logs definitively show **"Found 0 merge tags"** and **"0 paragraphs with braces"** across ALL XML files processed. Yet some fields DO populate (br_p_fullName, borrower.address). This contradiction means:

1. The template uses **Word MERGEFIELD structures** (`<w:fldChar>`/`<w:instrText>`), not literal `{{}}` text
2. The document parser displays these as `{{fieldName}}` for readability, but the actual XML contains field instruction markup
3. The `normalizeWordXml` function has no handler to **flatten MERGEFIELD structures into plain text** — it only consolidates split `<w:instrText>` elements (line 71-76), but never converts the complete field structure (begin/instrText/separate/display/end) into a simple `«fieldName»` text run
4. Fields that DO populate likely have their `«fieldName»` display text intact in a single `<w:t>` element. Fields that DON'T (like `ln_p_loanNumber`) have fragmented display text that no existing regex catches

The **cross-paragraph consumption** on the Account Number line happens because the fragmented field structure leaves orphan characters that corrupt subsequent text during replacement.

### Fix

**File: `supabase/functions/_shared/tag-parser.ts`** — Add a `flattenMergeFieldStructures` function called at the START of `normalizeWordXml`:

1. **Flatten complex MERGEFIELD structures** (`<w:fldChar>`-based): Match the full begin→instrText→separate→display→end sequence. Extract the field name from `<w:instrText>`. Replace the entire structure with a single `<w:r>` containing `«fieldName»` as text, preserving the display run's `<w:rPr>` formatting.

2. **Flatten `<w:fldSimple>` wrappers**: Strip the `<w:fldSimple w:instr="...">...</w:fldSimple>` wrapper, keeping inner content. Then ensure the inner text contains `«fieldName»` derived from the `w:instr` attribute.

3. **Add filename logging** in `processDocx` (`docx-processor.ts`) so logs can be correlated to specific XML files.

```text
normalizeWordXml flow (updated):
  1. NEW: flattenMergeFieldStructures     ← converts MERGEFIELD XML to «fieldName» text
  2. Strip proofErr, bookmarks            ← existing
  3. Regex-based fragmentation fixes       ← existing
  4. Paragraph-level consolidation         ← existing
  5. Tag detection now finds clean «» tags ← existing (now works)
```

**File: `supabase/functions/_shared/docx-processor.ts`** — Add `console.log` with filename for each processed XML file.

### Technical Detail

The `flattenMergeFieldStructures` function handles two patterns:

**Pattern A — Complex fields:**
```xml
<w:r><w:fldChar w:fldCharType="begin"/></w:r>
<w:r><w:instrText> MERGEFIELD ln_p_loanNumber </w:instrText></w:r>
<w:r><w:fldChar w:fldCharType="separate"/></w:r>
<w:r><w:rPr><w:b/></w:rPr><w:t>«ln_p_loanNumber»</w:t></w:r>
<w:r><w:fldChar w:fldCharType="end"/></w:r>
```
→ Converted to: `<w:r><w:rPr><w:b/></w:rPr><w:t>«ln_p_loanNumber»</w:t></w:r>`

**Pattern B — Simple fields:**
```xml
<w:fldSimple w:instr=" MERGEFIELD br_p_fullName \* MERGEFORMAT ">
  <w:r><w:t>«br_p_fullName»</w:t></w:r>
</w:fldSimple>
```
→ Converted to: `<w:r><w:t>«br_p_fullName»</w:t></w:r>`

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/_shared/tag-parser.ts` | Add `flattenMergeFieldStructures` function (~40 lines); call it at start of `normalizeWordXml` |
| `supabase/functions/_shared/docx-processor.ts` | Add filename logging (~1 line) |

No changes to UI, database, existing normalization regexes, replacement logic, formatting, or any other functionality.

