

## Plan: Add Boolean/Checkbox Rendering in DealFieldInput

### Problem
The `DealFieldInput` component has no renderer for `boolean` data type fields. When a field with `data_type = 'boolean'` exists in the field dictionary (e.g., in the "Other" section), it falls through to the default text input renderer instead of displaying as a checkbox. This means users can't check/uncheck boolean fields, and `true`/`false` values aren't stored properly.

### Change: Single File

**File: `src/components/deal/DealFieldInput.tsx`**

1. Import the `Checkbox` component from `@/components/ui/checkbox`
2. Add a `renderCheckbox()` function that renders a Radix checkbox, reading `value === 'true'` as checked and calling `onChange('true')` / `onChange('false')` on toggle
3. Add a case for `boolean` in the `renderFieldInput()` switch (line ~309, before the default `renderInput()` fallback):
   ```
   if (field.data_type === 'boolean') return renderCheckbox();
   ```
4. The checkbox layout will use the existing label/input row structure — the checkbox replaces the text input in the right column, maintaining alignment with all other fields

### How It Works
- Checking the box calls `onChange('true')` → stored as `"true"` in the JSONB `deal_section_values`
- Unchecking calls `onChange('false')` → stored as `"false"`
- On load, `value === 'true'` determines checked state
- The existing document generation already handles boolean values via `formatCheckbox` (☑/☐) and `processSdtCheckboxes`

### No Other Changes
- No database, schema, or migration changes
- No UI layout changes outside the new checkbox renderer
- No changes to document generation, APIs, or other components

