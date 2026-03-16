

## Fix: Co-Borrower fields editable + Search icons on ID search components

### Changes

**1. `src/components/deal/LoanTermsDetailsForm.tsx`**
- Remove the auto-sync of Co-Borrower ID/Name from Borrower ID selection (lines 174-177)
- Make Co-Borrower ID editable: remove `disabled`, remove `bg-muted`, add `onChange` handler
- Make Co-Borrower Name editable: remove `disabled`, remove `bg-muted`, add `onChange` handler

**2. `src/components/deal/BorrowerIdSearch.tsx`**
- Replace `ChevronDown` import with `Search` from lucide-react
- Change the icon from `ChevronDown` to `Search` (line 163)

**3. `src/components/deal/BrokerIdSearch.tsx`**
- Replace `ChevronDown` import with `Search` from lucide-react
- Change the icon from `ChevronDown` to `Search` (line 163)

**4. `src/components/deal/LenderIdSearch.tsx`**
- Replace `ChevronDown` import with `Search` from lucide-react
- Change the icon from `ChevronDown` to `Search` (line 166)

### Persistence
Co-Borrower ID and Co-Borrower Name already have field keys (`FIELD_KEYS.coBorrowerId`, `FIELD_KEYS.coBorrowerName`) in the field key map and are already part of the values state. Making them editable means `onValueChange` will update the values record, and the existing `saveDraft` flow will persist them. No backend changes needed.

### What this does NOT change
- No database schema changes
- No new APIs or tables
- No UI layout changes beyond the specified fields
- No changes to document generation

