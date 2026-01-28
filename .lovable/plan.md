
# Implementation Plan: Section-Based Consolidated Field Values with UUID Keys

## Overview

This plan implements the approved schema migration from a **row-per-field** model in `deal_field_values` to a **section-based JSONB** model in a new `deal_section_values` table. The actual `field_dictionary_id` UUIDs will be used as JSONB keys, preserving the direct relationship to the `field_dictionary` table.

---

## Database Changes

### Phase 1: Create New Table and Infrastructure

**New Table: `deal_section_values`**

```sql
CREATE TABLE deal_section_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  section field_section NOT NULL,
  field_values JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1,
  
  CONSTRAINT deal_section_values_unique UNIQUE (deal_id, section)
);

-- GIN index for efficient JSONB key lookups
CREATE INDEX idx_deal_section_values_field_values 
ON deal_section_values USING GIN (field_values);

-- Index for deal lookups
CREATE INDEX idx_deal_section_values_deal_id 
ON deal_section_values (deal_id);

-- Enable RLS
ALTER TABLE deal_section_values ENABLE ROW LEVEL SECURITY;
```

**JSONB Structure (field_values column):**
```json
{
  "a1b2c3d4-e5f6-7890-abcd-ef1234567890": {
    "value_text": "John Smith",
    "value_number": null,
    "value_date": null,
    "value_json": null,
    "updated_at": "2026-01-28T10:00:00Z",
    "updated_by": "user-uuid-456"
  }
}
```

**RLS Policies:**

| Policy | Command | Logic |
|--------|---------|-------|
| Users can view accessible deal section values | SELECT | `has_deal_access(auth.uid(), deal_id)` |
| CSRs can insert deal section values | INSERT | `has_role(auth.uid(), 'csr') OR has_role(auth.uid(), 'admin')` |
| Authorized users can update deal section values | UPDATE | CSR/Admin OR exists in `deal_assignments` |
| Admins can delete deal section values | DELETE | `has_role(auth.uid(), 'admin')` |

---

## Application Code Changes

### File: `src/hooks/useDealFields.ts`

**Changes Required:**

1. **Add new helper function** to read from `deal_section_values`:
   - Extract JSONB field values keyed by `field_dictionary_id`
   - Map to `field_key` using the existing `fieldDictIdToMeta` lookup

2. **Update `fetchData()` function**:
   - Query `deal_section_values` instead of `deal_field_values`
   - Parse JSONB structure to extract values
   - Extract typed values (`value_text`, `value_number`, `value_date`) from JSONB

3. **Update `saveDraft()` function**:
   - Group values by section before saving
   - Build JSONB structure with `field_dictionary_id` as key
   - Use upsert with `onConflict: 'deal_id,section'`
   - Merge new values with existing JSONB using Postgres JSONB operators

**Key Code Pattern (Read):**
```typescript
// 1. Fetch section values
const { data: sectionValues } = await supabase
  .from('deal_section_values')
  .select('section, field_values')
  .eq('deal_id', dealId);

// 2. Parse field values - field_dictionary_id is the key
const valuesMap: Record<string, string> = {};
sectionValues.forEach(sv => {
  Object.entries(sv.field_values || {}).forEach(([fieldDictId, fieldData]) => {
    const fieldMeta = fieldDictIdToMeta.get(fieldDictId);
    if (fieldMeta) {
      const value = extractTypedValue(fieldData, fieldMeta.data_type);
      if (value) valuesMap[fieldMeta.field_key] = value;
    }
  });
});
```

**Key Code Pattern (Write):**
```typescript
// Group values by section and build JSONB
const sectionUpdates: Record<string, Record<string, FieldValueObject>> = {};

for (const fieldKey of Object.keys(values)) {
  const field = resolvedFields.fields.find(f => f.field_key === fieldKey);
  if (!field) continue;
  
  const section = field.section;
  if (!sectionUpdates[section]) sectionUpdates[section] = {};
  
  sectionUpdates[section][field.field_dictionary_id] = {
    value_text: dataType === 'text' ? value : null,
    value_number: ['number', 'currency', 'percentage'].includes(dataType) ? parseFloat(value) : null,
    value_date: dataType === 'date' ? value : null,
    value_json: null,
    updated_at: new Date().toISOString(),
    updated_by: user.id
  };
}

// Upsert each section
for (const [section, fieldValues] of Object.entries(sectionUpdates)) {
  await supabase
    .from('deal_section_values')
    .upsert({
      deal_id: dealId,
      section,
      field_values: fieldValues
    }, { onConflict: 'deal_id,section', ignoreDuplicates: false });
}
```

---

### File: `src/lib/fieldValueResolver.ts`

**Changes Required:**

1. **Update `resolveFieldValues()` function**:
   - Query `deal_section_values` instead of `deal_field_values`
   - Parse JSONB to extract values by `field_dictionary_id`
   - Maintain existing return type `FieldValueResolverResult`

2. **Update `resolveFieldValuesForTemplate()` function**:
   - Same query changes as above
   - Transform rules continue to work via field_key lookup

3. **Update `resolveFieldValuesForPacket()` function**:
   - Same query changes as above

**Key Logic:**
```typescript
// Fetch section values
const { data: sectionValues } = await supabase
  .from('deal_section_values')
  .select('section, field_values')
  .eq('deal_id', dealId);

// Build field value map from JSONB
const fieldValueMap: Record<string, DealFieldValue> = {};
sectionValues.forEach(sv => {
  Object.entries(sv.field_values || {}).forEach(([fieldDictId, data]) => {
    const fieldDef = fieldDictMap.get(fieldDictId);
    if (fieldDef) {
      fieldValueMap[fieldDef.field_key] = {
        field_dictionary_id: fieldDictId,
        field_key: fieldDef.field_key,
        value_text: data.value_text,
        value_number: data.value_number,
        value_date: data.value_date,
        value_json: data.value_json,
        data_type: fieldDef.data_type
      };
    }
  });
});
```

---

### File: `src/hooks/useExternalModificationDetector.ts`

**Changes Required:**

1. **Update `fetchModifications()` function**:
   - Query `deal_section_values` instead of `deal_field_values`
   - Extract per-field `updated_by` and `updated_at` from JSONB
   - Check each field's `updated_by` against external user roles

**Key Logic:**
```typescript
// Fetch section values
const { data: sectionValues } = await supabase
  .from('deal_section_values')
  .select('section, field_values')
  .eq('deal_id', dealId);

// Extract field-level audit data from JSONB
const modifications: ExternalModification[] = [];
for (const sv of sectionValues) {
  for (const [fieldDictId, data] of Object.entries(sv.field_values || {})) {
    if (!data.updated_by) continue;
    
    // Check if updater is external user
    const { data: updaterRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', data.updated_by)
      .single();
    
    if (updaterRole && ['borrower', 'broker', 'lender'].includes(updaterRole.role)) {
      // Check if after last review
      if (!reviewedAt || new Date(data.updated_at) > new Date(reviewedAt)) {
        modifications.push({
          field_dictionary_id: fieldDictId,
          field_key: fieldDictMap.get(fieldDictId)?.field_key || fieldDictId,
          updated_by: data.updated_by,
          updated_at: data.updated_at,
          updater_role: updaterRole.role,
          updater_name: null // Fetch separately if needed
        });
      }
    }
  }
}
```

---

### File: `supabase/functions/generate-document/index.ts`

**Changes Required:**

1. **Update `generateSingleDocument()` function**:
   - Change query from `deal_field_values` to `deal_section_values`
   - Parse JSONB to build `fieldValues` Map
   - All downstream processing (transforms, replacements) remains unchanged

**Key Changes (around line 927):**
```typescript
// Before: Fetch from deal_field_values
// const { data: dealFieldValues } = await supabase
//   .from("deal_field_values")
//   .select("field_dictionary_id, value_text, value_number, value_date")
//   .eq("deal_id", dealId);

// After: Fetch from deal_section_values
const { data: sectionValues } = await supabase
  .from("deal_section_values")
  .select("section, field_values")
  .eq("deal_id", dealId);

// Get all field_dictionary_ids from JSONB keys
const allFieldDictIds: string[] = [];
(sectionValues || []).forEach((sv: any) => {
  Object.keys(sv.field_values || {}).forEach(id => {
    if (!allFieldDictIds.includes(id)) allFieldDictIds.push(id);
  });
});

// Fetch field dictionary entries
const { data: allFieldDictEntries } = await supabase
  .from("field_dictionary")
  .select("id, field_key, data_type, label")
  .in("id", allFieldDictIds);

// Build field values map
const allFieldDictMap = new Map<string, FieldDefinition>();
(allFieldDictEntries || []).forEach((fd: any) => allFieldDictMap.set(fd.id, fd));

const fieldValues = new Map<string, { rawValue: string | number | null; dataType: string }>();
(sectionValues || []).forEach((sv: any) => {
  Object.entries(sv.field_values || {}).forEach(([fieldDictId, data]: [string, any]) => {
    const fieldDict = allFieldDictMap.get(fieldDictId);
    if (fieldDict) {
      const dataType = fieldDict.data_type || "text";
      const rawValue = extractRawValueFromJsonb(data, dataType);
      fieldValues.set(fieldDict.field_key, { rawValue, dataType });
    }
  });
});
```

---

## Data Migration

### Migration Script (Run After Table Creation)

```sql
-- Migrate existing data from deal_field_values to deal_section_values
-- Uses actual field_dictionary.id as JSONB keys

INSERT INTO deal_section_values (deal_id, section, field_values, updated_at)
SELECT 
  dfv.deal_id,
  fd.section,
  jsonb_object_agg(
    dfv.field_dictionary_id::text,
    jsonb_build_object(
      'value_text', dfv.value_text,
      'value_number', dfv.value_number,
      'value_date', dfv.value_date,
      'value_json', dfv.value_json,
      'updated_at', dfv.updated_at,
      'updated_by', dfv.updated_by
    )
  ),
  MAX(dfv.updated_at)
FROM deal_field_values dfv
JOIN field_dictionary fd ON fd.id = dfv.field_dictionary_id
WHERE dfv.field_dictionary_id IS NOT NULL
GROUP BY dfv.deal_id, fd.section
ON CONFLICT (deal_id, section) DO UPDATE SET
  field_values = deal_section_values.field_values || EXCLUDED.field_values,
  updated_at = GREATEST(deal_section_values.updated_at, EXCLUDED.updated_at),
  version = deal_section_values.version + 1;
```

---

## Implementation Order

| Step | Action | Risk Level |
|------|--------|------------|
| 1 | Create `deal_section_values` table with indexes and RLS | Low |
| 2 | Run data migration script to populate new table | Low |
| 3 | Update `src/hooks/useDealFields.ts` to read/write new table | Medium |
| 4 | Update `src/lib/fieldValueResolver.ts` for new JSONB structure | Medium |
| 5 | Update `src/hooks/useExternalModificationDetector.ts` | Low |
| 6 | Update `supabase/functions/generate-document/index.ts` | Medium |
| 7 | Deploy edge function | Low |
| 8 | Test all flows (data entry, document generation, external modifications) | - |

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| Database Migration | Create | New table, indexes, RLS policies, data migration |
| `src/hooks/useDealFields.ts` | Modify | Read/write to new JSONB structure |
| `src/lib/fieldValueResolver.ts` | Modify | Parse JSONB for document generation |
| `src/hooks/useExternalModificationDetector.ts` | Modify | Extract audit data from JSONB |
| `supabase/functions/generate-document/index.ts` | Modify | Fetch from new table structure |

---

## Backward Compatibility Guarantees

1. **Same data model** - Values are stored with same typed columns (value_text, value_number, value_date, value_json)
2. **Same field_dictionary relationship** - UUID keys maintain direct reference
3. **Same audit trail** - Per-field updated_by and updated_at preserved in JSONB
4. **Same API responses** - Hook return types remain unchanged
5. **Same document generation** - Edge function output remains identical
6. **Same external modification detection** - Warning banners continue to work

---

## Validation Queries

After migration, verify data integrity:

```sql
-- Compare deal counts
SELECT 
  (SELECT COUNT(DISTINCT deal_id) FROM deal_field_values) as old_deals,
  (SELECT COUNT(DISTINCT deal_id) FROM deal_section_values) as new_deals;

-- Compare field counts per deal
WITH old_counts AS (
  SELECT deal_id, COUNT(*) as field_count 
  FROM deal_field_values 
  WHERE field_dictionary_id IS NOT NULL
  GROUP BY deal_id
),
new_counts AS (
  SELECT deal_id, 
    SUM((SELECT COUNT(*) FROM jsonb_object_keys(field_values))) as field_count 
  FROM deal_section_values 
  GROUP BY deal_id
)
SELECT o.deal_id, o.field_count as old_count, n.field_count as new_count
FROM old_counts o
LEFT JOIN new_counts n ON o.deal_id = n.deal_id
WHERE o.field_count != COALESCE(n.field_count, 0);
```
