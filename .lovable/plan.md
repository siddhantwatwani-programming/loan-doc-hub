

## Deep Root Cause Analysis

### Evidence from Edge Function Logs

1. **Tag count mismatch**: "7 opening `{{` and 6 closing `}}` detected" — one tag's closing braces are missing after normalization
2. **`bk_p_brokerLicens` NOT in found tags**: "Found 5 merge tags: br_p_fullName, ln_p_loanNumber, bk_p_company, bk_p_firstName, bk_p_lastName" — the license tag was never parsed
3. **`bk_p_firstName`/`bk_p_lastName` ARE replaced**: Logs confirm "John" and "Peterson" are injected, yet the "Broker's Representative" line disappears from output
4. **Fragmented opening braces**: "Consolidated fragmented opening braces `{{`" — the `splitOpenBraces` regex fired, meaning `{` and `{` were in separate XML runs
5. **Contact data IS available**: The broker contact was fetched (`Fetched 1 contact(s)`) and `bk_p_brokerLicens` was set (line 339 in generate-document)

### Root Cause: `flattenMergeFieldStructures` regex failure

The template uses `{{bk_p_brokerLicens}}` as a **Word field code** (complex field with `fldChar begin/separate/end` markers). The `complexFieldPattern` regex (line 31 of tag-parser.ts) requires fldChar elements to be **self-closing** (`[^/]*\/>`):

```
<w:fldChar ... w:fldCharType="begin"[^/]*/>
```

But Word can also produce **non-self-closing** fldChar:

```
<w:fldChar w:fldCharType="begin"></w:fldChar>
```

When the regex doesn't match:
- The raw field code structure remains in the XML
- The `instrText` containing `{{bk_p_brokerLicens}}` is invisible to the merge tag parser (it only searches `<w:t>` content)
- The display text "John Peterson" (Word's cached display value) remains in a `<w:t>` element
- Subsequent `splitOpenBraces` consolidation partially extracts the `{{` from instrText, corrupting the XML structure
- This corruption also affects the adjacent "Broker's Representative" paragraph, causing it to disappear

### Fix: Single file change in `supabase/functions/_shared/tag-parser.ts`

**Update `flattenMergeFieldStructures`** to handle both self-closing and non-self-closing fldChar elements. The current fldChar sub-pattern:

```
<w:fldChar\s+[^>]*?w:fldCharType="begin"[^/]*\/>
```

Must be replaced with a pattern that matches either `/>` OR `></w:fldChar>`:

```
<w:fldChar\s+[^>]*?w:fldCharType="begin"[^>]*(?:\/>|>\s*<\/w:fldChar>)
```

This same change applies to all three fldChar positions (begin, separate, end) in the `complexFieldPattern` regex.

Additionally, add a **second-pass fallback** after `flattenMergeFieldStructures` that scans for any remaining `<w:instrText>` elements containing `{{fieldKey}}` patterns. If found and surrounded by fldChar structure, strip the entire field code and replace with a clean text run. This handles any other structural variations.

### What this does NOT change
- No database/schema changes
- No UI changes
- No changes to field-resolver, formatting, or docx-processor
- No changes to generate-document/index.ts
- No changes to contact lookup logic

