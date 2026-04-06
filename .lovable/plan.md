

## Plan: Add Field Dictionary Entries for Checkbox Boolean Fields

### Summary
Add 4 new field dictionary entries for the derived boolean keys used by the Re851a dropdown-to-checkbox auto-mapping logic. These fields are computed during document generation and do not need UI input.

### Fields to Add

| field_key | label | section | data_type | form_type | is_calculated | calculation_formula | calculation_dependencies |
|---|---|---|---|---|---|---|---|
| `ln_p_amortizedPartially` | Amortized Partially | loan_terms | boolean | details | true | `ln_p_amortiza == "Amortized Partially"` | `["ln_p_amortiza"]` |
| `ln_p_amortized` | Amortized | loan_terms | boolean | details | true | `ln_p_amortiza == "Amortized"` | `["ln_p_amortiza"]` |
| `ln_p_paymentMonthly` | Payment Monthly | loan_terms | boolean | balances_loan_details | true | `ln_p_paymentFreque == "Monthly"` | `["ln_p_paymentFreque"]` |
| `ln_p_paymentWeekly` | Payment Weekly | loan_terms | boolean | balances_loan_details | true | `ln_p_paymentFreque == "Weekly"` | `["ln_p_paymentFreque"]` |

### Technical Details
- All 4 are marked `is_calculated = true` so the UI renders them as read-only
- `is_repeatable = false`, `is_mandatory = false`
- `allowed_roles = ['admin', 'csr']`, `read_only_roles = []`
- Values are derived at document generation time (already implemented in the edge function)
- One database migration with 4 INSERT statements

### Files Changed
| File | Change |
|---|---|
| Database migration | INSERT 4 rows into `field_dictionary` |

