

# Loan Penalties: Validation & Formatting

## Summary
Add US-standard formatting, input filtering, and inline validation to all 6 penalty sections in `LoanTermsPenaltiesForm.tsx`. Uses existing utilities from `numericInputFilter.ts`.

## Approach
Create a small set of reusable wrapper inputs (CurrencyInput, PercentInput, IntegerInput) inside the file, then swap plain `<Input>` elements for the appropriate typed input. No new files needed — all utilities already exist in `numericInputFilter.ts`.

## Field Classification

| Section | Field | Type |
|---|---|---|
| **Late Fee I & II** | Late Fee (Type) | Currency |
| | Grace Period | Integer |
| | Calendar / Actual | Integer |
| | Minimum Late Fee | Currency |
| | Percentage of Payment | Percentage |
| | Additional Daily Charge | Currency |
| | Distribution (Lenders, Orig, Vendors, Company, Other) | Text (no change) |
| **Default Interest** | Triggered By | Dropdown (no change) |
| | Grace Period | Integer |
| | Flat Rate | Percentage (already has sanitize) |
| | Modifier | Keep existing (already has sanitize) |
| | Active Until | Date (no change) |
| | Additional Daily Charge | Currency |
| | Distribution fields | Text (no change) |
| **Interest Guarantee** | Months | Integer |
| | Include Odd Days | Checkbox (no change) |
| | Amount | Currency |
| | Distribution fields | Text (no change) |
| **Pre-payment Penalty** | First Years | Integer |
| | Greater Than | Integer |
| | Of The | Dropdown (no change) |
| | Penalty Months | Integer |
| | Distribution fields | Text (no change) |
| **Maturity** | Grace Period (Days) | Integer |
| | Standard 10% | Checkbox (no change) |
| | Additional Flat Fee | Currency |
| | Distribution fields | Text (no change) |

## Changes (single file: `src/components/deal/LoanTermsPenaltiesForm.tsx`)

### 1. Add imports
```typescript
import {
  numericKeyDown, numericPaste,
  integerKeyDown, integerPaste,
  formatCurrencyDisplay, unformatCurrencyDisplay,
  formatPercentageDisplay
} from '@/lib/numericInputFilter';
```

### 2. Create 3 inline helper components

**CurrencyInput** — `$` prefix, right-aligned, comma-format on blur, `numericKeyDown`/`numericPaste`, placeholder `$0.00`

**PercentInput** — `%` suffix, right-aligned, format to 2 decimals on blur, validate 0-100, `numericKeyDown`/`numericPaste`, placeholder `0%`

**IntegerInput** — `integerKeyDown`/`integerPaste`, no decimals allowed, placeholder `0`

Each wraps the existing `<Input>` with focus/blur formatting state (same pattern as `ServicingInput` in the Servicing form).

### 3. Replace plain Inputs in each section

**LateFeeColumn** (applies to both I and II):
- Type field → CurrencyInput (Late Fee amount)
- Grace Period → IntegerInput
- Calendar / Actual → IntegerInput
- Minimum Late Fee → CurrencyInput
- Percentage of Payment → PercentInput
- Additional Daily Charge → CurrencyInput

**DefaultInterestColumn**:
- Grace Period → IntegerInput
- Additional Daily Charge → CurrencyInput
- Flat Rate & Modifier → keep existing `sanitizeInterestInput` (already validated)

**InterestGuaranteeSection**:
- Months → IntegerInput
- Amount → CurrencyInput

**PrepaymentPenaltySection**:
- first_years → IntegerInput
- greater_than → IntegerInput
- penalty_months → IntegerInput

**MaturitySection**:
- Grace Period (Days) → IntegerInput
- Additional Flat Fee → CurrencyInput

### What Will NOT Change
- Distribution text fields remain plain text inputs
- Dropdowns, checkboxes, date pickers unchanged
- No API, database, or schema changes
- No changes to any other file
- Flat Rate / Modifier keep existing `sanitizeInterestInput` logic

