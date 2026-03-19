

# Plan: Move Escrow Impound Under Loan Left Nav + Add History & Trust Ledger

## Summary

Remove the top-level "Escrow Impound" tab and add three new sub-sections to the Loan left navigation (after Penalties): History (coming soon), Trust Ledger (coming soon), and Escrow Impound (existing escrow content).

## Changes

### 1. LoanTermsSubNavigation.tsx

Add three new entries to the type union and SECTIONS array:

```
export type LoanTermsSubSection = 
  'balances_loan_details' | 'details' | 'penalties' | 'servicing' 
  | 'history' | 'trust_ledger' | 'escrow_impound';
```

Add after 'servicing':
- `{ key: 'history', label: 'History' }`
- `{ key: 'trust_ledger', label: 'Trust Ledger' }`
- `{ key: 'escrow_impound', label: 'Escrow Impound' }`

### 2. LoanTermsSectionContent.tsx

- Accept new props: `escrowFields` (FieldDefinition[]) for the escrow section fields
- Add three new cases in renderSubSectionContent:
  - **history**: Render inline "Coming Soon" placeholder (styled like ComingSoonPage)
  - **trust_ledger**: Render inline "Coming Soon" placeholder
  - **escrow_impound**: Render `DealSectionTab` with escrowFields, passing through values/onValueChange/showValidation/disabled/calculationResults

### 3. DealDataEntryPage.tsx

- Remove `'escrow'` from `SECTION_ORDER` (line 91)
- Remove `'escrow'` from `SECTION_LABELS` (line 74) - or keep it but unused
- In the `loan_terms` TabsContent (line 968-977), pass `escrowFields={fieldsBySection['escrow'] || []}` to LoanTermsSectionContent
- The existing escrow TabsContent (rendered via the generic section loop) will no longer render because 'escrow' is filtered from the tab list
- Update the dirty-field detection for loan_terms tab to also include escrow-prefixed dirty keys

### 4. No Backend Changes

Escrow fields already persist via `deal_section_values` with section `escrow`. The existing `saveDraft` and `updateValue` handle them. Moving the UI location does not change persistence.

## Files Modified

1. `src/components/deal/LoanTermsSubNavigation.tsx` - add 3 sub-section entries
2. `src/components/deal/LoanTermsSectionContent.tsx` - add rendering for 3 new sub-sections
3. `src/pages/csr/DealDataEntryPage.tsx` - remove escrow from top tabs, pass escrow fields to Loan section

