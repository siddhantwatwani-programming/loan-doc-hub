

## Plan: Add "Borrower Notified" and "Lender Notified" Date Fields to Property Tax

### Summary
Add a "Borrower Notified" checkbox (with conditional date field) and a "Lender Notified" label with date field below the existing "Delinquent" section in the Property Tax modal, detail form, and table grid.

### What Currently Exists
- The modal and form already have a "Lender Notified" date field in the Tax Tracking section (right column, between Last Verified and Current)
- The request asks for a NEW "Lender Notified" date below Delinquent — this appears to be a separate field from the existing one
- "Borrower Notified" is entirely new

### Changes

**1. PropertyTaxTableView.tsx** — Update data interface + table grid
- Add `borrowerNotified: boolean`, `borrowerNotifiedDate: string`, `lenderNotifiedDate: string` to `PropertyTaxData` interface
- Add 3 new columns to table header and body: Borrower Notified, Borrower Notified Date, Lender Notified Date (below Delinquent)
- Add to EXPORT_COLUMNS

**2. PropertyTaxModal.tsx** — Add fields below Delinquent section
- Update `getDefaultTax()` with `borrowerNotified: false`, `borrowerNotifiedDate: ''`, `lenderNotifiedDate: ''`
- After the Delinquent Amount conditional block, add:
  - Checkbox "Borrower Notified" — when checked, show a date picker (mm/dd/yyyy)
  - Label "Lender Notified" with date picker input (mm/dd/yyyy)

**3. PropertyTaxForm.tsx** — Add same fields below Delinquent in detail form
- After the Delinquent Amount conditional block, add:
  - DirtyFieldWrapper + Checkbox "Borrower Notified" — when checked, show date picker
  - DirtyFieldWrapper + "Lender Notified" label with date picker

**4. fieldKeyMap.ts** — Add 3 new keys to PROPERTY_TAX_KEYS
- `borrowerNotified: 'propertytax1.borrower_notified'`
- `borrowerNotifiedDate: 'propertytax1.borrower_notified_date'`
- `lenderNotifiedDate: 'propertytax1.lender_notified_date'`

**5. Database migration** — Add 3 field_dictionary entries
- `propertytax.borrower_notified` (boolean)
- `propertytax.borrower_notified_date` (date)
- `propertytax.lender_notified_date` (date)

### No Other Changes
- No schema changes
- No new tables
- Persists via existing JSONB save mechanism

### Files Changed
| File | Change |
|---|---|
| `src/components/deal/PropertyTaxTableView.tsx` | Add 3 fields to interface, grid columns, export |
| `src/components/deal/PropertyTaxModal.tsx` | Add Borrower Notified checkbox + date, Lender Notified date below Delinquent |
| `src/components/deal/PropertyTaxForm.tsx` | Add same fields in detail form |
| `src/lib/fieldKeyMap.ts` | Add 3 keys to PROPERTY_TAX_KEYS |
| Database migration | INSERT 3 field_dictionary rows |

