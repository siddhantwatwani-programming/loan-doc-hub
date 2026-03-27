

## Problem Analysis

After tracing the full document generation pipeline, I found **two root causes** for the incorrect property address output:

### Root Cause 1: Missing `country` in per-property address auto-compute

At line 560 of `generate-document/index.ts`, each property's address is auto-computed as:
```typescript
const parts = [street, city, county, state, zip]
```

But `country` is not included. When the multi-property rebuild (line 587-607) aggregates `propertyN.address` values into `pr_p_address`, the country field is missing from each property's address string.

The canonical `pr_p_address` auto-compute (line 579) correctly includes country:
```typescript
const parts = [street, city, state, country, zip]
```

This inconsistency means the aggregated multi-property output loses the country field.

### Root Cause 2: No deduplication of identical addresses in `propertyLines`

At line 590-596, the `propertyLines` array collects addresses from all property indices but never deduplicates. If the same address string exists for multiple properties (e.g., due to data duplication), it appears multiple times in the output.

## Fix — 2 minimal changes in 1 file

**File**: `supabase/functions/generate-document/index.ts`

### Change 1: Add `country` to per-property address auto-compute (line 560)

```typescript
// Current (line 554-562):
const street = fieldValues.get(`${prefix}.street`)?.rawValue;
const city = fieldValues.get(`${prefix}.city`)?.rawValue;
const state = fieldValues.get(`${prefix}.state`)?.rawValue;
const zip = fieldValues.get(`${prefix}.zip`)?.rawValue;
const county = fieldValues.get(`${prefix}.county`)?.rawValue;
const parts = [street, city, county, state, zip].filter(Boolean).map(String);

// Fixed:
const street = fieldValues.get(`${prefix}.street`)?.rawValue;
const city = fieldValues.get(`${prefix}.city`)?.rawValue;
const state = fieldValues.get(`${prefix}.state`)?.rawValue;
const zip = fieldValues.get(`${prefix}.zip`)?.rawValue;
const county = fieldValues.get(`${prefix}.county`)?.rawValue;
const country = fieldValues.get(`${prefix}.country`)?.rawValue;
const parts = [street, city, state, country, zip].filter(Boolean).map(String);
```

This matches the canonical `pr_p_address` format: street, city, state, country, zip.

### Change 2: Deduplicate `propertyLines` before joining (line 590-604)

```typescript
// Current:
const propertyLines: string[] = [];
for (const idx of sortedIndices) { ... propertyLines.push(String(addr)); }

// Fixed — deduplicate identical addresses:
const propertyLines: string[] = [];
const seenAddresses = new Set<string>();
for (const idx of sortedIndices) {
  const addr = fieldValues.get(`property${idx}.address`)?.rawValue || fieldValues.get(`Property${idx}.Address`)?.rawValue;
  if (addr) {
    const addrStr = String(addr);
    if (!seenAddresses.has(addrStr)) {
      seenAddresses.add(addrStr);
      propertyLines.push(addrStr);
    }
  }
}
```

### No changes to
- Database schema
- Frontend code
- Template files
- tag-parser.ts (dedup logic already working correctly)
- Label-based or merge-tag replacement logic
- Any other files

