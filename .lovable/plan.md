

## Fix: "Principal Balance" must show loan-level value, not lender-aggregated value

### Root cause

"Principal Balance" appears in two places near the Funding section, and both currently derive from lender funding rows instead of the loan's principal balance:

1. **Funding Grid header** (`src/components/deal/LoanFundingGrid.tsx`, lines 540–548) — the field labeled **Balance** at the top binds to `totalPrincipalBalance`, which is `Σ fundingRecords[i].principalBalance` (lender-level). When two lenders fund $50k each on a $80k-current loan, this shows $100k instead of $80k.

2. **Add Funding modal header** (`src/components/deal/AddFundingModal.tsx`, lines 695–704) — the **Principal Balance** field at the top binds to `formData.principalBalance`, which is hydrated from the per-lender record (`record.principalBalance`, set in LoanFundingGrid line 328). It also reflects only the row being edited, not the loan.

The correct, loan-level value already exists in the deal data:

- `values['loan_terms.principal']` — the current loan principal balance (already shown as **Principal** in the Loan Terms → Balances form).
- `values['loan_terms.loan_amount']` / `values['loan_terms.original_loan_amount']` — the original loan amount (already exposed by `LoanTermsFundingForm` as `loanAmount` and passed to the grid).

### Fix (surgical, no layout / schema / API changes)

#### 1. Pass loan-level principal through to the Funding Grid and modal

In `src/components/deal/LoanTermsFundingForm.tsx`:

- Read the loan-level principal balance the same way `LoanTermsBalancesForm` does:
  - `loanPrincipalBalance = values['loan_terms.principal'] || ''`
- Pass it as a new prop to `<LoanFundingGrid …>` (e.g. `loanPrincipalBalance={loanPrincipalBalance}`). Keep existing `loanAmount` prop untouched as a fallback.

In `src/components/deal/LoanFundingGrid.tsx`:

- Accept new optional prop `loanPrincipalBalance?: string` on `LoanFundingGridProps`.
- Compute a single `loanLevelPrincipalBalance` number = parse of `loanPrincipalBalance` (preferred). If empty/0, fall back to parsed `loanAmount` (original loan amount). Never use any lender aggregation.
- **Replace** the value bound to the header **Balance** input (lines 540–548): use `loanLevelPrincipalBalance` (formatted with the existing `Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`, or `'-'` when 0/empty). Field stays `readOnly`, same width, same `$` prefix, same classes — no UI/layout change.
- Pass the same `loanLevelPrincipalBalance` (formatted) into `<AddFundingModal …>` via a new optional prop `loanPrincipalBalance` so the modal header can show the loan-level value when the user opens Add/Edit.
- Do **not** touch any column logic, totals row math, or the per-lender `principalBalance` field on `FundingRecord` — those stay exactly as they are (they drive the "Principal Balance" column in the grid and existing per-lender behavior, which is out of scope).

#### 2. Make the Add Funding modal header show loan-level principal

In `src/components/deal/AddFundingModal.tsx`:

- Add optional prop `loanPrincipalBalance?: string` to `AddFundingModalProps`.
- In the header block (lines 695–704), bind the read-only `Principal Balance` Input's `value` to `loanPrincipalBalance ?? ''` instead of `formData.principalBalance`. Keep the field `readOnly`, currency `$` prefix, same width / styling — no layout change.
- **Do not change** the existing `formData.principalBalance` field, the per-lender hydration that sets it (`LoanFundingGrid` line 328), the interest-share math at line 560–562, or the persistence at line 692. Those remain per-lender and behave exactly as today (so the Funding grid's per-lender **Principal Balance** column, edit/save flow, totals row, and disbursement math are untouched). This satisfies the request: only the **top-of-section "Principal Balance"** display is corrected.

#### 3. Read-only, currency-formatted, reactive

Already satisfied by the existing `Input readOnly` with the `$` prefix and `Intl.NumberFormat`. Because the value comes from `values['loan_terms.principal']`, it automatically reflects updates made anywhere that writes to that loan-level field (Loan Terms → Balances → "Principal"), with no extra wiring.

### Files touched

- `src/components/deal/LoanTermsFundingForm.tsx` — read `loan_terms.principal`, pass as new prop to grid.
- `src/components/deal/LoanFundingGrid.tsx` — accept `loanPrincipalBalance`, bind it to the header **Balance** input, forward to modal.
- `src/components/deal/AddFundingModal.tsx` — accept `loanPrincipalBalance`, bind it to the header **Principal Balance** input.

No schema, API, RLS, document-generation, export, permissions, or other UI changes. The lender-level **Principal Balance** column inside the funding grid, totals row, and per-lender record persistence remain exactly as they are.

### Acceptance verification

- Funding screen top: **Balance** field shows the loan-level principal (matches Loan Terms → Balances → "Principal" / falls back to Original Loan Amount when Principal is blank).
- Example: Loan = $100,000, Principal Paid such that `loan_terms.principal` = $80,000, Lender A funded $50,000, Lender B $50,000 → top **Balance** shows **$80,000.00** (not $100,000).
- Add/Edit Lender Funding modal: top **Principal Balance** shows the same loan-level value, regardless of which lender row is being edited.
- Per-lender **Principal Balance** column in the grid, totals row, and lender disbursement/interest math are unchanged.
- No layout, font, spacing, color, or column changes anywhere.

