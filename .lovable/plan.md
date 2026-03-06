

## Problem

When Admin sets a CSR user to "View Only" permission level, several sections don't respect the restriction:

1. **Other Section** — The `DealSectionTab` for "other" doesn't receive `isSectionDisabledByFormPerm` — fields remain editable
2. **Other Origination** — `OriginationFeesSectionContent` has `disabled={false}` hardcoded
3. **Escrow Impound** — The `DealSectionTab` for "escrow" falls into the generic else branch which doesn't pass a `disabled` prop based on form permissions
4. **Funding Section** — `LoanFundingGrid` doesn't receive `disabled` prop; Add/History buttons, search, export, row clicks all remain active
5. **Event Journal** — `EventJournalViewer` has no `disabled` prop; search, export, filter all remain active
6. **Conversation Log** — `NotesTableView` receives `disabled` but the "As Of" date input is not gated by it

## Plan

### 1. DealDataEntryPage.tsx — Pass disabled to missing sections

- **"other" section** (line ~1018): Add `disabled` computed value to the outer `DealSectionTab` wrapper. Since `DealSectionTab` doesn't have a `disabled` prop directly, the fix is to set all fields read-only via the orchestration props. Actually, looking at the code, the "other" section doesn't pass `disabled` info — the `DealSectionTab` uses `orchestrationCanEdit` for external users. For internal CSR view-only, we need to wire it differently. The simplest approach: when `isSectionDisabledByFormPerm(section)` is true, set `orchestrationCanEdit={false}` so all fields become read-only.

  For "other" (line 1035): change `orchestrationCanEdit={orchestrationCanEdit}` → `orchestrationCanEdit={isSectionDisabledByFormPerm('other') ? false : orchestrationCanEdit}`

- **"escrow"** — falls into the generic else branch (line 1042). Same fix: add `orchestrationCanEdit={isSectionDisabledByFormPerm(section) ? false : orchestrationCanEdit}`

  Actually, looking more carefully, the generic else branch at line 1042 already doesn't pass `disabled`. It uses `orchestrationCanEdit`. So the fix for all generic sections (escrow included) is the same pattern.

- **Origination Fees** (line 1089): Change `disabled={false}` → `disabled={isSectionDisabledByFormPerm('origination_fees')}`

- **Event Journal** (line 1078): Pass `disabled={isSectionDisabledByFormPerm('event_journal')}` — requires adding `disabled` prop to `EventJournalViewer`

- **Funding** (line 1064-1073): Already passes `disabled` with `isSectionDisabledByFormPerm("funding")`. But `LoanFundingGrid` doesn't accept/use a `disabled` prop. Need to thread it through.

### 2. LoanFundingGrid.tsx — Add disabled prop support

- Add `disabled?: boolean` to props interface
- When `disabled`, hide/disable Add Funding button, History button, bulk delete, export button
- Disable search input, row click interactions
- Pass through from `LoanTermsFundingForm` which already receives `disabled`

### 3. LoanTermsFundingForm.tsx — Thread disabled to LoanFundingGrid

- Pass the existing `disabled` prop down to `LoanFundingGrid`

### 4. EventJournalViewer.tsx — Add disabled prop support

- Add `disabled?: boolean` prop
- When disabled: hide/disable export button in GridToolbar, disable search input, disable filter dropdowns
- The Event Journal is already read-only (no add/edit), so mainly disable toolbar interactions (search, filter, export)

### 5. NotesTableView.tsx — Disable "As Of" date input when disabled

- Add `disabled` attribute to the date `<input>` element (line 158-162)
- Hide the clear button when disabled

### 6. DealSectionTab.tsx — Handle form-permission-based view-only for internal users

- The `DealSectionTab` already makes fields read-only when `orchestrationCanEdit` is false (for external users) or based on field permissions. For internal CSR view-only, the simplest fix is to pass the disabled flag through `orchestrationCanEdit` from the parent.

## Files to modify

1. **`src/pages/csr/DealDataEntryPage.tsx`** — Pass form permission disabled state to Other, Escrow (generic branch), Origination Fees, Event Journal sections
2. **`src/components/deal/LoanFundingGrid.tsx`** — Add `disabled` prop, disable Add/History/Export buttons and toolbar
3. **`src/components/deal/LoanTermsFundingForm.tsx`** — Thread `disabled` to `LoanFundingGrid`
4. **`src/components/deal/EventJournalViewer.tsx`** — Add `disabled` prop, disable toolbar actions
5. **`src/components/deal/NotesTableView.tsx`** — Disable "As Of" date input when `disabled`

