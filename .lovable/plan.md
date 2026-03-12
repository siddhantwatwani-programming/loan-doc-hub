

## Plan: Fix Funding Data Persistence Issue

### Root Cause Analysis

After tracing the full save and hydration flow in `useDealFields.ts`, the funding data uses field keys `loan_terms.funding_records` and `loan_terms.funding_history` stored as JSON strings in `value_text` within the `deal_section_values` JSONB column. The code flow theoretically works, but there are two silent failure points:

1. **Save path** (line 827-832 in `useDealFields.ts`): If the `fieldIdMap` doesn't contain the funding field key, AND the fallback dictionary lookup also fails to find it, the field is silently skipped with `if (!fieldDictId) continue;` — no error, no warning, data is lost.

2. **Hydration path** (line 456-506): If the UUID stored in JSONB doesn't match any entry in `fieldDictIdToMeta`, the value is silently skipped — again, no error.

The fix needs to ensure the funding JSON data is reliably persisted and retrieved regardless of timing/race conditions with field resolution.

### Implementation

#### 1. Add direct-persist on Add Funding (same pattern as delete)

In `LoanTermsFundingForm.tsx`, the `handleDeleteRecord` already does a direct database write to ensure deletion persists immediately. Apply the same pattern to `handleAddFunding` and `handleUpdateRecord`:

- After calling `onValueChange`, also perform a direct database write to `deal_section_values` for the `loan_terms` section, resolving the `field_dictionary` UUID for `loan_terms.funding_records` and `loan_terms.funding_history`.
- This ensures data is written to the database immediately, not dependent on the user clicking "Save" or on `fieldIdMap` being fully populated.

#### 2. Add explicit hydration for funding keys in `LoanTermsFundingForm`

Add a `useEffect` in `LoanTermsFundingForm` that directly queries `deal_section_values` for the `loan_terms` section on mount. If the component's `values` prop doesn't contain funding data but the database does, parse the JSONB and inject it via `onValueChange`. This provides a fallback hydration path.

#### 3. Add console warnings for debugging

In `useDealFields.ts` save logic, add a `console.warn` when a field key is skipped (line 832) to aid future debugging.

### Files to Modify

- **`src/components/deal/LoanTermsFundingForm.tsx`**: Add direct-persist logic to `handleAddFunding` and `handleUpdateRecord` (mirroring existing `handleDeleteRecord` pattern). Add mount-time hydration `useEffect` to load funding data directly from DB if values are empty.
- **`src/hooks/useDealFields.ts`**: Add console.warn at the silent skip point for better debuggability.

### No Changes To
- Database schema
- UI layout
- Other existing functionality
- Document generation flow

