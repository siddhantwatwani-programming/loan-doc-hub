## Goal

Make every field in the **Property → Liens → Senior Lien Tracking** panel (the column shown in your screenshot) persist after Save and re-populate on reload.

## Findings

The Senior Lien Tracking UI already exists in `src/components/deal/LienDetailForm.tsx` (right column). Persistence flows through `LienSectionContent → lienN.<field> → legacyKeyMap → field_dictionary` and is correctly wired for **17 of the 19 fields**.

Only two fields are silently dropped on save because they have no `field_dictionary` row and no entry in `legacyKeyMap.ts`:

- `lien.slt_borrower_notified` (boolean checkbox)
- `lien.slt_borrower_notified_date` (date)

These trigger the warning `[useDealFields] Skipping field "lienN.slt_borrower_notified" — no field_dictionary match found. Data for this key will NOT be persisted.`

## Changes (minimal, additive only)

### 1. Insert 2 rows into `field_dictionary` (no schema change, no new table)
Migration adding:
- `li_slt_borrowerNotified` — `data_type=boolean`, `section=liens`, label "Borrower Notified"
- `li_slt_borrowerNotifiedDate` — `data_type=date`, `section=liens`, label "Borrower Notified Date"

(matches the existing `li_slt_lenderNotified` / `li_slt_lenderNotifiedDate` pattern already used by Lender Notified.)

### 2. Add 2 entries to `src/lib/legacyKeyMap.ts`
In the existing LIEN TAB block (next to the lender_notified entries):
```ts
'lien.slt_borrower_notified': 'li_slt_borrowerNotified',
'lien.slt_borrower_notified_date': 'li_slt_borrowerNotifiedDate',
```

## Out of scope (untouched)

- No template, RLS, schema, API, or UI layout changes.
- `LienDetailForm.tsx`, `LienSectionContent.tsx`, `LiensTableView.tsx`, save/load APIs — unchanged.
- All other 17 SLT fields are already persisted; no edits required.

## Acceptance

- Open Property → Liens → a lien → Senior Lien Tracking. Toggle every field including Borrower Notified + date. Save. Reload deal. All values reappear.
- Console no longer logs the "Skipping field … slt_borrower_notified" warning.
