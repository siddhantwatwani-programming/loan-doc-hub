

# Label Layout Changes and Currency Input Fix

## Changes Required

### 1. Borrower Primary Form (`src/components/deal/BorrowerPrimaryForm.tsx`)

**Current**: The labels "Full Name: If Entity, Use Entity" and "First: If Entity, Use Signer" are displayed as single long inline labels next to inputs.

**Change**: Split each into two lines:
- Main label: "Full Name" / "First"
- Subtitle below: "If Entity, Use Entity" / "If Entity, Use Signer" in smaller, muted text

Update the `InlineField` usage at lines 213-218 to use a stacked label layout where the hint text appears below the field label.

### 2. Additional Guarantor Form (`src/components/deal/BorrowerAdditionalGuarantorForm.tsx`)

**Same change** as above at lines 167-172:
- "Full Name: If Entity, Use Entity" becomes "Full Name" with subtitle
- "First: If Entity, Use Signer" becomes "First" with subtitle

### 3. Banking Form - Debit Amount (`src/components/deal/BorrowerBankingForm.tsx`)

**Current** (line 352-368): The `$` sign is rendered as a separate `<span>` outside the input, with `mr-2` spacing.

**Change**: Move the `$` inside the input field using a wrapper `div` with `relative` positioning and a `pl-6` padding on the input to make room for the dollar sign. This places the `$` visually inside the input border.

## Technical Details

### Files Modified

1. **`src/components/deal/BorrowerPrimaryForm.tsx`** (lines 213-218)
   - Replace `InlineField label="Full Name: If Entity, Use Entity"` with a custom layout: label "Full Name" on the left, hint "If Entity, Use Entity" below it in `text-xs text-muted-foreground`
   - Replace `InlineField label="First: If Entity, Use Signer"` with a custom layout: label "First" on the left, hint "If Entity, Use Signer" below it

2. **`src/components/deal/BorrowerAdditionalGuarantorForm.tsx`** (lines 167-172)
   - Same two label changes as above

3. **`src/components/deal/BorrowerBankingForm.tsx`** (lines 352-368)
   - Remove the outer `<div className="flex items-center flex-1">` wrapper with the separate `<span>$</span>`
   - Replace with a `relative` container and position the `$` as an absolute element inside the input using `absolute left-2 top-1/2 -translate-y-1/2`
   - Add `pl-6` to the input so text does not overlap the `$` sign

### What This Preserves
- All existing field keys, data binding, and save/update behavior
- All other fields and layout in each form
- No database or API changes
- No changes to any other components
