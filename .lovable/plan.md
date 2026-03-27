

## Problem Root Cause

The template has **multiple merge tags** (`{{Property_Address}}`, `{{pr_p_address}}`, and individual `{{pr_p_street}}` etc.) that ALL resolve to property address data. Currently there is **no dedup between merge tags themselves** — only merge-tag-to-label dedup exists.

**Three sources of duplication:**
1. `{{pr_p_address}}` → resolves directly to `pr_p_address` → outputs multi-property combined value (2 addresses)
2. `{{Property_Address}}` → resolves via alias to `Property1.Address` → outputs single-property value
3. Individual `{{pr_p_street}}` `{{pr_p_city}}` etc. → these canonical keys get **overwritten** by property2's data (last-write-wins at line 245 of index.ts), showing property2's components without commas

The label dedup works correctly (labels ARE skipped), but merge tags never dedup against each other.

## Fix — 2 changes in 2 files

### Change 1: `supabase/functions/_shared/tag-parser.ts` — Merge tag dedup

In the merge tag processing loop (~line 1189-1228), add an "ultimate key" resolution step. For each tag, resolve its `canonicalKey` a second time through migration to find the ultimate data source key. Track these ultimate keys; if two merge tags share the same ultimate key, only the first one outputs data and subsequent ones output empty string. Also use the ultimate key for data lookup so the first tag gets the best (multi-property) value, and add it to `replacedFieldKeys` for label dedup.

```typescript
const resolvedDataKeys = new Set<string>(); // NEW

for (const tag of tags) {
  const canonicalKey = resolveFieldKeyWithMap(tag.tagName, mergeTagMap, validFieldKeys);
  // Resolve further through migration to find the "ultimate" field key
  const ultimateKey = resolveFieldKeyWithMap(canonicalKey, mergeTagMap, validFieldKeys);
  const ultimateKeyLower = ultimateKey.toLowerCase();

  replacedFieldKeys.add(canonicalKey);
  replacedFieldKeys.add(ultimateKey); // Also track ultimate key for label dedup

  // Dedup: if another merge tag already resolved to same ultimate key, blank this one
  if (resolvedDataKeys.has(ultimateKeyLower)) {
    tagReplacementMap.set(tag.fullMatch, "");
    continue;
  }
  resolvedDataKeys.add(ultimateKeyLower);

  // Use ultimateKey for data lookup (gets multi-property value)
  const resolved = getFieldData(ultimateKey, fieldValues);
  // ... rest of existing value formatting logic unchanged
}
```

### Change 2: `supabase/functions/generate-document/index.ts` — Prevent pr_p_* overwrite

At line 244-246, add a guard so that canonical `pr_p_*` keys are not overwritten by subsequent property entities. This prevents property2's individual field values from replacing property1's.

```typescript
// Line 244-246: change from
if (!canonicalHasIndex) {
  fieldValues.set(fieldDict.field_key, { rawValue, dataType });
}
// to
if (!canonicalHasIndex && !fieldValues.has(fieldDict.field_key)) {
  fieldValues.set(fieldDict.field_key, { rawValue, dataType });
}
```

### No changes to
- Database schema
- Frontend code
- Template files
- Label-based replacement logic
- Any other files

