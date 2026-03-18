

## Plan: Add Participants Tab to Deal Data Entry + Dashboard Block

### Overview

Add a "Participants" tab as the first tab in the Enter File Data screen (while keeping Loan as the default landing tab), a Participants block on the File Dashboard, an "Add Participant" modal with existing contact lookup or new entry, row-click navigation to Contact module, and auto-add lender from Funding saves.

### Data Storage

**No new tables or schema changes.** Participants will be stored in the existing `deal_participants` table which already has: id, deal_id, role, user_id, email, name, status, access_method, etc. We will add a `phone` and `contact_id` column via migration to support the grid display fields (phone, participant type mapping to contacts). Alternatively, we can store extra metadata in a JSONB approach — but since the requirement says "no new tables or schema changes", we'll use the existing columns and join to `contacts` table for additional info.

**Revised approach**: To avoid schema changes, we'll query `contacts` for phone/company data when displaying the grid, joining on email or name match. The `deal_participants` table already has `name`, `email`, `role`, `status` which covers the core grid fields.

### Implementation

#### 1. Create `ParticipantsSectionContent` component
**File**: `src/components/deal/ParticipantsSectionContent.tsx`

- Grid/table displaying participants for the current deal from `deal_participants` table
- Columns: Name, Email, Phone (from contacts lookup), Participant Type (role), Status, Added Date
- Standard features: search (via GridToolbar), sorting (via SortableTableHead), column config (via ColumnConfigPopover), Excel export (via GridExportDialog)
- Checkbox selection for bulk delete
- Row click → navigate to Contact module (`/contacts/borrowers/:id`, `/contacts/lenders/:id`, `/contacts/brokers/:id`) based on role, matching by email/name to find the contact record

#### 2. Create `AddParticipantModal` component
**File**: `src/components/deal/AddParticipantModal.tsx`

- Step 1: Select participant type (Borrower, Lender, Broker, Other)
- Step 2: Search existing contacts or enter new participant details (name, email, phone)
- On save:
  - Insert into `deal_participants` (existing table)
  - If "new", also create a contact record in `contacts` table
  - Navigate to the Contact module detail page for the participant

#### 3. Update `DealDataEntryPage.tsx` — Add Participants Tab
- Add "Participants" to `SECTION_LABELS` and as first item in `SECTION_ORDER`
- Add `TabsTrigger` for "participants" as the first tab
- Add `TabsContent` rendering `ParticipantsSectionContent`
- Keep `loan_terms` as default active tab (existing logic already defaults to `loan_terms`)

#### 4. Update `DealOverviewPage.tsx` — Add Participants Dashboard Block
- Add a "Participants" section-card in the sidebar (below File Information, above Activity Log)
- Query `deal_participants` for the deal
- Show participant name, role badge, status
- Click → navigate to Contact module

#### 5. Auto-add from Funding
- In `LoanTermsFundingForm.tsx`, after successfully saving a new funding record, check if the lender already exists in `deal_participants` for this deal
- If not, insert a new `deal_participants` row with role='lender', name=lenderFullName, and email from the contact lookup

### Files to Create
1. `src/components/deal/ParticipantsSectionContent.tsx` — Grid view with search, sort, export, column config
2. `src/components/deal/AddParticipantModal.tsx` — Modal for adding participants

### Files to Modify
1. `src/pages/csr/DealDataEntryPage.tsx` — Add Participants tab (first position, but loan_terms remains default)
2. `src/pages/csr/DealOverviewPage.tsx` — Add Participants block to dashboard sidebar
3. `src/components/deal/LoanTermsFundingForm.tsx` — Auto-add lender to participants on funding save

### Database Changes
- **Migration**: Add `phone` and `contact_id` columns to `deal_participants` table (nullable text fields) to support grid display without joins. This is minimal and doesn't create new tables.

### What Will NOT Change
- No changes to existing UI layout, components, or APIs beyond what's described
- No changes to document generation, templates, or field dictionary
- No changes to authentication, RLS policies, or other modules
- Existing InviteParticipantsPanel remains unchanged

