

# Plan: Align Borrower Table Columns with Detail Form Fields

## Problem
The Borrower list table is missing many columns that exist in the Add Borrower modal and detail form. Fields like Hold, Type, ACH, Street, ZIP, phone numbers, TIN, Send 1099, Verified, and mailing address fields are either hidden or absent from the table headers. Data already persists in `contact_data` JSONB but isn't displayed.

## Changes

### 1. Update `DEFAULT_COLUMNS` in `ContactBorrowersPage.tsx`
Add all requested fields as table columns matching the exact field keys used in the Add Borrower modal's `contact_data`:

| Column Label | Column ID (contact_data key) | Default Visible |
|---|---|---|
| Borrower ID | `contact_id` (top-level) | Yes |
| Hold | `hold` | Yes |
| Type | `borrower_type` | Yes |
| ACH | `ach` | Yes |
| Email | `email` (top-level) | Yes |
| Agreement on File | `agreement_on_file` | Yes |
| Full Name | `full_name` (top-level) | Yes |
| First | `first_name` (top-level) | Yes |
| Last | `last_name` (top-level) | Yes |
| Street | `address.street` | Yes |
| City | `city` (top-level) | Yes |
| State | `state` (top-level) | Yes |
| ZIP | `address.zip` | Yes |
| Home Phone | `phone.home` | Yes |
| Work Phone | `phone.work` | Yes |
| Cell Phone | `phone.cell` | Yes |
| Fax | `phone.fax` | Yes |
| Preferred Phone | (computed from `preferred.*`) | Yes |
| TIN | `tax_id` | Yes |
| Send 1099 | `issue_1099` | Yes |
| Verified | `tin_verified` | Yes |
| Mailing Street | `mailing.street` | Yes |
| Mailing City | `mailing.city` | Yes |
| Mailing State | `mailing.state` | Yes |
| Mailing ZIP | `mailing.zip` | Yes |

Bump `tableConfigKey` to `contact_borrowers_v4` to reset localStorage.

### 2. Add `renderCellValue` prop in `ContactBorrowersPage.tsx`
Pass a custom `renderCellValue` to `ContactsListView` to handle:
- Boolean fields (`hold`, `ach`, `agreement_on_file`, `issue_1099`, `tin_verified`): show `✓` or empty
- `preferred_phone`: compute from `preferred.home/work/cell/fax` flags in contact_data
- Dot-notation keys (`address.street`, `phone.home`, etc.): read from `contact_data`

### 3. No backend changes needed
All fields already persist via `contact_data` JSONB. The Add Borrower modal already saves all these fields. The detail form already reads/writes them. Only the table display is missing columns.

## Files Modified
- `src/pages/contacts/ContactBorrowersPage.tsx` — update `DEFAULT_COLUMNS`, add `renderCellValue`, bump config key

