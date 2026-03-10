

## Event Journal (Change Log System) Implementation Plan

### Overview
Implement a per-deal Event Journal that automatically logs every field change with old→new values, plus a Global Event Journal page accessible from the sidebar. The existing `activity_log` table will be reused — no new tables.

### 1. Database: New Migration
Add a new `event_journal` table (separate from `activity_log` to avoid polluting the existing system):

```sql
CREATE TABLE public.event_journal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  event_number integer NOT NULL,
  actor_user_id uuid NOT NULL,
  section text NOT NULL,
  details jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_journal_deal ON public.event_journal(deal_id, event_number DESC);
ALTER TABLE public.event_journal ENABLE ROW LEVEL SECURITY;

-- RLS: CSR and Admin can view/insert
CREATE POLICY "CSRs can view event journal" ON public.event_journal
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'csr') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "CSRs can insert event journal" ON public.event_journal
  FOR INSERT TO authenticated
  WITH CHECK ((has_role(auth.uid(), 'csr') OR has_role(auth.uid(), 'admin')) AND auth.uid() = actor_user_id);

-- Auto-increment event_number per deal
CREATE OR REPLACE FUNCTION public.set_event_journal_number()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  SELECT COALESCE(MAX(event_number), 0) + 1 INTO NEW.event_number
  FROM public.event_journal WHERE deal_id = NEW.deal_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_event_journal_number
  BEFORE INSERT ON public.event_journal
  FOR EACH ROW EXECUTE FUNCTION public.set_event_journal_number();
```

The `details` column stores an array of `{ fieldLabel, oldValue, newValue }` objects.

### 2. Hook: `useEventJournal.ts` (New File)
- `logFieldChanges(dealId, section, changes[])` — inserts a single event_journal row with all field changes from a save
- Called from `saveDraft` in `useDealFields.ts` — compare old values (snapshot taken at load time) vs new values to detect changes, grouped by section label
- `useEventJournalEntries(dealId)` — fetches event journal entries for a deal, with actor names from profiles

### 3. Capture Old→New Values in `useDealFields.ts`
- Add a `savedValuesSnapshot` ref that stores values at load time and after each successful save
- In `saveDraft`, before persisting, compute the diff: for each dirty field, compare `savedValuesSnapshot[key]` vs `values[key]`
- Group diffs by section, resolve field labels from `resolvedFields`, and call `logFieldChanges`
- After successful save, update the snapshot

### 4. Per-Deal Event Journal Tab Content (Replace "Coming Soon")
Replace the placeholder at line 996-1004 in `DealDataEntryPage.tsx` with `EventJournalViewer` component:
- Table with columns: Event #, User, Section, Details, Timestamp
- Details column shows truncated preview (first 80 chars)
- "Show More" button opens a Dialog/modal with full details formatted as `Field Label: Old Value → New Value`
- Sorted by event_number descending (newest first)

### 5. `EventJournalViewer` Component (New File)
`src/components/deal/EventJournalViewer.tsx`:
- Fetches from `event_journal` table filtered by `deal_id`
- Joins actor names from `profiles`
- Table layout using existing shadcn Table components
- "Show More" modal using existing Dialog component
- Detail entries formatted as `Field Label: oldValue → newValue`

### 6. Global Event Journal Page (New File)
`src/pages/csr/GlobalEventJournalPage.tsx`:
- Deal selector dropdown (search by deal number) at the top
- Once a deal is selected, renders `EventJournalViewer` for that deal
- Same table structure as the per-deal view

### 7. Sidebar Navigation Update
In `AppSidebar.tsx`, add "Event Journal" nav item above the Contacts section (around line 429) for CSR users:
```tsx
<PromotedNavSection
  label="Event Journal"
  icon={BookOpen}
  items={[]}
  directPath="/event-journal"
  isCollapsed={isCollapsed}
  searchQuery={searchQuery}
/>
```

### 8. Route Registration
In `App.tsx`, add route for the global event journal page inside the CSR/Admin role guard.

### Files Changed
| File | Change |
|------|--------|
| New migration | Create `event_journal` table with trigger |
| `src/hooks/useEventJournal.ts` | New — logging + fetching hook |
| `src/hooks/useDealFields.ts` | Add saved-values snapshot, diff computation on save, call event journal logger |
| `src/components/deal/EventJournalViewer.tsx` | New — table + modal component |
| `src/pages/csr/DealDataEntryPage.tsx` | Replace "Coming Soon" placeholder with EventJournalViewer |
| `src/pages/csr/GlobalEventJournalPage.tsx` | New — global view with deal selector |
| `src/components/layout/AppSidebar.tsx` | Add Event Journal nav item above Contacts |
| `src/App.tsx` | Add `/event-journal` route |

