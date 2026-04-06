

## Plan: Update Insurance Modal, Form, and Table Grid

### Summary
1. Add a Column config popover button before "Add Insurance" (same as Liens)
2. Change "Insurance Company" dropdown to a static list of US insurance companies (replacing contacts fetch)
3. Items 4-6 already exist in the current code — no changes needed
4. Remove "Active" checkbox and "Red Flag Trigger" dropdown from Insurance Tracking section

### Changes

**1. InsuranceTableView.tsx** — Add Column config button
- Import `ColumnConfigPopover`, `ColumnConfig`, `useTableColumnConfig` (same as LiensTableView)
- Define `DEFAULT_COLUMNS` array matching current grid columns
- Add `ColumnConfigPopover` button before "Add Insurance" button (same layout as Liens)
- Render only visible columns in table header and body
- Update colSpan for empty state to use `visibleColumns.length + 1`

**2. InsuranceModal.tsx** — Replace contacts dropdown with US insurance companies
- Remove the `contactOptions` state and the `useEffect` that fetches from `contacts` table
- Remove the `supabase` import
- Add a static `US_INSURANCE_COMPANIES` array (State Farm, Allstate, GEICO, Progressive, Liberty Mutual, Nationwide, Farmers, USAA, Travelers, American Family, Erie Insurance, Auto-Owners, Hartford, Chubb, MetLife, AIG, Zurich, Cincinnati Financial, Hanover, etc.)
- Replace the custom `Ins. Company` Select to use `renderInlineSelect('companyName', 'Ins. Company', US_INSURANCE_COMPANIES, 'Select company')`

**3. PropertyInsuranceForm.tsx** — Same change for Insurance Company dropdown
- Remove the `contactOptions` state and the `useEffect` fetching contacts
- Remove the `supabase` import
- Use the same `US_INSURANCE_COMPANIES` static list in the Select dropdown

**4. InsuranceModal.tsx** — Remove "Active" and "Red Flag Trigger" from Insurance Tracking
- Remove lines 264-267 (Active checkbox under Insurance Tracking)
- Remove line 268 (`renderInlineSelect('redFlagTrigger', ...)`)

**5. PropertyInsuranceForm.tsx** — No changes needed for items 4-7
- Annual Premium, Frequency, Impounds title already exist
- Insurance Tracking section doesn't have Active or Red Flag Trigger in the detail form (only in modal)

### No Database/Schema Changes
All data persists via existing JSONB keys. The `companyName` field stores the selected company name string as before.

### Files Changed
| File | Change |
|---|---|
| `src/components/deal/InsuranceTableView.tsx` | Add Column config popover (same pattern as Liens) |
| `src/components/deal/InsuranceModal.tsx` | Replace contacts dropdown with US insurance companies; remove Active + Red Flag Trigger from Insurance Tracking |
| `src/components/deal/PropertyInsuranceForm.tsx` | Replace contacts dropdown with US insurance companies |

