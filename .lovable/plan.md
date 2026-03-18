

## Plan: Enhance Participants Grid with ID, Capacity, and Property-style Layout

### Requirements
1. Add an **ID** column before Name (shows Borrower ID / Lender ID / Broker ID from linked contact's `contact_id`)
2. Add a **Capacity** column (auto-populated from `contact_data.capacity` in the contacts table)
3. Update layout to match the Property tab style (uppercase headers, `bg-muted/50` header row, footer summary row, `min-w` on table)

### File: `src/components/deal/ParticipantsSectionContent.tsx`

**Changes:**

1. **Extend `Participant` interface** — add `contact_id_display: string` and `capacity: string` fields

2. **Update `DEFAULT_COLUMNS`** — insert `{ id: 'contact_id_display', label: 'ID', visible: true }` before `name`, and add `{ id: 'capacity', label: 'Capacity', visible: true }` after `role`

3. **Update `SEARCHABLE_FIELDS`** — add `'contact_id_display'` and `'capacity'`

4. **Update `fetchParticipants`** — expand the contacts query to also select `contact_id, contact_data`; extract `contact_id` (the display ID like `B-12345`) and `contact_data.capacity` from each linked contact; map these into the participant objects

5. **Update `renderCellValue`** — add cases for `contact_id_display` and `capacity` columns

6. **Update table markup to match Property layout:**
   - Add `className="min-w-[1400px]"` to `<Table>`
   - Add `className="bg-muted/50"` to header `<TableRow>`
   - Uppercase column labels via `.toUpperCase()` in `SortableTableHead`
   - Add footer summary: `Total Participants: {count}`

### No Backend Changes
- The `contacts` table already stores `contact_id` (display ID) and `contact_data.capacity`
- No new columns, tables, or migrations needed
- Uses existing Supabase select queries, just fetching additional fields

