

## Plan: Participants — Originating Vendor field + Phone formatting

### Scope
Two minimal additions to the **Enter File Data → Participants** module. No schema changes, no API changes, no other modules touched.

### 1. Phone formatting in Participants grid `(XXX) XXX-XXXX`

**File:** `src/components/deal/ParticipantsSectionContent.tsx`

- Add a small `formatPhoneDisplay(value)` helper that strips non-digits and formats 10-digit numbers as `(XXX) XXX-XXXX`. Numbers shorter/longer than 10 digits fall back to the raw value (so existing data isn't hidden).
- Update the `'phone'` case inside `renderCellValue()` to render `formatPhoneDisplay(participant.phone)` instead of the raw string.
- Also apply the same formatter inside the `GridExportDialog` data path so exports stay consistent (passed via `filteredData` mapping or by formatting before export — minimal change preferred: just format in the cell renderer; export already uses raw `phone` field, we'll map it through the formatter in the data passed to the dialog).

Storage stays unchanged — raw digits remain in `deal_participants.phone` and `contacts.phone`. This is **display-only formatting**, matching the standard already used by `PhoneInput` (`src/components/ui/phone-input.tsx`).

### 2. "Originating Vendor" auto-populated field

**Where it appears:** In the Participants grid as a **new column** (label: `Originating Vendor`), so it follows the existing column-config pattern users already understand (visible by default, toggleable via `ColumnConfigPopover`).

**Logic** (computed client-side, no new persisted field):
- Scan the loaded `participants` array for entries with `role === 'broker'`.
- If **exactly 1 broker** exists → cell shows that broker's `name` (read-only auto-fill).
- If **multiple brokers** exist → cell shows the broker that was selected for the deal. Selection is persisted in the existing `deal_section_values` row (`section='participants'`) under a single key `originating_vendor_contact_id`, using the same JSONB pattern already used for `participant_<contactId>_capacity`. The cell renders a small inline `<Select>` of broker names so the user can pick; on change we update that one key via the existing `deal_section_values` upsert path used in `AddParticipantModal.handleSave` (lines ~293-313).
- If **0 brokers** → cell shows an empty placeholder `—` with muted "Add a Broker participant" hint text (no hard validation popup, since the grid itself has no save action; this matches existing empty-state behavior in the file).

**Files touched:**
- `src/components/deal/ParticipantsSectionContent.tsx`
  - Add `originating_vendor_contact_id` to the existing `deal_section_values` fetch (already fetched on lines 222-239 — just read one extra key from the same row).
  - Add `'originating_vendor'` to `DEFAULT_COLUMNS` (visible by default, after `participant_type_capacity`).
  - Add a small handler `handleOriginatingVendorChange(contactId)` that upserts the key into `deal_section_values` (mirrors lines 293-313 of `AddParticipantModal`).
  - Add a `case 'originating_vendor':` branch in `renderCellValue()` implementing the 1-broker / multi-broker / no-broker UI above.

### What is NOT changed
- No DB schema changes, no new tables, no new columns.
- No changes to `AddParticipantModal`, contact pages, document generation, permissions, or any other grid.
- No change to how phone numbers are stored — raw digits remain canonical; formatting is display-only.
- Existing columns, sorting, filtering, search, export, pagination, selection, and bulk-delete behavior remain untouched.
- The `originating_vendor_contact_id` key is auto-skipped by the existing capacity regex (`/^participant_(.+)_capacity$/`), so no other code paths are affected.

### Validation
- Grid `Phone` column displays `(415) 555-1234` for stored `4155551234`; partial/invalid numbers display unchanged.
- With 1 broker participant → Originating Vendor cell auto-shows that broker's name.
- Adding a 2nd broker → cell becomes a dropdown; selection persists across reloads.
- Removing all brokers → cell shows `—`.
- Export reflects the formatted phone and the resolved Originating Vendor name.

