

## Problem

When editing a field in the Field Dictionary, the **Field Key** value does not update when the user changes the Label, Section, or Form fields. This is because the code explicitly preserves the existing `field_key` during edits (lines 340, 353, 364 all use `editingField ? prev.field_key : generateFieldKeyFromConvention(...)`).

While the input itself technically allows direct typing, the auto-generation bypass during edits means users cannot regenerate field keys based on updated values — and the overall behavior feels "locked."

## Plan

**File: `src/pages/admin/FieldDictionaryPage.tsx`**

No changes needed to the `onChange` handler on the Field Key input (line 747) — it already allows direct manual editing.

The fix is to remove the `editingField` guard from the three auto-generation lines so that changing Label, Section, or Form also updates the field key during edits (same behavior as creating a new field):

1. **Line 340** — Label change handler: Change `editingField ? prev.field_key : generateFieldKeyFromConvention(...)` to always call `generateFieldKeyFromConvention(...)`.

2. **Line 353** — Section change handler: Same removal of the `editingField` guard.

3. **Line 364** — Form type change handler: Same removal of the `editingField` guard.

This gives users full control: auto-generation updates the key when other fields change, and direct typing in the Field Key input also works.

No other files or backend changes are required.

