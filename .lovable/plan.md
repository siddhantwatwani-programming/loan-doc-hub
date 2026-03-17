

## Analysis

All 37 fields shown in the Insurance Conditions form UI (`origination_ins.*`) already exist in the `field_dictionary` table under `section = 'other'`. However, they all have `form_type = 'primary'` instead of `form_type = 'insurance_conditions'`.

The screenshot specifically shows the "Policy Types / Endorsements" column, which contains 11 checkbox fields — all of which are already present in both the UI component and the database.

**No new fields need to be created.** The only change needed is updating `form_type` from `'primary'` to `'insurance_conditions'` for all 37 `origination_ins.*` fields.

## Plan

### 1. Update `form_type` for all Insurance Conditions fields

Run a single SQL migration to update the 37 existing rows:

```sql
UPDATE field_dictionary
SET form_type = 'insurance_conditions', updated_at = now()
WHERE field_key LIKE 'origination_ins.%'
  AND section = 'other'
  AND form_type = 'primary';
```

This groups all Insurance Conditions fields under the correct `form_type` without renaming field keys, changing sections, or altering data types.

### 2. Verify Field Dictionary Admin displays correctly

After the migration, the Field Dictionary Admin UI should show these 37 fields under **Other → Insurance Conditions** instead of **Other → Primary**.

### What Will NOT Change
- No UI component changes (form already renders correctly)
- No field key renames
- No new fields created
- No edge function or document generation changes
- No other form_type values affected

