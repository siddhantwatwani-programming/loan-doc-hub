

## Refactor Field Dictionary Filtering & Mapping

### Problem

The Field Dictionary admin page has incorrect sections (like "Co-Borrower", "Dates", "Title") in the Section dropdown and shows all form types regardless of section. Additionally, the DB contains ~60+ spurious "sections" (like `charge_adjustment_loan_info`, `trust_ledger_tabs`, `eds_messaging`, etc.) that are UI scaffolding, not real data sections.

### The 11 Real Sections (from deal page top nav)

| # | UI Label | DB section(s) |
|---|----------|--------------|
| 1 | Borrower | `borrower`, `co_borrower` |
| 2 | Loan | `loan_terms` |
| 3 | Property | `property`, `insurance` |
| 4 | Funding | _(virtual tab, uses `loan_terms` data)_ |
| 5 | Broker | `broker` |
| 6 | Charges | `charges` |
| 7 | Escrow Impound | `escrow` |
| 8 | Conversation Log | `notes` |
| 9 | Events Journal | _(no DB fields — viewer only)_ |
| 10 | Lenders | `lender` |
| 11 | Other Origination | `origination_fees` |

### Forms per Section

| Section | Forms (from sub-navigation) |
|---------|----------------------------|
| Borrower | Primary, Co-Borrower, Authorized Party, Guarantor, Banking, Tax (1098), Notes, Attachment, Trust Ledger |
| Loan | Terms & Balances, Details, Penalties, Servicing |
| Property | Details, Legal Description, Insurance, Liens, Tax, Notes |
| Funding | Funding _(single form)_ |
| Broker | Broker Info, Banking |
| Charges | Detail |
| Escrow Impound | Primary _(single form)_ |
| Conversation Log | Primary _(single form)_ |
| Lenders | Lender Info, Authorized Party, Banking, Tax (1099), Funding |
| Other Origination | Fees _(single form)_ |

### Changes

#### 1. `FieldDictionaryPage.tsx` — Refactor filters

**Replace the SECTIONS array** with only the 11 deal page sections. Add a `SECTION_TO_DB_SECTIONS` mapping so "Borrower" filters fields where `section IN ('borrower', 'co_borrower')` and "Property" filters `section IN ('property', 'insurance')`.

**Make Form dropdown conditional** — only appears after a Section is selected. Dynamically populate it by querying distinct `form_type` values from the filtered fields, plus synthetic entries:
- For Borrower: add "Co-Borrower" option that filters to `section = 'co_borrower'`
- For Property: add "Insurance (Standalone)" for `section = 'insurance'`

**Remove** the Mandatory/Optional and Field Type filter dropdowns. Remove `filterDataType` and `filterMandatory` state variables.

**Update filtering logic** to use the section-to-DB mapping.

Also update the create/edit dialog Section dropdown to match these 11 sections (mapping back to the actual DB section enum on save).

#### 2. Update SECTIONS and FORM_TYPES constants

Replace `SECTIONS` with:
```typescript
const SECTIONS = [
  { value: 'borrower', label: 'Borrower' },
  { value: 'loan_terms', label: 'Loan' },
  { value: 'property', label: 'Property' },
  { value: 'funding', label: 'Funding' },
  { value: 'broker', label: 'Broker' },
  { value: 'charges', label: 'Charges' },
  { value: 'escrow', label: 'Escrow Impound' },
  { value: 'notes', label: 'Conversation Log' },
  { value: 'lender', label: 'Lenders' },
  { value: 'origination_fees', label: 'Other Origination' },
];
```

Add section-to-forms mapping:
```typescript
const SECTION_FORMS: Record<string, {value: string, label: string}[]> = {
  borrower: [
    { value: 'primary', label: 'Primary Borrower' },
    { value: 'co_borrower', label: 'Co-Borrower' },
    { value: 'authorized_party', label: 'Authorized Party' },
    { value: 'guarantor', label: 'Guarantor' },
    { value: 'banking', label: 'Banking' },
    { value: 'tax', label: '1098' },
    { value: 'notes', label: 'Notes' },
    { value: 'attachment', label: 'Attachment' },
  ],
  loan_terms: [
    { value: 'primary', label: 'Terms & Balances' },
    { value: 'balances', label: 'Balances' },
    { value: 'penalties', label: 'Penalties' },
    { value: 'servicing', label: 'Servicing' },
  ],
  // ... etc for each section
};
```

#### 3. Section-to-DB mapping for filtering

```typescript
const SECTION_TO_DB: Record<string, string[]> = {
  borrower: ['borrower', 'co_borrower'],
  loan_terms: ['loan_terms'],
  property: ['property', 'insurance'],
  funding: ['loan_terms'],  // funding form_type filter
  broker: ['broker'],
  charges: ['charges'],
  escrow: ['escrow'],
  notes: ['notes'],
  lender: ['lender'],
  origination_fees: ['origination_fees'],
};
```

When "Funding" is selected, filter to `section = 'loan_terms' AND form_type = 'funding'`. When "Co-Borrower" form is selected under Borrower, filter to `section = 'co_borrower'`.

#### 4. Exclude scaffolding sections from display

The DB contains ~40 scaffolding sections (`charge_adjustment_*`, `trust_ledger_*`, `eds_*`, `credit_report_*`, etc.) with ~400+ rows total. These should be excluded from the Field Dictionary display. The current filter `f.section !== 'other'` is insufficient. Instead, only show fields whose section is in the known DB sections list: `borrower`, `co_borrower`, `loan_terms`, `property`, `insurance`, `broker`, `charges`, `escrow`, `notes`, `lender`, `origination_fees`, `dates`, `seller`, `title`, `participants`, `other`.

#### 5. Keep create/edit dialog section dropdown in sync

When creating a new field, the Section dropdown should show the 11 UI sections. Selecting "Borrower" should default the DB `section` to `borrower`. If the user picks form "Co-Borrower", the DB `section` should be set to `co_borrower`. This requires a small mapping layer in the submit handler.

### Files Changed

| File | Change |
|------|--------|
| `src/pages/admin/FieldDictionaryPage.tsx` | Replace SECTIONS array, add SECTION_TO_DB mapping, add SECTION_FORMS mapping, make Form dropdown conditional, remove Mandatory/Type filters, update filtering logic, update create/edit dialog, exclude scaffolding sections |

No database changes needed — this is purely a UI/filtering refactor.

