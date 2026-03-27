

## Problem

When multiple properties exist, the property address fields (`pr_p_address`, `Property1.Address`) concatenate all addresses into a single unformatted line. The `all_properties_list` merge tag uses `\n` which Word XML ignores — it needs proper DOCX line breaks (`<w:br/>`).

## Root Cause

1. **`pr_p_address`** is computed only from `pr_p_*` component fields (property 1). When multiple properties exist, only the first property's address populates this key.
2. **`all_properties_list`** joins addresses with `"\n"`, but the tag replacement at line 1195 of `tag-parser.ts` XML-escapes the value and inserts it as plain text inside `<w:t>`. Word XML ignores plain newlines — they must be `<w:br/>` elements.

## Fix (2 changes, 1 file each)

### Change 1: Convert `\n` to DOCX line breaks during tag replacement
**File**: `supabase/functions/_shared/tag-parser.ts` (~line 1195-1200)

After XML-escaping the value, convert any `\n` characters to the DOCX line break sequence `</w:t><w:br/><w:t xml:space="preserve">`. This ensures multi-line values render as separate lines in Word.

```typescript
// After XML escaping (line 1199), add:
const xmlSafeValue = resolvedValue
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/\n/g, '</w:t><w:br/><w:t xml:space="preserve">');
```

### Change 2: Build `pr_p_address` as multi-property when multiple exist
**File**: `supabase/functions/generate-document/index.ts` (~line 570-585)

After auto-computing `pr_p_address` for property 1, if multiple properties exist, rebuild `pr_p_address` to include all property addresses joined with `\n` (which Change 1 will convert to `<w:br/>`).

```typescript
// After the existing pr_p_address auto-compute block (line 585), add:
if (propertyIndices.size > 1) {
  const sortedIndices = [...propertyIndices].sort((a, b) => a - b);
  const allAddresses: string[] = [];
  for (const idx of sortedIndices) {
    const addr = fieldValues.get(`property${idx}.address`)?.rawValue 
              || fieldValues.get(`Property${idx}.Address`)?.rawValue;
    if (addr) allAddresses.push(String(addr));
  }
  if (allAddresses.length > 1) {
    fieldValues.set("pr_p_address", { rawValue: allAddresses.join("\n"), dataType: "text" });
  }
}
```

Also update `all_properties_list` to omit the "Property N:" prefix since the user expects just addresses:
```typescript
propertyLines.push(String(addr));  // instead of `Property ${idx}: ${addr}`
```

### No changes to
- Database schema
- Frontend code
- Template files
- Document formatting logic (beyond newline handling)

