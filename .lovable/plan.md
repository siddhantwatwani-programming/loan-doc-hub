

# Fix: Participant Capacity Keys Breaking Document Generation (Regression)

## Root Cause

The recent fix to store per-deal participant capacity in `deal_section_values` (section='participants') introduced keys like:
```
participant_5771ad96-a6e4-492d-b9c8-15f36383a224_capacity
```

In `generate-document/index.ts` (lines 182-188), ALL keys from `deal_section_values.field_values` are extracted and treated as UUID field_dictionary IDs:
```typescript
const fieldDictId = key.includes("::") ? key.split("::")[1] : key;
allFieldDictIdSet.add(fieldDictId);
```

The `participant_..._capacity` key does NOT contain `::`, so the entire string is treated as a UUID. When passed to `.in("id", chunk)` (line 202), PostgreSQL throws:
```
invalid input syntax for type uuid: "participant_5771ad96-a6e4-492d-b9c8-15f36383a224_capacity"
```

This crashes the **entire batch** of 100 IDs. Legitimate field dictionary entries in the same batch are lost, causing their placeholders to appear blank in the generated document.

## Fix

**File: `supabase/functions/generate-document/index.ts`** — Add a UUID validation filter before adding keys to `allFieldDictIdSet` (line 186).

```typescript
// Line 182-188: Filter out non-UUID keys (e.g., participant capacity keys)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const allFieldDictIdSet = new Set<string>();
(sectionValues || []).forEach((sv: any) => {
  Object.keys(sv.field_values || {}).forEach((key: string) => {
    const fieldDictId = key.includes("::") ? key.split("::")[1] : key;
    if (fieldDictId && UUID_RE.test(fieldDictId)) {
      allFieldDictIdSet.add(fieldDictId);
    }
  });
});
```

This single-line addition (`UUID_RE.test(fieldDictId)`) skips any non-UUID key, preventing the batch query from failing and restoring all placeholder resolution.

## Files Modified

| File | Change |
|---|---|
| `supabase/functions/generate-document/index.ts` | Add UUID validation filter when collecting field_dictionary IDs from section value keys (line 186) |

## What Will NOT Change
- No database schema changes
- No UI changes
- No template changes
- No changes to participant capacity storage logic
- No changes to tag-parser or formatting

