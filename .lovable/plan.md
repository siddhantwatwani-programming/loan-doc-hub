

## Problem Root Cause

The property address appears 3 times because **three separate replacement mechanisms** all resolve to the same `pr_p_address` combined value:

1. **Merge tag** `{{pr_p_address}}` → resolves directly → combined "addr1\naddr2" (with proper `w:br` conversion)
2. **Label** `PROPERTY ADDRESS:` → mapping.fieldKey = `Property1.Address` → migrates to `pr_p_address` → combined value inserted **without XML escaping or line breaks**
3. **Label** `Property Address` (replaceNext) → same chain → combined value inserted **again**

The `replacedFieldKeys` dedup check at line 589 of `tag-parser.ts` only checks if `mapping.fieldKey` ("Property1.Address") is in the set — but the merge tag added `pr_p_address` to the set. Different keys, same data → no dedup.

Additionally, label-based replacement inserts raw values without XML escaping or `\n→<w:br/>` conversion, so even if only labels fired, newlines wouldn't render.

## Fix — 2 changes in 1 file

**File**: `supabase/functions/_shared/tag-parser.ts`

### Change 1: Dedup labels against resolved keys (not just mapping keys)

In `replaceLabelBasedFields` (~line 588-601), after the existing `replacedFieldKeyLowers` check, also resolve the label's `mapping.fieldKey` through migration/canonical resolution and check if the **resolved** key is already in `replacedFieldKeys`. This prevents labels from re-inserting data that a merge tag already handled.

```typescript
// After line 589 check, add:
const resolvedKey = mergeTagMap && validFieldKeys
  ? resolveFieldKeyWithMap(mapping.fieldKey, mergeTagMap, validFieldKeys)
  : mapping.fieldKey;
if (resolvedKey !== mapping.fieldKey && replacedFieldKeyLowers?.has(resolvedKey.toLowerCase())) {
  continue;
}
```

### Change 2: XML-escape and convert \n in label-based replacement values

In `replaceLabelBasedFields`, after computing `formattedValue` (~line 641), apply the same XML escaping and `\n→<w:br/>` conversion that merge tag replacement uses:

```typescript
formattedValue = formattedValue
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/\n/g, '</w:t><w:br/><w:t xml:space="preserve">');
```

This ensures that even when labels DO fire for multi-line values, the output renders correctly in Word.

### No changes to
- `generate-document/index.ts`
- Database schema
- Frontend code
- Template files
- Any other files

