

## Move Lender ID Above Lender Type

### Change
In `src/components/deal/LenderInfoForm.tsx`, swap the order of the **Lender ID** and **Lender Type** fields in Column 1 ("Name") so that Lender ID appears first.

### Technical Details

**File:** `src/components/deal/LenderInfoForm.tsx`

- Move the Lender ID input block (currently lines 199-208) to appear **before** the Lender Type select block (currently lines 179-197).
- No changes to field keys, data persistence, or any other layout. The existing `lender.lender_id` and `lender.type` keys remain unchanged, so data will continue to save and populate correctly.

