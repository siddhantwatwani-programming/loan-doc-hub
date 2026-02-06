

# Charges Tab Redesign

## Overview
Redesign the Charges modal and detail form to match the provided screenshot, adding three sections (Loan Information, Charge Information, Distribution), renaming "Change Type" to "Charge Type" with a dropdown, and updating the table columns accordingly.

## Changes by File

### 1. `ChargesTableView.tsx`
- Add new fields to `ChargeData` interface: `account`, `borrowerFullName`, `chargeType`, `advancedBy`, `onBehalfOf`, `amountOwedByBorrower`
- Rename `changeType` to `chargeType` in the interface
- Update `DEFAULT_COLUMNS`: rename "Change Type" to "Charge Type", add columns for Account, Borrower Full Name, Advanced By, On Behalf Of, Amount Owed By Borrower
- Update `renderCellValue` to handle `chargeType` instead of `changeType`, and handle new fields

### 2. `ChargesModal.tsx`
Rebuild the modal layout to match the screenshot with three sections:

**Loan Information** (blue section header)
- Account (text input, full width)
- Borrower Full Name (text input, full width)

**Charge Information** (blue section header)
- Row 1: Date of Charge (date) | Interest From (date)
- Row 2: Reference (text) | Charge Type (dropdown)
- Row 3: Original Amount (currency with $ prefix) | Description (text)
- Row 4: Interest Rate (number with % suffix) | Notes (textarea)
- Row 5: Deferred (checkbox)

**Distribution** (blue section header)
- Advanced By: Account (input) | `-` separator | Lender Name (input) | Amount with $ prefix (input)
- On Behalf Of: Account (input) | `-` separator | Lender Name (input) | Amount with $ prefix (input)
- Amount Owed by Borrower: $ input

Footer: OK and Cancel buttons

**Charge Type dropdown values** (as shown in screenshot):
Demand Fee, Online Payment Fee, Modification Doc Prep, New Account Setup, Origination Doc Prep, Beneficiary Wire, Wire Processing, NSF Charge, Account Close Out, Extension / Modification Doc Prep, Pay By Phone, Account Maintenance, Beneficiary Origination, Administrative Services, Professional Services, Foreclosure Processing Fees - Trustee's Fees, Setup Fee, SO110-Servicing Fee, Holdback

### 3. `ChargesDetailForm.tsx`
Mirror the same three-section layout as the modal for the detail view when a row is clicked.

### 4. `ChargesSectionContent.tsx`
- Update field key mappings: `change_type` becomes `charge_type`
- Add new field keys: `account`, `borrower_full_name`, `advanced_by`, `on_behalf_of`, `amount_owed_by_borrower`
- Update `extractChargesFromValues` to read new fields
- Update `handleSaveCharge` to persist new fields

## Data Storage
All new fields persist in the existing `deal_section_values` JSONB using the `chargeN.*` prefix pattern:
- `charge1.account`, `charge1.borrower_full_name`, `charge1.charge_type`
- `charge1.advanced_by`, `charge1.on_behalf_of`, `charge1.amount_owed_by_borrower`

No database schema changes required.

## Technical Details

### Distribution Section Layout (matching screenshot)
The Distribution section uses a table-like grid:
- Header row: Account | Lender Name | Amount
- "Advanced By" row: text input | text input | currency input
- "On Behalf Of" row: text input | text input | currency input
- Bottom row: "Amount Owed by Borrower:" label with currency input

All distribution fields are plain text inputs (not dropdowns) per user direction.

### Files Modified
1. `src/components/deal/ChargesTableView.tsx`
2. `src/components/deal/ChargesModal.tsx`
3. `src/components/deal/ChargesDetailForm.tsx`
4. `src/components/deal/ChargesSectionContent.tsx`

### No Changes To
- Database schema
- Backend APIs or edge functions
- Other tabs or components
- Document generation flow

