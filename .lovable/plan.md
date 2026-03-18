

## Plan: Participants Layout Update, Remove Role/Capacity Column, Broker Tax ID Type Dropdown

### 1. Remove 'Role/Capacity' column from Participants table

**File:** `src/components/deal/ParticipantsSectionContent.tsx`

- Remove `{ id: 'role_capacity', label: 'Role/Capacity', visible: true }` from `DEFAULT_COLUMNS` (line 82)
- Remove the `case 'role_capacity'` block from `renderCellValue` (lines 406-409)

### 2. Update Participants layout to match Property tab

**File:** `src/components/deal/ParticipantsSectionContent.tsx`

Restructure the return JSX (lines 423-553) to match the Property tab's layout pattern:
- Add a header section with `<h3>Participants</h3>` title on the left
- Move `ColumnConfigPopover` and `Add Participant` button to the header row (right side), matching Property's `Add Property` button style (use `variant="outline"`)
- Place `GridToolbar` below the header (separate row), same as Property tab
- Wrap the table in `<div className="border border-border rounded-lg overflow-x-auto">` like Property
- Wrap everything in `<div className="p-6 space-y-4">` like Property

### 3. Broker Tax ID Type dropdown with correct values

**File:** `src/components/contacts/broker-detail/Broker1099.tsx`

Change the `TIN Type` dropdown options from `ssn`/`ein` to the standardized values:
- `0` → Unknown
- `2` → EIN  
- `3` → SSN

Update default value from `'ssn'` to `'0'` (line 23).

No backend changes needed — `tinType` is already persisted via `broker.1099.tin_type` in `contact_data` JSONB using the existing save flow.

### No other changes
- No database schema changes
- No new APIs
- No other files modified

