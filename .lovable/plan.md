

## Update Notes Section with Table-Based UI

### Overview

Replace the current generic `DealSectionTab` rendering for the Notes tab with a dedicated table-based component that matches the Broker tab's table pattern. The Notes section will display entries in a table with Date, Account, Name, and Reference columns, provide an "Add Notes" popup modal for creating entries, include a toolbar with File/Edit/View/Insert/Format menus, and add an Export to Excel function.

### Technical Changes

**1. New Component: `src/components/deal/NotesTableView.tsx`**

A table component following the `BrokersTableView` pattern:
- Columns: Date, Account, Name, Reference (with column configuration via `ColumnConfigPopover`)
- Each row represents a note entry
- Clicking a row opens the note detail
- Edit button per row
- Pagination support
- "Total Notes" footer

**2. New Component: `src/components/deal/NotesModal.tsx`**

A dialog/modal for adding and editing notes (following `BrokerModal` pattern):
- "High Priority" checkbox at the top
- Date field (prefilled with current date)
- Account field (prefilled with deal number or user info)
- Name field (prefilled with current user's name)
- Reference field (text input, dropdown info to be provided later by user)
- Notes textarea (large, rich text area for the note content)
- Save / Cancel buttons

**3. New Component: `src/components/deal/NotesSectionContent.tsx`**

The main section wrapper (following `BrokerSectionContent` pattern):
- Manages notes state extracted from deal values using `notes_entry1`, `notes_entry2`, etc. prefixes
- Handles add/edit/delete note operations
- Renders the toolbar (File, Edit, View, Insert, Format menus using Menubar) plus an Export button
- Renders `NotesTableView` as the main content
- Renders `NotesModal` for add/edit

**4. Update: `src/pages/csr/DealDataEntryPage.tsx`**

- Import `NotesSectionContent`
- Add a conditional branch for `section === 'notes'` (before the generic `DealSectionTab` fallback) to render `NotesSectionContent`

**5. Backend: Field Dictionary Entries (Database Migration)**

Register the following keys in `field_dictionary` under section `notes` so the save logic can persist them:
- `notes_entry.high_priority` (boolean)
- `notes_entry.date` (date)
- `notes_entry.account` (text)
- `notes_entry.name` (text)
- `notes_entry.reference` (text)
- `notes_entry.content` (text)

These will be stored using the existing indexed-key JSONB pattern (e.g., `notes_entry1.date`, `notes_entry2.date`) in `deal_section_values` under the `notes` section, exactly how brokers/lenders/properties are stored.

### Toolbar Details

The toolbar above the table will use the existing `Menubar` component (`@radix-ui/react-menubar`) with:
- **File** menu: placeholder items
- **Edit** menu: placeholder items
- **View** menu: placeholder items
- **Insert** menu: placeholder items
- **Format** menu: placeholder items
- **Export** button: Exports the notes table to an Excel/CSV file using client-side generation (no new dependencies -- will produce a `.csv` download)

### Data Flow

```text
NotesSection extracts notes from deal values (notes_entry1.*, notes_entry2.*, ...)
    |
    v
NotesTableView displays them in a table (Date, Account, Name, Reference)
    |
    v
Add/Edit via NotesModal -> calls onValueChange for each field
    |
    v
Existing saveDraft() persists via deal_section_values JSONB
```

### What Will NOT Change
- No changes to existing UI layout or components
- No changes to existing save/update APIs
- No changes to other sections (Borrower, Property, Loan, Broker, etc.)
- No new database tables (uses existing `deal_section_values` JSONB storage)
- No changes to document generation flow

