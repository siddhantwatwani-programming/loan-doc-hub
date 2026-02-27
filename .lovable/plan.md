

## Plan: Conditional System Date & US Date Format Standardization

### Requirement 1: Conditional `{{systemDate}}` Population

**Current behavior**: The `generate-document` edge function (lines 185-220) auto-fills ALL empty date fields with the current system date. This is incorrect — it should only populate fields explicitly mapped with `{{systemDate}}`.

**Changes**:

1. **`supabase/functions/generate-document/index.ts`** (lines 185-220):
   - Remove the two-pass logic that auto-fills every empty date field with system date
   - Replace with: inject a single `systemDate` key into `fieldValues` with the current date in `YYYY-MM-DD` format
   - This way, only templates using `{{systemDate}}` merge tags will get the system date populated
   - Other unmapped/empty date fields will remain blank

2. **`supabase/functions/_shared/formatting.ts`** — handle `systemDate` as a recognized tag by ensuring it resolves as a date type (no changes needed here, the existing merge tag pipeline already handles `{{systemDate}}` as a tag name that resolves to the injected field value)

### Requirement 2: US Date Format (MM/DD/YYYY) Standardization

**Current behavior**: The backend `formatting.ts` uses `formatDateDDMMYYYY` (DD/MM/YYYY) as the default date format in `formatByDataType` and in `applyTransform` for the `"date"` transform. One form (`LenderInfoForm.tsx`) displays DOB in DD/MM/YYYY.

**Changes**:

3. **`supabase/functions/_shared/formatting.ts`**:
   - In `formatByDataType` function (line 286): change `formatDateDDMMYYYY` to `formatDateMMDDYYYY`
   - In `applyTransform` function (line 243): change `formatDateDDMMYYYY` to `formatDateMMDDYYYY` for the `"date"` case

4. **`src/components/deal/LenderInfoForm.tsx`** (line 345):
   - Change `'dd/MM/yyyy'` to `'MM/dd/yyyy'` for the DOB date display format

### Files Modified

| File | Change |
|------|--------|
| `supabase/functions/generate-document/index.ts` | Remove blanket date auto-fill; inject `systemDate` field value only |
| `supabase/functions/_shared/formatting.ts` | Default date format DD/MM → MM/DD in `formatByDataType` and `applyTransform` |
| `src/components/deal/LenderInfoForm.tsx` | DOB display format DD/MM → MM/DD |

### No changes to
- Database schema
- Document layout/styling
- Other field mappings
- Date storage format (remains YYYY-MM-DD internally)

