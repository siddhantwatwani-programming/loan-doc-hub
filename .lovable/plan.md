

## Root Cause Analysis

### Evidence from logs (deal DL-2026-0148)

1. **"7 opening `{{` and 6 closing `}}`"** — one `}}` is missing after normalization
2. **`bk_p_brokerLicens` NOT in found tags** — the tag was never assembled
3. **"Consolidated fragmented opening braces `{{`"** — `splitOpenBraces` fired, meaning the `{{` for `bk_p_brokerLicens` was split across XML runs
4. **"0 consolidated, 5 already complete"** — paragraph consolidation didn't help
5. **Fetched 1 contact (borrower only)** — broker contact BR-00005 doesn't exist in contacts table
6. **Broker deal section data**: `broker1.License = null` (license never entered in deal section)

### Root cause: `splitCloseBraces` regex too restrictive

The `splitOpenBraces` and `splitCloseBraces` regexes at lines 169/176 of `tag-parser.ts` only allow `<w:rPr>` as an optional element between `<w:r>` and `<w:t>`:

```
<w:r[^>]*>(?:\s*<w:rPr>[\s\S]*?<\/w:rPr>)?\s*<w:t[^>]*>
```

But Word can insert OTHER elements inside `<w:r>` before `<w:t>`, such as:
- `<w:fldChar/>` (field code markers)
- `<w:tab/>`
- `<w:br/>`
- `<w:lastRenderedPageBreak/>`

When the `}}` of `{{bk_p_brokerLicens}}` is split across XML runs and the intervening `<w:r>` contains a `<w:fldChar>` or similar element, `splitCloseBraces` fails to match. The closing `}}` remains fragmented, the tag never forms, and:
- `{{` persists as literal text in the output
- Word's cached display value ("John Peterson") bleeds through
- XML corruption from the orphaned braces causes the adjacent "Broker's Representative" paragraph to disappear

### Fix: Two changes in `supabase/functions/_shared/tag-parser.ts`

**Change 1**: Update `splitOpenBraces` and `splitCloseBraces` regexes to allow ANY elements between `<w:r>` and `<w:t>`, not just `<w:rPr>`. Replace the restrictive optional `<w:rPr>` block:

```
(?:\s*<w:rPr>[\s\S]*?<\/w:rPr>)?
```

With a permissive pattern that allows any non-`<w:t>` elements (self-closing or paired):

```
(?:\s*(?:<w:rPr>[\s\S]*?<\/w:rPr>|<w:(?!t[\s>])[^>]*(?:\/>|>[^<]*<\/w:[^>]+>)))*
```

This matches zero or more of: `<w:rPr>...</w:rPr>` OR any self-closing/paired `<w:*>` element that isn't `<w:t>`.

**Change 2**: Enhance `consolidateFragmentedTagsInParagraphs` to also extract text from `<w:instrText>` elements (not just `<w:t>`). Currently the function at line 372 only reads `<w:t>` content. If a `}` character is inside `<w:instrText>`, it's invisible to the consolidation logic. Add `<w:instrText>` as an additional source for text content extraction in the join pass.

### What this does NOT change
- No database/schema changes
- No UI changes  
- No changes to field-resolver, formatting, or docx-processor
- No changes to generate-document/index.ts
- No changes to contact lookup logic
- No changes to `flattenMergeFieldStructures` or the fldChar regex (previous fix remains)

