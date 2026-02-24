

# UI Alignment & Layout Fixes

## Overview
Three sets of changes across Loan Terms & Balances form, Add Funding modal, and currency field styling for Lien forms/modals.

## Changes

### 1. Loan Terms & Balances - Sold Rate Alignment (LoanTermsBalancesForm.tsx)

**Current:** The Sold Rate input has a checkbox + label taking `min-w-[130px]` but the input is inside a different structure than Note Rate's `renderPercentField`.

**Fix:** Restructure the Sold Rate row so the input field uses `flex-1` with `pr-7` (matching Note Rate's percent field pattern), ensuring consistent width and alignment.

### 2. Loan Terms & Balances - Accept Short Payments Alignment (LoanTermsBalancesForm.tsx)

**Current:** Accept Short Payments has a `$` input with fixed `w-24`, then "Or" text and Percent checkbox inline.

**Fix:** 
- Change the `$` input from `w-24` to `flex-1` to match the width of other fields
- Move "Or" checkbox + "Percent" label below the input as a sub-label line (matching the sub-label pattern used for "Months", "Held By", "Hold Days")

### 3. Add Funding Modal - Layout Restructure (AddFundingModal.tsx)

**Current:** The right column has "Broker or family..." in a bordered box and "NOTE:" in a separate bordered box.

**Fix:**
- Remove the 3-column grid layout - make it a single 2-column form
- Move the "NOTE:" section below the Notes textarea, remove its border
- Move the "Broker or family will participate in funding" checkbox below the NOTE section as a single line, remove its border

### 4. Currency Fields - $ Inside Input (LienDetailForm.tsx, LienModal.tsx, PropertyLiensForm.tsx)

**Current:** The `$` symbol is rendered as a separate `<span>` outside/beside the `<Input>`.

**Fix:** For Original Balance, Balance After, and Regular Payment fields in all three files, move the `$` symbol inside the input using absolute positioning (`absolute left-3`) and add `pl-7` padding to the input. This matches the pattern already used in `LoanTermsBalancesForm.tsx`'s `renderCurrencyField`.

## Files Modified

1. **`src/components/deal/LoanTermsBalancesForm.tsx`**
   - Lines 166-187: Restructure Sold Rate row for proper alignment
   - Lines 311-339: Restructure Accept Short Payments - make input full-width, move "Or Percent" below

2. **`src/components/deal/AddFundingModal.tsx`**
   - Lines 83-161: Remove 3-column grid, move NOTE and broker checkbox below Notes textarea, remove borders

3. **`src/components/deal/LienDetailForm.tsx`**
   - Lines 40-48: Update `renderCurrency` helper to use absolute-positioned `$` inside input with `pl-7`

4. **`src/components/deal/LienModal.tsx`**
   - Lines 55-63: Update `renderCurrencyField` helper to use absolute-positioned `$` inside input with `pl-7`

5. **`src/components/deal/PropertyLiensForm.tsx`**
   - Lines 139-152, 169-180: Update Original Balance, Regular Payment fields to use `$` inside input

## No Changes To
- Database schema or tables
- APIs or edge functions
- Save/update logic
- Any other components or pages
- Data handling or state management

