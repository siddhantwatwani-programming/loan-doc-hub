## Goal

Add a numeric-only **No. of Payments** text input directly above **Payment Frequency** in:
**Enter File Data → Loan Terms → Balances** (Payments column)

Persist the value via the existing save/update flow. No schema, API, or backend changes — everything is already wired end-to-end and only the UI input is missing.

## Why no backend/schema work is needed

Verified all infrastructure already exists:

| Layer | Status |
|---|---|
| `field_dictionary` row | Exists — `ln_p_numberOfPaymen`, label "Number of Payments", section `loan_terms`, data_type `text` |
| UI → dictionary mapping | Exists — `legacyKeyMap.ts`: `'loan_terms.number_of_payments' → 'ln_p_numberOfPaymen'` |
| Field key constant | Exists — `LOAN_TERMS_BALANCES_KEYS.numberOfPayments = 'loan_terms.number_of_payments'` (`src/lib/fieldKeyMap.ts:417`) |
| Doc-gen consumer | Exists — `generate-document/index.ts:1557` already reads `loan_terms.number_of_payments` and bridges it to `ln_p_months` |
| Persistence | Goes through the same `onValueChange` → `deal_section_values` flow as every other field in this form |

So saving the field uses the same save/update API as every other field on the form — nothing new to add.

## Single change

**File:** `src/components/deal/LoanTermsBalancesForm.tsx`

Insert a new field block immediately **before** the existing "Payment Frequency" row (around line 632, inside the `Payments` column) using the same row markup pattern already used in the file (label + numeric Input):

- Label: `No. of Payments` (using existing `LABEL_CLASS`)
- Input bound to `FIELD_KEYS.numberOfPayments` via `getValue` / `setValue`
- Numeric-only: strip non-digits in `onChange` (`e.target.value.replace(/\D/g, '')`) and block non-digit keys in `onKeyDown` — identical pattern to the existing **Day Due** field two rows below it (line 654–661)
- `inputMode="numeric"`, `disabled={disabled}`, `className="h-8 text-sm flex-1"`

Approx. 12 lines added. No other files touched.

## Behavior after change

- Field appears above "Payment Frequency" in the Payments column.
- Only digits accepted (typing/pasting non-digits is filtered).
- Value saves through the existing form save flow into `deal_section_values` under key `loan_terms.number_of_payments`.
- On reload, value re-populates from the same key.
- Document generation continues to consume it via the already-existing bridge to `ln_p_months`.

## Out of scope (explicitly not changed)

- No DB migration, no `field_dictionary` insert (row already exists).
- No edits to `fieldKeyMap.ts`, `legacyKeyMap.ts`, edge functions, or any save API.
- No layout, ordering, or styling change to any other field.
- No change to validation rules of other fields.
