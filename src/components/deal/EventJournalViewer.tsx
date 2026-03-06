import React, { useState } from 'react';
import { useEventJournalEntries, type EventJournalEntry, type FieldChange } from '@/hooks/useEventJournal';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { BookOpen } from 'lucide-react';
import { GridToolbar, FilterOption } from './GridToolbar';
import { GridExportDialog, ExportColumn } from './GridExportDialog';
import { SortableTableHead } from './SortableTableHead';
import { useGridSortFilter } from '@/hooks/useGridSortFilter';
import { useGridSelection } from '@/hooks/useGridSelection';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { toast } from 'sonner';

interface EventJournalViewerProps {
  dealId: string;
  disabled?: boolean;
}

function formatDetailsPreview(details: FieldChange[]): string {
  const text = details
    .map(d => `${d.fieldLabel}: ${d.oldValue || '(empty)'} → ${d.newValue || '(empty)'}`)
    .join('; ');
  return text.length > 80 ? text.substring(0, 80) + '…' : text;
}

function formatDetailsFull(details: FieldChange[]): React.ReactNode {
  return (
    <div className="space-y-2">
      {details.map((d, i) => (
        <div key={i} className="text-sm">
          <span className="font-medium text-foreground">{d.fieldLabel}:</span>{' '}
          <span className="text-muted-foreground">{d.oldValue || '(empty)'}</span>
          <span className="mx-1 text-primary">→</span>
          <span className="text-foreground">{d.newValue || '(empty)'}</span>
        </div>
      ))}
    </div>
  );
}

const SEARCH_FIELDS = ['actor_name', 'section', 'event_number'];

const FILTER_OPTIONS: FilterOption[] = [
  {
    id: 'section',
    label: 'Section',
    options: [
      { value: 'borrower', label: 'Borrower' },
      { value: 'co_borrower', label: 'Co-Borrower' },
      { value: 'loan_terms', label: 'Loan Terms' },
      { value: 'property', label: 'Property' },
      { value: 'lender', label: 'Lender' },
      { value: 'broker', label: 'Broker' },
      { value: 'charges', label: 'Charges' },
      { value: 'notes', label: 'Notes' },
    ],
  },
];

const EXPORT_COLUMNS: ExportColumn[] = [
  { id: 'event_number', label: 'Event #' },
  { id: 'actor_name', label: 'User' },
  { id: 'section', label: 'Section' },
  { id: 'created_at', label: 'Timestamp' },
];

export const EventJournalViewer: React.FC<EventJournalViewerProps> = ({ dealId, disabled = false }) => {
  const { data: entries, isLoading } = useEventJournalEntries(dealId);
  const [selectedEntry, setSelectedEntry] = useState<EventJournalEntry | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    searchQuery, setSearchQuery, sortState, toggleSort,
    activeFilters, setFilter, clearFilters, activeFilterCount, filteredData,
  } = useGridSortFilter(entries || [], SEARCH_FIELDS);

  const {
    selectedIds, selectedItems, toggleOne, toggleAll, clearSelection,
    isAllSelected, isSomeSelected, selectedCount,
  } = useGridSelection(filteredData);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['event-journal', dealId] });
  };

  const handleBulkDelete = async () => {
    const ids = selectedItems.map((e) => e.id);
    const { error } = await supabase.from('event_journal').delete().in('id', ids);
    if (error) {
      toast.error('Failed to delete events');
    } else {
      toast.success(`Deleted ${ids.length} event(s)`);
      queryClient.invalidateQueries({ queryKey: ['event-journal', dealId] });
    }
    clearSelection();
    setBulkDeleteOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-muted-foreground">Loading event journal…</p>
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Event Journal</h3>
          <p className="text-muted-foreground">No changes recorded yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Grid Toolbar */}
      <GridToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={handleRefresh}
        filterOptions={FILTER_OPTIONS}
        activeFilters={activeFilters}
        onFilterChange={setFilter}
        onClearFilters={clearFilters}
        activeFilterCount={activeFilterCount}
        disabled={disabled}
        onExport={() => setExportOpen(true)}
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <Checkbox
                checked={isAllSelected}
                ref={(el) => { if (el) (el as any).indeterminate = isSomeSelected; }}
                onCheckedChange={toggleAll}
                disabled={filteredData.length === 0}
              />
            </TableHead>
            <SortableTableHead columnId="event_number" label="Event #" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="w-[80px]" />
            <SortableTableHead columnId="actor_name" label="User" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="w-[150px]" />
            <SortableTableHead columnId="section" label="Section" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="w-[120px]" />
            <TableHead>Details</TableHead>
            <SortableTableHead columnId="created_at" label="Timestamp" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="w-[160px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No events match your search or filters.
              </TableCell>
            </TableRow>
          ) : (
            filteredData.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={selectedIds.has(entry.id)} onCheckedChange={() => toggleOne(entry.id)} />
                </TableCell>
                <TableCell className="font-mono">{entry.event_number}</TableCell>
                <TableCell>{entry.actor_name}</TableCell>
                <TableCell className="capitalize">{entry.section.replace(/_/g, ' ')}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground truncate max-w-[300px]">
                      {formatDetailsPreview(entry.details)}
                    </span>
                    {entry.details.length > 0 && (
                      <Button variant="link" size="sm" className="shrink-0 px-1 h-auto" onClick={() => setSelectedEntry(entry)}>
                        Show More
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Footer */}
      {entries.length > 0 && (
        <div className="flex justify-end">
          <div className="text-sm text-muted-foreground">
            {filteredData.length !== entries.length && `Showing ${filteredData.length} of `}
            Total Events: {entries.length}
          </div>
        </div>
      )}

      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Event #{selectedEntry?.event_number} — {selectedEntry?.section.replace(/_/g, ' ')}
            </DialogTitle>
            <DialogDescription>
              By {selectedEntry?.actor_name} on{' '}
              {selectedEntry ? format(new Date(selectedEntry.created_at), 'MMM d, yyyy h:mm a') : ''}
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && formatDetailsFull(selectedEntry.details)}
        </DialogContent>
      </Dialog>

      <GridExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        columns={EXPORT_COLUMNS}
        data={entries || []}
        fileName="event_journal"
      />
    </div>
  );
};
