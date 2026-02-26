

## Problem

The template contains both a merge tag `{{property1.address}}` AND a label alias `('Property Address', 'Property1.Address', 'label', 'Property Address')` with `replaceNext = 'Property Address'`.

Here's what happens during document generation:

1. The merge tag `{{property1.address}}` is processed first. The canonical key `property1.address` (lowercase) is added to `replacedFieldKeys`.
2. Label-based replacement then checks if `Property1.Address` (mixed case, from the label alias) is in `replacedFieldKeys` — but the check at line 162 is **case-sensitive**.
3. `replacedFieldKeys.has("Property1.Address")` returns `false` because only `"property1.address"` is in the set.
4. The label replacement proceeds, finds "Property Address" text in the document, and replaces the label text itself with the address value — removing the label.

## Fix

**File: `supabase/functions/_shared/tag-parser.ts`**

Make the `replacedFieldKeys` check in `replaceLabelBasedFields` case-insensitive (lines 161-165).

Replace:
```typescript
if (replacedFieldKeys?.has(mapping.fieldKey)) {
```

With:
```typescript
const fieldKeyLower = mapping.fieldKey.toLowerCase();
const alreadyReplaced = replacedFieldKeys && [...replacedFieldKeys].some(k => k.toLowerCase() === fieldKeyLower);
if (alreadyReplaced) {
```

Keep the existing log message unchanged. No other files modified.

### What this does
- When the merge tag `{{property1.address}}` adds `property1.address` to `replacedFieldKeys`, the label alias for `Property1.Address` will now correctly match via case-insensitive comparison
- The label replacement skips the "Property Address" text, preserving the label in the document
- The merge tag value is already substituted inline, so the output becomes: `Property Address: <value>`

