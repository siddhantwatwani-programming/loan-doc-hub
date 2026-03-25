

# Fix: Document Generation "CPU Time exceeded" Error

## Root Cause Analysis

The edge function logs show the document **does process** the 628KB `word/document.xml` and even produces the output (750,255 bytes), but then hits the **2-second CPU time limit** before completing the upload/storage step. On subsequent attempts, it times out during tag processing itself.

The core problem is **O(n) linear scans in hot loops** inside two critical resolution functions that are called for every merge tag, every label, and every conditional check:

1. **`getFieldData()`** (field-resolver.ts lines 264-292): Performs up to **3 separate linear scans** of all `fieldValues` entries (137+ items) on every call that misses the exact match. Called ~19 times for merge tags + ~48 times for labels + conditionals = **~70+ calls**, each scanning 137+ entries up to 3 times.

2. **`resolveFieldKeyWithBackwardCompat()`** (field-resolver.ts lines 214-225): Performs up to **2 separate linear scans** of `validFieldKeys` (3,132 entries!) for case-insensitive matching. Called for every tag resolution. This means up to **6,264 string comparisons per tag** × ~70 calls = **~438,000 string operations**.

Combined, these O(n) lookups accumulate massive CPU time that pushes the function past the 2-second limit on large templates.

## Solution

Build **one-time lowercase lookup Maps** for both `fieldValues` and `validFieldKeys`, converting the O(n) linear scans into O(1) Map lookups. This eliminates ~400,000+ unnecessary string comparisons.

### Changes (single file: `supabase/functions/_shared/field-resolver.ts`)

**1. Add pre-built lowercase index to `getFieldData()`**

Add a module-level index that builds a `Map<lowercaseKey, originalKey>` from the fieldValues map on first call (or when the map reference changes). Replace the 3 linear scans with direct Map lookups.

```text
Before (3 × O(n) per call):
  for (const [k, v] of fieldValues.entries()) {
    if (k.toLowerCase() === target) return ...

After (O(1) per call):
  const lowerMap = buildLowerIndex(fieldValues);
  const found = lowerMap.get(target);
  if (found) return { key: found, data: fieldValues.get(found)! };
```

**2. Add pre-built lowercase index to `resolveFieldKeyWithBackwardCompat()`**

Build a `Map<lowercaseKey, originalKey>` from `validFieldKeys` once per generation run. Replace the 2 linear scans with Map lookups.

```text
Before (2 × O(3132) per call):
  for (const key of validFieldKeys) {
    if (key.toLowerCase() === lowerTag) return key;
  }

After (O(1) per call):
  const lowerValidKeys = buildValidKeysIndex(validFieldKeys);
  const match = lowerValidKeys.get(lowerTag);
  if (match) return match;
```

### What This Does NOT Change
- No changes to the document generation flow, UI, database schema, or any other files
- No changes to tag-parser.ts, docx-processor.ts, or generate-document/index.ts
- No changes to resolution priority order or backward compatibility behavior
- The same field keys resolve to the same values; only the lookup mechanism changes from linear scan to hash map

### Expected Impact
- Eliminates ~400,000+ string comparisons per document generation
- Reduces CPU time from the critical O(n²) pattern to O(n)
- Should bring total CPU usage well within the 2-second limit

