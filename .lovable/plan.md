

## Fix: Fields Not Populating in Document Generation

### Root Cause Analysis

Two distinct bugs are preventing field population:

**Bug 1: MERGEFIELD regex truncates dotted field names (line 212)**

The MERGEFIELD pattern uses `[A-Za-z0-9_]+` which stops at dots. So `MERGEFIELD Terms.LoanNumber` only captures `Terms`, not `Terms.LoanNumber`. It also doesn't handle quoted field names (`MERGEFIELD "Terms.LoanNumber"`), which Word sometimes generates.

**Bug 2: Label-based replacement skips field key resolution (line 253)**

Merge tag replacement uses the full resolution pipeline (`resolveFieldKeyWithMap` → `getFieldData`) which handles migrations, canonical keys, and case-insensitive matching. But label-based replacement uses a direct `fieldValues.get(mapping.fieldKey)` — an exact-match lookup that fails when the label's `fieldKey` (e.g., `Terms.LoanNumber`) doesn't match the actual stored key (e.g., `loan_terms.loan_number`).

The logs confirm both issues:
- `Found 0 merge tags` — MERGEFIELD field names are truncated at the dot, producing incorrect tag names
- `Label "LOAN NO:" -> No data for Terms.LoanNumber` — exact-match lookup fails because data is stored under a different key

### Fix

**File: `supabase/functions/_shared/tag-parser.ts`**

**Change 1 (line 212):** Update MERGEFIELD regex to support dotted and optionally quoted field names:
```typescript
// Before:
const mergeFieldPattern = /MERGEFIELD\s+([A-Za-z0-9_]+)/gi;

// After:
const mergeFieldPattern = /MERGEFIELD\s+"?([A-Za-z0-9_.]+)"?/gi;
```

**Change 2 (lines 234-240):** Add `mergeTagMap` and `validFieldKeys` parameters to `replaceLabelBasedFields`:
```typescript
export function replaceLabelBasedFields(
  content: string,
  fieldValues: Map<string, FieldValueData>,
  fieldTransforms: Map<string, string>,
  labelMap: Record<string, LabelMapping>,
  replacedFieldKeys?: Set<string>,
  mergeTagMap?: Record<string, string>,
  validFieldKeys?: Set<string>
): { content: string; replacementCount: number } {
```

**Change 3 (line 253):** Replace direct `fieldValues.get()` with proper key resolution:
```typescript
// Before:
const fieldData = fieldValues.get(mapping.fieldKey);

// After:
const resolvedKey = mergeTagMap && validFieldKeys
  ? resolveFieldKeyWithMap(mapping.fieldKey, mergeTagMap, validFieldKeys)
  : mapping.fieldKey;
const resolved = getFieldData(resolvedKey, fieldValues);
const fieldData = resolved?.data || null;
```

**Change 4 (line 810):** Pass the additional parameters when calling `replaceLabelBasedFields`:
```typescript
const labelResult = replaceLabelBasedFields(
  result, fieldValues, fieldTransforms, labelMap, replacedFieldKeys, mergeTagMap, validFieldKeys
);
```

No other files changed. No database, UI, or layout modifications.

