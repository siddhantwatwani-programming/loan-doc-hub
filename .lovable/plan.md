

## Plan: Rename "Appraised Value" to "Estimate of Value"

Label-only change in three files — no logic, schema, or API changes.

### Changes

1. **`src/components/deal/PropertyDetailsForm.tsx`** — Change the label string from `'Appraised Value'` to `'Estimate of Value'` (line 275)

2. **`src/components/deal/PropertyModal.tsx`** — Change the label string from `'Appraised Value'` to `'Estimate of Value'`

3. **`src/components/deal/PropertiesTableView.tsx`** — Change column header and footer label from `'Appraised Value'` to `'Estimate of Value'`

### What is NOT changed
- No database or schema changes
- No field key changes — still uses existing `appraisedValue` key
- No document generation changes
- No other UI modifications

