

## Plan: Remove "Insured's Name" and "Coverage Amount" from Insurance

### Current State
- The modal (`InsuranceModal.tsx`) already does NOT render these fields (removed in a prior change)
- The table grid (`InsuranceTableView.tsx`) already does NOT show these as columns
- However, both fields still exist in:
  - `InsuranceData` interface (lines 22, 26)
  - `InsuranceDetailForm.tsx` — renders "Insured's Name" (line 175) and "Coverage" (lines 180-188)
  - `InsuranceSectionContent.tsx` — maps/persists both fields
  - `InsuranceModal.tsx` — `getDefaultInsurance()` still includes them; `coverage` formatting logic remains

### Changes Required

**1. `InsuranceDetailForm.tsx`** — Remove UI rendering
- Remove line 175: `{renderField('insuredName', "Insured's Name")}`
- Remove lines 180-188: Coverage field block (DirtyFieldWrapper + currency input)
- Remove `insuredName` and `coverage` from `DIRTY_KEY_MAP`

**2. `InsuranceTableView.tsx`** — Remove from interface
- Remove `insuredName` and `coverage` from `InsuranceData` interface

**3. `InsuranceModal.tsx`** — Clean up defaults
- Remove `insuredName` and `coverage` from `getDefaultInsurance()`
- Remove coverage formatting logic in `useEffect` and `handleConfirmSave`

**4. `InsuranceSectionContent.tsx`** — Remove mapping/persistence
- Remove `insuredName` and `coverage` from extraction, defaults, field mapping, and hasData filter

### No Other Changes
- No database/schema changes
- No new tables
- No API changes

### Files Changed
| File | Change |
|---|---|
| `InsuranceDetailForm.tsx` | Remove Insured's Name field + Coverage field rendering + dirty keys |
| `InsuranceTableView.tsx` | Remove from `InsuranceData` interface |
| `InsuranceModal.tsx` | Remove from defaults + coverage formatting |
| `InsuranceSectionContent.tsx` | Remove from data mapping/persistence |

