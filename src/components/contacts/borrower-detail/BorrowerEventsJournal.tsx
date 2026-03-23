import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth } from 'date-fns';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { BookOpen, X, ExternalLink, Columns, ChevronDown } from 'lucide-react';
import { GridToolbar, FilterOption } from '@/components/deal/GridToolbar';
import { GridExportDialog, ExportColumn } from '@/components/deal/GridExportDialog';
import { SortableTableHead } from '@/components/deal/SortableTableHead';
import { useGridSortFilter } from '@/hooks/useGridSortFilter';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

interface AggregatedEvent {
  id: string;
  event_number: number;
  deal_id: string;
  deal_number: string;
  section: string;
  actor_name: string;
  actor_user_id: string;
  details: any[];
  created_at: string;
  ip_address: string | null;
  event_summary: string;
}

const SEARCH_FIELDS = ['actor_name', 'section', 'event_number', 'deal_number', 'event_summary', 'ip_address'];

const FILTER_OPTIONS: FilterOption[] = [
  {
    id: 'section', label: 'Section', options: [
      { value: 'borrower', label: 'Borrower' },
      { value: 'co_borrower', label: 'Co-Borrower' },
      { value: 'loan_terms', label: 'Loan Terms' },
      { value: 'property', label: 'Property' },
      { value: 'lender', label: 'Lender' },
      { value: 'broker', label: 'Broker' },
      { value: 'charges', label: 'Charges' },
      { value: 'notes', label: 'Notes' },
      { value: 'participants', label: 'Participants' },
      { value: 'insurance', label: 'Insurance' },
      { value: 'liens', label: 'Liens' },
    ],
  },
];

const EXPORT_COLUMNS: ExportColumn[] = [
  { id: 'event_number', label: 'Event #' },
  { id: 'created_at', label: 'Date / Time' },
  { id: 'deal_number', label: 'Loan Reference' },
  { id: 'section', label: 'Section' },
  { id: 'actor_name', label: 'Performed By' },
  { id: 'event_summary', label: 'Event Summary' },
  { id: 'ip_address', label: 'IP Address' },
];

const ALL_COLUMNS = [
  { id: 'event_number', label: 'Event #', default: true },
  { id: 'created_at', label: 'Date / Time', default: true },
  { id: 'deal_number', label: 'Loan Reference', default: true },
  { id: 'section', label: 'Section', default: true },
  { id: 'actor_name', label: 'Performed By', default: true },
  { id: 'event_summary', label: 'Event Summary', default: true },
  { id: 'ip_address', label: 'IP Address', default: true },
];

function buildEventSummary(details: any[]): string {
  if (!Array.isArray(details) || details.length === 0) return 'No details';
  const text = details
    .map((d: any) => `${d.fieldLabel || d.field || ''}: ${d.oldValue || '(empty)'} → ${d.newValue || '(empty)'}`)
    .join('; ');
  return text.length > 100 ? text.substring(0, 100) + '…' : text;
}

const BorrowerEventsJournal: React.FC<{ borrowerId: string; contactDbId: string }> = ({ contactDbId }) => {
  const [selectedEvent, setSelectedEvent] = useState<AggregatedEvent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(
    new Set(ALL_COLUMNS.filter(c => c.default).map(c => c.id))
  );
  const { openFile } = useWorkspace();

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['borrower-events-journal', contactDbId],
    enabled: !!contactDbId,
    queryFn: async () => {
      // Step 1: Get all deals where this contact is a borrower participant
      const { data: participants, error: pErr } = await supabase
        .from('deal_participants')
        .select('deal_id')
        .eq('contact_id', contactDbId)
        .eq('role', 'borrower');

      if (pErr) throw pErr;
      if (!participants || participants.length === 0) return [];

      const dealIds = [...new Set(participants.map(p => p.deal_id))];

      // Step 2: Fetch events and deals in parallel
      const [eventsResult, dealsResult] = await Promise.all([
        supabase
          .from('event_journal')
          .select('*')
          .in('deal_id', dealIds)
          .order('created_at', { ascending: false }),
        supabase
          .from('deals')
          .select('id, deal_number')
          .in('id', dealIds),
      ]);

      if (eventsResult.error) throw eventsResult.error;
      if (!eventsResult.data || eventsResult.data.length === 0) return [];

      const dealMap: Record<string, string> = {};
      (dealsResult.data || []).forEach((d: any) => { dealMap[d.id] = d.deal_number; });

      // Step 3: Fetch actor names
      const actorIds = [...new Set(eventsResult.data.map((e: any) => e.actor_user_id))];
      let profileMap: Record<string, string> = {};
      if (actorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', actorIds);
        (profiles || []).forEach((p: any) => {
          profileMap[p.user_id] = p.full_name || p.email || 'Unknown';
        });
      }

      return eventsResult.data.map((e: any): AggregatedEvent => {
        const details = Array.isArray(e.details) ? e.details : [];
        return {
          id: e.id,
          event_number: e.event_number,
          deal_id: e.deal_id,
          deal_number: dealMap[e.deal_id] || 'Unknown',
          section: e.section,
          actor_name: profileMap[e.actor_user_id] || 'Unknown',
          actor_user_id: e.actor_user_id,
          details,
          created_at: e.created_at,
          ip_address: e.ip_address || null,
          event_summary: buildEventSummary(details),
        };
      });
    },
  });

  const { searchQuery, setSearchQuery, sortState, toggleSort, activeFilters, setFilter, clearFilters, activeFilterCount, filteredData } =
    useGridSortFilter(events, SEARCH_FIELDS);

  // Summary metrics
  const metrics = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const thisMonth = events.filter(e => new Date(e.created_at) >= monthStart).length;
    const docEvents = events.filter(e => e.section === 'documents' || e.section === 'notes').length;
    const servicingEvents = events.filter(e =>
      ['charges', 'loan_terms', 'insurance', 'liens'].includes(e.section)
    ).length;
    return { total: events.length, thisMonth, docEvents, servicingEvents };
  }, [events]);

  const toggleCol = (colId: string) => {
    setVisibleCols(prev => {
      const next = new Set(prev);
      if (next.has(colId)) next.delete(colId); else next.add(colId);
      return next;
    });
  };

  const handleRowClick = (event: AggregatedEvent) => {
    setSelectedEvent(event);
    setDrawerOpen(true);
  };

  const handleOpenDeal = async (dealId: string) => {
    const { data: deal } = await supabase.from('deals').select('deal_number, borrower_name').eq('id', dealId).single();
    if (deal) {
      openFile({
        id: dealId,
        title: `${deal.deal_number} – ${deal.borrower_name || 'Deal'}`,
        type: 'deal',
      });
    }
    setDrawerOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-muted-foreground">Loading event journal…</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Events Journal</h3>
          <p className="text-muted-foreground">No events recorded for this borrower.</p>
        </div>
      </div>
    );
  }

  const colSpan = ALL_COLUMNS.filter(c => visibleCols.has(c.id)).length;

  return (
    <div className="space-y-4">
      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Events', value: metrics.total },
          { label: 'Events This Month', value: metrics.thisMonth },
          { label: 'Document Events', value: metrics.docEvents },
          { label: 'Servicing Events', value: metrics.servicingEvents },
        ].map(m => (
          <div key={m.label} className="bg-card border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className="text-xl font-bold text-foreground">{m.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-foreground">Events Journal</h4>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Columns className="h-3.5 w-3.5" />
              Columns
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 p-2">
            {ALL_COLUMNS.map(col => (
              <label key={col.id} className="flex items-center gap-2 py-1 px-1 text-sm cursor-pointer hover:bg-muted/50 rounded">
                <Checkbox checked={visibleCols.has(col.id)} onCheckedChange={() => toggleCol(col.id)} />
                {col.label}
              </label>
            ))}
          </PopoverContent>
        </Popover>
      </div>

      <GridToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterOptions={FILTER_OPTIONS}
        activeFilters={activeFilters}
        onFilterChange={setFilter}
        onClearFilters={clearFilters}
        activeFilterCount={activeFilterCount}
        onExport={() => setExportOpen(true)}
        onRefresh={() => refetch()}
      />

      <div className="border border-border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {visibleCols.has('event_number') && (
                <SortableTableHead columnId="event_number" label="Event #" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="w-[80px] text-xs" />
              )}
              {visibleCols.has('created_at') && (
                <SortableTableHead columnId="created_at" label="Date / Time" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="w-[160px] text-xs" />
              )}
              {visibleCols.has('deal_number') && (
                <SortableTableHead columnId="deal_number" label="Loan Reference" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="w-[130px] text-xs" />
              )}
              {visibleCols.has('section') && (
                <SortableTableHead columnId="section" label="Section" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="w-[120px] text-xs" />
              )}
              {visibleCols.has('actor_name') && (
                <SortableTableHead columnId="actor_name" label="Performed By" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="w-[150px] text-xs" />
              )}
              {visibleCols.has('event_summary') && (
                <TableHead className="text-xs">Event Summary</TableHead>
              )}
              {visibleCols.has('ip_address') && (
                <SortableTableHead columnId="ip_address" label="IP Address" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="w-[130px] text-xs" />
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="text-center py-8 text-muted-foreground">
                  No events match your search or filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((entry) => (
                <TableRow key={entry.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleRowClick(entry)}>
                  {visibleCols.has('event_number') && (
                    <TableCell className="font-mono text-xs">{entry.event_number}</TableCell>
                  )}
                  {visibleCols.has('created_at') && (
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                  )}
                  {visibleCols.has('deal_number') && (
                    <TableCell className="text-xs font-medium text-primary">{entry.deal_number}</TableCell>
                  )}
                  {visibleCols.has('section') && (
                    <TableCell className="text-xs capitalize">{entry.section.replace(/_/g, ' ')}</TableCell>
                  )}
                  {visibleCols.has('actor_name') && (
                    <TableCell className="text-xs">{entry.actor_name}</TableCell>
                  )}
                  {visibleCols.has('event_summary') && (
                    <TableCell className="text-xs text-muted-foreground truncate max-w-[300px]">
                      {entry.event_summary}
                    </TableCell>
                  )}
                  {visibleCols.has('ip_address') && (
                    <TableCell className="text-xs text-muted-foreground font-mono">{entry.ip_address || '—'}</TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {events.length > 0 && (
        <div className="flex justify-end">
          <div className="text-sm text-muted-foreground">
            {filteredData.length !== events.length && `Showing ${filteredData.length} of `}
            Total Events: {events.length}
          </div>
        </div>
      )}

      {/* Event Details Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-[400px] sm:w-[480px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Event #{selectedEvent?.event_number}</SheetTitle>
            <SheetDescription>
              {selectedEvent ? format(new Date(selectedEvent.created_at), 'MMM d, yyyy h:mm a') : ''}
            </SheetDescription>
          </SheetHeader>
          {selectedEvent && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Loan Reference</p>
                  <p className="font-medium text-foreground">{selectedEvent.deal_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Section</p>
                  <p className="font-medium text-foreground capitalize">{selectedEvent.section.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Performed By</p>
                  <p className="font-medium text-foreground">{selectedEvent.actor_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">IP Address</p>
                  <p className="font-medium text-foreground font-mono">{selectedEvent.ip_address || '—'}</p>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground text-xs mb-2">Event Details</p>
                <div className="space-y-2 bg-muted/30 rounded-lg p-3">
                  {selectedEvent.details.length > 0 ? selectedEvent.details.map((d: any, i: number) => (
                    <div key={i} className="text-sm">
                      <span className="font-medium text-foreground">{d.fieldLabel || d.field || 'Field'}:</span>{' '}
                      <span className="text-muted-foreground">{d.oldValue || '(empty)'}</span>
                      <span className="mx-1 text-primary">→</span>
                      <span className="text-foreground">{d.newValue || '(empty)'}</span>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground">No field changes recorded.</p>
                  )}
                </div>
              </div>

              <Button variant="outline" className="w-full gap-2" onClick={() => handleOpenDeal(selectedEvent.deal_id)}>
                <ExternalLink className="h-4 w-4" />
                Open Deal Workspace
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <GridExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        columns={EXPORT_COLUMNS}
        data={events}
        fileName="borrower_event_journal"
      />
    </div>
  );
};

export default BorrowerEventsJournal;
