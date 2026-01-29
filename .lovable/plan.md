

# Simplify Document Tag System: Use Field Keys Directly

## Problem Statement

The current system has two separate mapping layers:
1. **Field Dictionary** - defines `field_key` like `Borrower.Address`
2. **Merge Tag Aliases** - maps document tags to field keys

This creates confusion because:
- Users see `Borrower.Address` in the Field Dictionary
- But templates might need `{{Borrower_Address}}` with an alias
- Missing aliases cause silent failures during document generation

## Proposed Solution

Refactor the system to use `field_key` directly as the document tag, eliminating the mandatory alias requirement.

### New Behavior

| Template Tag | Lookup Order |
|-------------|--------------|
| `{{Borrower.Address}}` | 1. Check `merge_tag_aliases` for override<br>2. **NEW**: Check if `Borrower.Address` exists in `field_dictionary`<br>3. Case-insensitive fallback |

### Implementation Changes

#### 1. Update `field-resolver.ts`

Modify `resolveFieldKeyWithMap` to also query field_dictionary:

```typescript
export function resolveFieldKeyWithMap(
  tagName: string, 
  mergeTagMap: Record<string, string>,
  validFieldKeys: Set<string>  // NEW: pass known field keys
): string {
  const cleanedTag = tagName.replace(/_+$/, "").trim();
  
  // Priority 1: Explicit alias mapping
  if (mergeTagMap[tagName]) return mergeTagMap[tagName];
  if (mergeTagMap[cleanedTag]) return mergeTagMap[cleanedTag];
  
  // Priority 2: Direct field_key match (exact or case-insensitive)
  if (validFieldKeys.has(tagName)) return tagName;
  if (validFieldKeys.has(cleanedTag)) return cleanedTag;
  
  // Case-insensitive check
  const lowerTag = tagName.toLowerCase();
  for (const key of validFieldKeys) {
    if (key.toLowerCase() === lowerTag) return key;
  }
  
  // Fallback: return as-is (might not match)
  return tagName;
}
```

#### 2. Update `generate-document/index.ts`

Pass the set of valid field keys to the resolver:

```typescript
// Build set of valid field keys from field_dictionary
const validFieldKeys = new Set<string>();
allFieldDictEntries.forEach(fd => validFieldKeys.add(fd.field_key));

// Pass to docx processor
const processedDocx = await processDocx(
  templateBuffer, 
  fieldValues, 
  fieldTransforms, 
  mergeTagMap, 
  labelMap,
  validFieldKeys  // NEW parameter
);
```

#### 3. Update `tag-parser.ts`

Add `validFieldKeys` parameter to `replaceMergeTags`:

```typescript
export function replaceMergeTags(
  content: string,
  fieldValues: Map<string, FieldValueData>,
  fieldTransforms: Map<string, string>,
  mergeTagMap: Record<string, string>,
  labelMap: Record<string, LabelMapping>,
  validFieldKeys: Set<string>  // NEW
): string {
  // Use validFieldKeys in resolution
}
```

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/_shared/field-resolver.ts` | Add `validFieldKeys` parameter to resolution |
| `supabase/functions/_shared/tag-parser.ts` | Pass `validFieldKeys` through to resolver |
| `supabase/functions/_shared/docx-processor.ts` | Accept and forward `validFieldKeys` |
| `supabase/functions/generate-document/index.ts` | Build `validFieldKeys` set and pass it |
| `supabase/functions/validate-template/index.ts` | Same updates for validation |

### Backward Compatibility

The `merge_tag_aliases` table remains for:
- **Legacy templates** using non-standard naming (underscores, F-codes)
- **Static labels** requiring `replaceNext` logic
- **Explicit overrides** when needed

But for new templates, you can simply use `{{Borrower.Address}}` directly if that's the `field_key` in the dictionary.

### Validation Enhancement

Update template validation to show:
- Tags that match field_keys directly (valid)
- Tags that match via alias (valid)
- Tags with no match (requires alias or dictionary entry)

### Summary

After this change:
1. **Template authors** can use `{{field_key}}` directly from the Field Dictionary
2. **Aliases remain optional** for legacy/special cases
3. **Validation** clearly shows which tags are resolved and how
4. **No silent failures** - unresolved tags are explicitly flagged

