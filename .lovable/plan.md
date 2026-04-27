## Goal

Remove the "Assessed" and "Payable" dropdowns from the Servicing Agent section under Loan → Servicing Details, as shown in the screenshot. Keep everything else (Servicing Agent dropdown, "Complete if 3rd Party", "Send Payments To" panels) untouched.

## Scope

Single file: `src/components/deal/LoanTermsServicingForm.tsx` (lines 401–430).

## What changes

Delete the two `DirtyFieldWrapper` blocks that render the "Assessed" and "Payable" rows. The "Servicing Agent" row directly above and the "Complete if 3rd Party / Send Payments To" grid directly below remain exactly as they are.

## What is preserved (minimal-change policy)

- The `AGENT_FK.assessed` and `AGENT_FK.payable` field keys remain defined.
- The `ASSESSED_OPTIONS` and `PAYABLE_OPTIONS` arrays remain defined.
- All existing persistence, dictionary mappings, dirty-field wiring, document-generation logic, and APIs are untouched.
- No schema changes, no field_dictionary edits, no other UI sections affected.
- Any previously saved values for `assessed` / `payable` on existing deals remain intact in the database.

## Acceptance

- "Assessed" and "Payable" rows no longer render in Loan → Servicing Details → Servicing Agent.
- "Servicing Agent" dropdown still works and saves normally.
- The "Complete if 3rd Party" and "Send Payments To" panels render unchanged immediately below the Servicing Agent dropdown.
- No console errors; no other forms or templates affected.
