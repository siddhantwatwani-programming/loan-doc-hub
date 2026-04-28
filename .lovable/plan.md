## Goal

Make the **Source of Information** dropdown under **Other Origination → Application → Borrower** fully functional: correct options, persisted to the database, and usable in document templates via the canonical merge tag `{{oo_app_sourceOfInformation}}`.

## What I found

The field already exists in the UI at `src/components/deal/OriginationApplicationForm.tsx:347-365` keyed by the dotted path `origination_app.borrower.source_of_information`. Three problems block it from working end-to-end:

| # | Issue | Impact |
|---|---|---|
| 1 | Dropdown options are wrong (`Borrower / Broker / Credit Report`) | Doesn't match required values |
| 2 | No `field_dictionary` row exists for `origination_app.borrower.source_of_information` | UI saves are silently skipped (project rule: missing dictionary keys are not persisted) |
| 3 | No `merge_tag_aliases` row maps `oo_app_sourceOfInformation` → the storage key | Templates using `{{oo_app_sourceOfInformation}}` render blank |

All other Borrower section fields (e.g. `info_provided_by`, `is_borrower_also_broker`) have dictionary rows under `section=origination_fees, data_type=text`, so the new entry will follow the same pattern.

## Changes

### 1. UI — replace dropdown options (no layout change)

`src/components/deal/OriginationApplicationForm.tsx` lines 358–362: replace the three current `<SelectItem>`s with the five required values, in order:

- Broker
- Borrower
- Third Party
- Internal Referral
- Other

The `<Select>`, label, wrapper, styling, placeholder ("Select"), and storage key all stay exactly as today.

### 2. Database — register the field in the dictionary (migration)

Insert one row into `field_dictionary` so the value persists through the existing save pipeline:

```sql
INSERT INTO public.field_dictionary
  (field_key, label, section, data_type, form_type, is_mandatory, is_calculated, is_repeatable)
VALUES
  ('origination_app.borrower.source_of_information',
   'Source of Information',
   'origination_fees',
   'text',
   'primary',
   false, false, false)
ON CONFLICT DO NOTHING;
```

Mirrors the existing `origination_app.borrower.info_provided_by` entry. No schema change — only a row insert into the existing table.

### 3. Document generation — register the merge-tag alias

Insert one row into `merge_tag_aliases` so templates can reference the requested canonical key:

```sql
INSERT INTO public.merge_tag_aliases
  (tag_name, field_key, tag_type, is_active)
VALUES
  ('oo_app_sourceOfInformation',
   'origination_app.borrower.source_of_information',
   'merge_tag',
   true)
ON CONFLICT DO NOTHING;
```

This lets the existing doc-gen engine resolve `{{oo_app_sourceOfInformation}}` to the selected dropdown label (the value stored is the human-readable string, e.g. "Internal Referral", so the document shows the label, not an ID).

## What is NOT changing

- No UI layout, spacing, alignment, or styling changes — only the three dropdown items inside the existing `<Select>`.
- No edits to `OriginationApplicationForm` props, persistence wiring, `useDealFields`, `legacyKeyMap.ts`, or `fieldKeyMap.ts`.
- No changes to any document template, the doc-gen pipeline, or any other field mapping.
- No schema/DDL changes — both DB changes are pure row inserts into existing tables.
- Backward-compatible: existing records with no value remain blank; the prior `Credit Report` value would simply not match a current option (the Select renders empty placeholder, no error).

## Acceptance check

1. Open Other Origination → Application → Borrower → Source of Information shows the 5 required options with "Select" placeholder.
2. Pick a value → save → reload the deal → the value re-populates.
3. Generate a template that contains `{{oo_app_sourceOfInformation}}` → the document renders the selected label (e.g. "Internal Referral"), blank when unset, no errors.
