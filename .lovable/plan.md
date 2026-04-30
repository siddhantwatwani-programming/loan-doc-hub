## RE851D – Merge Lien Sections into Single "Liens Details"

### Goal
In Admin → Field Dictionary, the **Section = Property** dropdown currently lists four lien sub-forms:

- Liens — General Details
- Liens — Loan Type
- Liens — Balance & Payment
- Liens — Recording & Tracking

Replace these four entries with one unified entry called **"Liens Details"**. Existing field rows, field keys, document mappings, and generation flow stay untouched — this is a UI/grouping change only.

### Scope
Only `src/pages/admin/FieldDictionaryPage.tsx` is modified. No DB migration. No changes to document generation, RE851D logic, deal UI, or field keys.

### Changes

**1. Replace the four lien entries in `SECTION_FORMS.property` (lines 122–126)**

Remove the four `liens_*` entries and add a single entry:

```ts
{ value: 'liens_details', label: 'Liens Details', dbSection: 'liens' },
```

Result: the Property → Forms dropdown shows exactly one Liens option.

**2. Filter behavior (already supported, no code change)**

The existing filter logic at lines 696–709 handles a form whose `dbSection` is set but whose `value` is **not** prefixed with `${dbSection}_`. In that case `stripped` is `null` and the filter matches every row where `f.section === 'liens'` regardless of its `form_type`. So selecting the new "Liens Details" entry will display all four legacy buckets together — no data loss, ordering preserved by current default sort.

**3. New-field creation under "Liens Details"**

When a user creates a new field under the unified entry:
- `resolveDbSection` returns `'liens'` (from `dbSection`) — unchanged behavior.
- `resolveDbFormType` (lines 374–381) currently strips a `${dbSection}_` prefix from `formDef.value`. Since `'liens_details'` **does** start with `'liens_'`, it would persist as `form_type = 'details'`. That is acceptable (a new canonical bucket alongside the legacy four) and does **not** affect the four existing buckets' rows.
- Add `liens_details: 'ld'` (or reuse `'gd'`) to `FORM_ABBR` so generated field keys remain valid. Use `'ld'` to avoid collisions.

**4. Edit-mapping for legacy rows**

When editing a field whose DB row has `form_type ∈ {general_details, loan_type, balance_payment, recording_tracking}` and `section = 'liens'`, the edit dialog's form selector must point to the unified "Liens Details" entry (not show a stale value).

Update `dbFormTypeToUiFormType` (lines 511–518) to add a Liens-specific short-circuit:

```ts
if (uiSection === 'property' && dbSection === 'liens') {
  return 'liens_details';
}
```

This ensures all legacy lien rows open in the edit dialog under the new unified option. On save, the row's `form_type` gets rewritten to `'details'` only if the user actively saves; if they cancel, nothing changes. (Optional safer behavior: preserve the original `form_type` on edit by detecting it. Default plan = let save normalize to `'details'`. Confirm if you'd rather preserve.)

**5. Cleanup**

Remove now-unused `FORM_ABBR` entries `liens_general_details`, `liens_loan_type`, `liens_balance_payment`, `liens_recording_tracking` (lines 244–247). They are only referenced by the removed dropdown values.

Update the comment block at lines 122–126 to reflect the consolidation.

### What is NOT changed
- `field_dictionary` table rows, field keys, labels, data types
- Document generation (RE851D and all others)
- Deal UI lien section components (`LienSectionContent.tsx`, etc.)
- `legacyKeyMap.ts`, `fieldKeyMap.ts`
- Permission logic
- Any non-lien dropdown entries

### Validation
- Open Admin → Field Dictionary → Section = Property → Forms dropdown shows exactly one "Liens Details" entry; no separate lien sub-forms.
- Selecting "Liens Details" lists every field that previously appeared under any of the four lien sub-forms.
- Editing a legacy lien field opens the dialog with form = "Liens Details".
- Document generation for RE851D, RE885, and other lien-consuming docs continues to work (field keys unchanged).
