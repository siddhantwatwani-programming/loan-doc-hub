

## Updates Plan

### 1. Field Dictionary Table — Remove Action Column, Add Field Label Column

**Current state:** The table has columns: Label, Field Key, Form, Type, Mandatory (checkbox), Flags, Actions (edit/delete dropdown).

**Changes to `FieldDictionaryPage.tsx`:**
- Remove the "Actions" column (the `<th>` and the `<td>` with the DropdownMenu containing Edit/Delete)
- The "Label" column already exists and shows `field.label` — this IS the Field Label. Rename the header from "Label" to "Field Label" for clarity.
- The Mandatory checkbox already calls `handleToggleMandatory` which saves directly to DB — this is already working correctly.
- Keep the Edit/Delete functionality accessible only through the Add Field dialog (edit) and remove standalone delete. Actually, since we're removing Actions, we can make rows clickable to open the edit dialog instead. Or we keep the edit via clicking the row.

**Decision:** Make the field label clickable to open the edit dialog. Remove the Action column entirely (no more DropdownMenu with Edit/Delete per row). The "Add Field" button still allows creation. Editing happens by clicking a row.

### 2. Event Journal — Remove Selection & Delete

**Changes to `EventJournalViewer.tsx`:**
- Remove the `useGridSelection` hook usage entirely
- Remove the checkbox column (header and row checkboxes)
- Remove the `bulkDeleteOpen` state and `handleBulkDelete` function
- Remove the `DeleteConfirmationDialog` component
- Remove `selectedCount` and `onBulkDelete` props from `GridToolbar`
- Update `colSpan` from 6 to 5 in the empty state row
- Remove unused imports (`Checkbox`, `useGridSelection`, `DeleteConfirmationDialog`, `supabase`, `toast`)

**Changes to `GlobalEventJournalPage.tsx`:** No changes needed — it just renders `EventJournalViewer`.

### 3. Field Key in Document Templates

The document generation engine (`generate-document` edge function) resolves field keys via `field-resolver.ts` which looks up `field_dictionary` by `field_key` and joins with `deal_section_values` JSONB. The merge tag `{{field_key}}` is resolved by matching the tag name to either a `template_field_maps` entry or a `merge_tag_aliases` entry, both of which reference `field_dictionary_id`. This chain is already correct — no code changes needed. The field key in the dictionary IS what gets used for template resolution.

### Files Changed

| File | Change |
|------|--------|
| `src/pages/admin/FieldDictionaryPage.tsx` | Remove Action column, rename "Label" → "Field Label", make rows clickable for editing |
| `src/components/deal/EventJournalViewer.tsx` | Remove checkbox column, selection logic, delete functionality |

