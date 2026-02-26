

## Plan: Fix Auto-fill System Date for Unmapped/Unstored Date Fields

### Root Cause

The current auto-fill logic (lines 185-199 of `generate-document/index.ts`) iterates over `allFieldDictEntries`, which only contains field dictionary entries for fields that **already have values stored in `deal_section_values`**. If a date field like `date` (field_key: `date`, section: `trust_ledger_grid`) was never filled in any form for a deal, it is absent from `allFieldDictEntries` entirely, and the auto-fill loop never sees it.

The template's merge tag (e.g., `{{Date}}` or `{{date}}`) resolves to the canonical key `date`, but since no value exists in `fieldValues` and the auto-fill didn't inject one, the tag resolves to an empty string.

### Fix

After the existing auto-fill loop (line 199), add a second pass that fetches **all** date-type fields from `field_dictionary` and fills any that are still missing from `fieldValues`.

**File: `supabase/functions/generate-document/index.ts`**

Insert after the existing auto-fill block (after line 199, before the borrower_description block):

```typescript
// Second pass: fetch ALL date-type fields from field_dictionary
// to cover fields not present in deal_section_values at all
const { data: allDateFields, error: dateFieldsError } = await supabase
  .from("field_dictionary")
  .select("field_key")
  .eq("data_type", "date");

if (!dateFieldsError && allDateFields) {
  let globalDateFills = 0;
  for (const df of allDateFields) {
    const existing = fieldValues.get(df.field_key);
    if (!existing || !existing.rawValue || String(existing.rawValue).trim() === "") {
      fieldValues.set(df.field_key, { rawValue: systemDate, dataType: "date" });
      globalDateFills++;
    }
  }
  if (globalDateFills > 0) {
    console.log(`[generate-document] Auto-filled ${globalDateFills} additional date fields (not in deal data) with system date: ${systemDate}`);
  }
}
```

### What This Changes
- One additional database query per document generation to fetch all date-type field keys
- Fills date fields that have no stored deal data with the system date
- Existing date values remain untouched

### What This Does NOT Change
- No UI, layout, or component changes
- No database schema changes
- No changes to formatting, tag-parser, field-resolver, or docx-processor
- No changes to the existing auto-fill loop (first pass still handles fields with empty values in deal data)
- Existing transform rules apply normally to auto-filled values

### Files Modified
| File | Change |
|------|--------|
| `supabase/functions/generate-document/index.ts` | Add second-pass query for all date-type fields after existing auto-fill block |

