
## Fix: Lender, Charges, and Notes Tabs Missing

### Root Cause

The `field_dictionary` table now contains 1,330+ rows. The Supabase PostgREST server enforces a hard `max-rows` cap of 1,000, which overrides the client-side `.limit(5000)`. Both the `resolveAllFields()` query and the TMO tab-sections query return only 1,000 rows (confirmed by `content-range: 0-999/*` in network responses). Fields for `lender`, `broker`, `charges`, and `notes` sections are cut off because they fall beyond the 1,000-row boundary.

### Solution

Create a paginated fetch helper that retrieves all rows using `.range()` calls in batches of 1,000, then apply it to every `field_dictionary` query that may exceed 1,000 rows.

### Technical Changes

**1. New helper: `src/lib/supabasePagination.ts`**

A reusable function `fetchAllRows()` that:
- Accepts a Supabase query builder callback
- Fetches in pages of 1,000 using `.range(0, 999)`, `.range(1000, 1999)`, etc.
- Stops when a page returns fewer rows than the page size
- Returns the concatenated array

**2. Update `src/lib/requiredFieldsResolver.ts`**

- `resolveAllFields()` (line 68-72): Replace single `.limit(5000)` query with paginated fetch
- `resolvePacketFields()` if it also queries `field_dictionary` with the same pattern

**3. Update `src/hooks/useDealFields.ts`**

- TMO tab-sections fetch (line 256-262): Replace single query with paginated fetch

**4. Update `src/lib/accessControl.ts`**

- `fetchFieldVisibility()` (line 75-78): Replace single query with paginated fetch

**5. Update `src/pages/admin/FieldDictionaryPage.tsx`**

- Admin field list fetch: Replace single query with paginated fetch

**6. Update `src/pages/admin/FieldMapEditorPage.tsx`**

- Field dictionary fetch in editor: Replace single query with paginated fetch

### What Will NOT Change
- No UI layout or component changes
- No database schema changes
- No API contract changes
- No changes to save/update logic
- No changes to tab rendering, routing, or permissions logic

### Result
All 1,330+ field dictionary entries will be fully loaded, restoring the Lender, Charges, Notes, and Broker tabs in the Enter File Data view.
