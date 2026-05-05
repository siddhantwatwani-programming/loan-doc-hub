## Goal

Fix the intermittent issue under **File Data → Property → Liens**, where a newly added Lien sometimes saves without its **Related Property** value (the lien shows as "Unassigned" in the grid even though the user was inside a specific Property when adding it). After save, the Related Property must always be populated and persisted.

Strictly follow the minimal-change rule: no schema changes, no new APIs, no UI/layout/refactor work outside what is listed.

## Root cause

In `src/components/deal/LienSectionContent.tsx` → `handleSaveLien`:

1. New liens are persisted field-by-field with the guard:
   ```
   if (val !== defaultVal || editingLien) onValueChange(`${prefix}.${dbField}`, val);
   ```
   The `property` field's default is `''`. If the lien is "unbound" (user never picked a property in the modal) AND `currentPropertyId` is missing/empty for any reason, `boundLienData.property` stays `''` (or `'unassigned'`), which equals the default → the `lienN.property` key is **never written**. The lien still saves (other fields write), but with no Related Property → grid shows it as "Unassigned" and the per-property scoping in `liensForProperty` filters it out of the current property's grid.

2. When the modal is opened and the user explicitly chooses `Unassigned`, the same path produces `'unassigned'`, which also never gets written through to the saved record.

3. `extractLiensFromValues` requires `hasData` to include a lien — when only `property` would have been written but it's skipped, the rest of the fields still cause inclusion, but on the **wrong** property scope.

This is why the behavior is intermittent: it works when `currentPropertyId` is set AND the user changes another field; it fails when `currentPropertyId` resolves blank or when the modal's bound property happens to equal the default.

## Changes (scoped, no API/schema changes)

All edits use the **existing** `onValueChange` / `onPersist` plumbing — no new endpoints, tables, or columns.

### 1. `src/components/deal/LienSectionContent.tsx`

- In `handleSaveLien`, **always persist `lienN.property`** for both new and edit flows, bypassing the `val !== defaultVal` guard for this single field. Resolution order for the value to write:
  1. `lienData.property` if it's a real property id (not empty, not `'unassigned'`).
  2. `currentPropertyId` (the active property prefix in the Property section).
  3. Fall back to the first id from `propertyOptions` if available.
  4. Otherwise write `'unassigned'` explicitly so the field exists and the lien is recoverable.
- Keep all other fields handled exactly as today.
- After `onPersist` resolves successfully, keep the existing `setSelectedLienPrefix(prefix)` behavior so the saved lien is selectable.

### 2. `src/components/deal/LienModal.tsx`

- When the modal opens for **Add** and `formData.property` is empty, pre-seed it with `currentPropertyId` (passed through from `LienSectionContent`) so the dropdown visibly shows the current Related Property by default. This makes the saved value match what the user sees and removes the silent unbound case.
- Add a new optional prop `currentPropertyId?: string` to `LienModalProps` and thread it from `LienSectionContent` → `LienModal` (no other modal behavior changes).

### 3. `src/components/deal/LienDetailForm.tsx`

- For the Related Property `<Select>`, when `lien.property` is empty, render the value as `'unassigned'` so the dropdown always reflects a defined state. No layout or option changes.

### 4. `src/components/deal/LienSectionContent.tsx` — read-side resilience

- In `extractLiensFromValues`, treat a lien as present if **any** mapped field has a stored value, including `property` — the existing logic already does this; just confirm and leave intact.
- In `liensForProperty`, additionally include liens whose stored `property` is missing/`'unassigned'` **only when** `currentPropertyId` matches the prefix the lien was created under (i.e., never lose a lien from the grid even if the property write was previously skipped before this fix). This is a backward-compatibility guard for already-saved data and does not change the storage model.

## Out of scope (explicitly NOT changed)

- No changes to `deal_section_values`, `field_dictionary`, or any Supabase tables/policies.
- No changes to `useDealFields` save/update APIs.
- No changes to the document generation flow (`supabase/functions/generate-document/...`).
- No edits to other property sub-sections, no UI restyling, no new components.

## Acceptance criteria

- Adding a new Lien from inside Property #N always saves with `lienK.property = "propertyN"` (or the user's explicit selection).
- After save, the new Lien appears in Property #N's Liens grid with the correct Related Property value populated.
- Editing an existing Lien preserves and persists the chosen Related Property.
- No regression for existing liens; previously-saved liens without a `property` value still appear in their original property's grid (via the read-side guard).
