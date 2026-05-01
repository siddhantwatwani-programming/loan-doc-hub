## Add Two Boolean Fields to Field Dictionary

Add two new boolean fields under **Other Origination → Origination Fees**, mirroring the pattern of the existing `of_re_interestRate.fixed` / `of_re_interestRate.adjustable` entries.

### New Field Dictionary Entries

| field_key | label | data_type | section | form_type |
|---|---|---|---|---|
| `of_re_proposedLoanTerm.months` | Proposed Loan Term — Months | boolean | origination_fees | primary |
| `of_re_proposedLoanTerm.years` | Proposed Loan Term — Years | boolean | origination_fees | primary |

Both rows will be created with:
- `allowed_roles = {admin, csr}`
- `read_only_roles = {}`
- `is_mandatory = false`, `is_repeatable = false`, `is_calculated = false`

### Implementation

Single SQL migration inserting the two rows into `field_dictionary` (idempotent via `ON CONFLICT (field_key) DO NOTHING`).

### Scope (minimal-change policy)

- No UI form changes.
- No template/merge-tag changes.
- No edits to `OriginationFeesForm` or related components.
- Fields will be available in the dictionary for later mapping/UI binding if/when requested.