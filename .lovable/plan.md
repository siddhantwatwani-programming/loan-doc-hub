

# Loan → Details: Input Validation & Formatting

## Summary
Add inline validation and character filtering to 5 text fields (Company, Loan Number, Assigned CSR, Parent Account, Child Account) in `LoanTermsDetailsForm.tsx`. No other files or functionality changes.

## Changes (single file: `src/components/deal/LoanTermsDetailsForm.tsx`)

### 1. Add validation state & helpers
Add a `validationErrors` state object keyed by field key. Add validation functions:

| Field | Allowed regex (keydown filter) | Blur validation |
|---|---|---|
| Company | `[A-Za-z0-9 &.,-]` | Min 2 chars, no `@#$%` |
| Loan Number | `[A-Za-z0-9-]` | No spaces, alphanumeric + hyphen only |
| Assigned CSR | `[A-Za-z ]` | Alpha + spaces only |
| Parent Account | `[A-Za-z0-9-]` | 6–15 chars, alphanumeric + hyphen |
| Child Account | `[A-Za-z0-9-]` | 6–15 chars, alphanumeric + hyphen |

### 2. Create a `renderValidatedField` helper
Similar to existing `renderInlineField` but with:
- `onKeyDown` handler that blocks disallowed characters
- `onPaste` handler that strips disallowed characters
- `onBlur` that trims whitespace and runs validation, setting error message in state
- Red border (`border-destructive`) when validation error exists
- Inline error message below the input (red text, text-[10px])

### 3. Replace the 3 Details column fields
Replace lines 202–204:
- `renderInlineField(company)` → `renderValidatedField(company, 'Company', companyConfig)`
- `renderInlineField(loanNumber)` → `renderValidatedField(loanNumber, 'Loan Number', loanNumberConfig)`
- `renderInlineField(assignedCsr)` → `renderValidatedField(assignedCsr, 'Assigned CSR', csrConfig)`

### 4. Replace Parent/Child Account inputs (lines 248, 253)
Replace plain `<Input>` elements with validated inputs that:
- Filter keystrokes to `[A-Za-z0-9-]`
- Clean pasted values
- Validate on blur (6–15 chars if checkbox is checked)
- Disable when corresponding checkbox is unchecked
- Show error below input when invalid

### 5. Conditional mandatory logic
When `parentAccount` checkbox is checked, `parentAccountValue` field is enabled and validated as mandatory (non-empty + 6–15 chars). Same for `childAccount`/`childAccountValue`. When unchecked, field is disabled and any error is cleared.

## What Will NOT Change
- No changes to any other component, file, API, schema, or layout
- All existing field keys, dropdowns, checkboxes, date pickers unchanged
- No changes to `numericInputFilter.ts` or any shared utility

