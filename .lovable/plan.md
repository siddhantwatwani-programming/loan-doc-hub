

## Plan: Add Comment/Notes Box to Each HUD-1 Fee Row in Origination Fees

### Summary
Add a collapsible or inline comment/notes text box for each HUD-1 fee item (801–1108) in the Origination Fees form. Each item already has a `_d` field key defined in `FIELD_KEYS` that can serve as the comment storage. A small notes icon/toggle per row will expand a text area below the row for free-text input.

### File to Modify

**`src/components/deal/OriginationFeesForm.tsx`**

1. Update `renderFeeRow` to include an expandable comment box below each row:
   - Add a small "comment" icon button (e.g., `MessageSquare` from lucide-react) at the end of each row
   - Clicking it toggles a `Textarea` below the row bound to the item's `_d` field key
   - The icon shows a visual indicator (filled/highlighted) when a comment exists

2. Update `renderInsuranceRow` similarly to support comment boxes for 1000-series items

3. Add local state (`expandedComments: Set<string>`) to track which rows have their comment box open

4. Each comment textarea will:
   - Use the existing `_d` field key (e.g., `FIELD_KEYS.lendersLoanOriginationFee_d`)
   - Be a standard `Textarea` component
   - Span the full width of the row below the grid
   - Auto-expand if a saved comment exists on load

### Field Key Mapping (already defined)
All `_d` keys already exist in `FIELD_KEYS` and the field dictionary — no database migration needed:
- `801`: `lendersLoanOriginationFee_d`
- `802`: `lendersLoanDiscountFee_d`
- `803`: `appraisalFee_d`
- `804`: `creditReport_d`
- `805`: `lendersInspectionFee_d`
- `808`: `mortgageBrokerFee_d`
- `809`: `taxServiceFee_d`
- `810`: `processingFee_d`
- `811`: `underwritingFee_d`
- `901`: `interestForDays_d`
- `902`: `mortgageInsurancePremiums_d`
- `903`: `hazardInsurancePremiums_d`
- `904`: `countyPropertyTaxes_d`
- `905`: `vaFundingFee_d`
- `1001–1004`: Use existing `_d` or `_charge` keys
- `1101`: `settlementClosingFee_d`
- `1105`: `docPreparationFee_d`
- `1106`: `notaryFee_d`
- `1108`: `titleInsurance_d`

### No Database Migration Required
All field keys already exist in `FIELD_KEYS` and should already have corresponding `field_dictionary` entries from prior migrations. Values will persist via the existing `deal_section_values` JSONB mechanism.

### UI Design
- Comment icon appears as a 6th column (or inline button) at the right edge of each row
- When expanded, a `Textarea` appears below the row spanning the full grid width
- Rows with existing comments auto-expand on load
- Consistent with existing form styling

