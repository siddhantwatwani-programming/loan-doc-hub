

## Plan: Auto-fill System Date for Empty Date Fields During Document Generation

### Problem
When a date field is not filled in the form, the generated document leaves it blank. The requirement is to automatically substitute the current system date for any empty date-type field during generation.

### Approach
Add a single post-processing step in `supabase/functions/generate-document/index.ts` after field values are resolved (after line ~183) and before DOCX processing. This step will:

1. Iterate over `allFieldDictEntries` (already fetched) to find all fields with `data_type = 'date'`
2. For each date field, check if a value exists in the `fieldValues` map
3. If the value is missing, null, or empty string, inject the current system date in `YYYY-MM-DD` format (matching the existing DB date storage format)
4. If a value already exists, leave it untouched

### Implementation

**File: `supabase/functions/generate-document/index.ts`**

Insert a new block after line ~183 (after `console.log("Resolved ${fieldValues.size} field values...")`), before the borrower_description auto-compute block:

```typescript
// Auto-fill empty date fields with current system date
const systemDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
let dateFieldsFilled = 0;
for (const fd of allFieldDictEntries) {
  if (fd.data_type === "date") {
    const existing = fieldValues.get(fd.field_key);
    if (!existing || !existing.rawValue || String(existing.rawValue).trim() === "") {
      fieldValues.set(fd.field_key, { rawValue: systemDate, dataType: "date" });
      dateFieldsFilled++;
    }
  }
}
if (dateFieldsFilled > 0) {
  console.log(`[generate-document] Auto-filled ${dateFieldsFilled} empty date fields with system date: ${systemDate}`);
}
```

### What This Does NOT Change
- No UI, layout, or component changes
- No database schema or migration changes
- No changes to formatting, tag-parser, field-resolver, or docx-processor
- No changes to existing date values — only fills empty/missing ones
- No changes to the field dictionary or template field maps
- Existing transform rules (date_long, date_mmddyyyy, etc.) will apply normally to the auto-filled date value

### Edge Cases Handled
- Field exists with value → not overridden
- Field missing entirely from deal data → filled with system date
- Field exists with null/empty value → filled with system date
- Indexed/composite keys (e.g., `borrower1.date_of_birth`) → handled because `allFieldDictEntries` contains canonical keys

