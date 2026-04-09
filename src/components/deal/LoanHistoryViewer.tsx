import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { History } from 'lucide-react';
import { GridToolbar, FilterOption } from './GridToolbar';
import { GridExportDialog, ExportColumn } from './GridExportDialog';
import { SortableTableHead } from './SortableTableHead';
import { useGridSortFilter } from '@/hooks/useGridSortFilter';
import { format } from 'date-fns';

interface LoanHistoryViewerProps {
  dealId: string;
  disabled?: boolean;
}

interface UnifiedHistoryEntry {
  id: string;
  source: 'event' | 'activity';
  timestamp: string;
  actor_name: string;
  action_type: string;
  section: string;
  summary: string;
  details_raw: any;
  ip_address: string | null;
}

const ACTION_TYPE_LABELS: Record<string, string> = {
  DealCreated: 'Deal Created',
  DealUpdated: 'Deal Updated',
  DealMarkedReady: 'Marked Ready',
  DealRevertedToDraft: 'Reverted to Draft',
  DocumentGenerated: 'Document Generated',
  DocumentRegenerated: 'Document Regenerated',
  ParticipantInvited: 'Participant Invited',
  ParticipantRemoved: 'Participant Removed',
  field_change: 'Field Change',
};

const ACTION_TYPE_COLORS: Record<string, string> = {
  DealCreated: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  DealUpdated: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  DealMarkedReady: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  DealRevertedToDraft: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  DocumentGenerated: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  DocumentRegenerated: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  ParticipantInvited: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  ParticipantRemoved: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  field_change: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
};

function summarizeActivityDetails(actionType: string, details: any): string {
  if (!details) return actionType;
  switch (actionType) {
    case 'DealUpdated':
      return `Updated ${details.fieldsUpdated || 0} fields`;
    case 'DocumentGenerated':
    case 'DocumentRegenerated':
      return details.templateName ? `${details.templateName} (v${details.versionNumber || 1})` : 'Document';
    case 'DealMarkedReady':
      return 'Deal status changed to Ready';
    case 'DealRevertedToDraft':
      return 'Deal status reverted to Draft';
    case 'DealCreated':
      return 'New deal created';
    case 'ParticipantInvited':
      return `Invited ${details.participantName || details.email || 'participant'}`;
    case 'ParticipantRemoved':
      return `Removed ${details.participantName || 'participant'}`;
    default:
      return actionType;
  }
}

function summarizeEventDetails(details: any[]): string {
  if (!details || !details.length) return 'No changes';
  const labels = details.slice(0, 3).map((d: any) => d.fieldLabel || 'field');
  const text = labels.join(', ');
  if (details.length > 3) return `${text} +${details.length - 3} more`;
  return text;
}

function renderDetailsFull(entry: UnifiedHistoryEntry): React.ReactNode {
  if (entry.source === 'event') {
    const changes = entry.details_raw || [];
    if (!changes.length) return <p className="text-sm text-muted-foreground">No field changes recorded.</p>;
    return (
      <div className="space-y-2">
        {changes.map((d: any, i: number) => (
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

  // Activity log details
  const details = entry.details_raw;
  if (!details) return <p className="text-sm text-muted-foreground">No additional details.</p>;
  return (
    <div className="space-y-1 text-sm">
      {Object.entries(details).map(([key, val]) => (
        <div key={key}>
          <span className="font-medium text-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>{' '}
          <span className="text-muted-foreground">{String(val)}</span>
        </div>
      ))}
    </div>
  );
}

const SEARCH_FIELDS = ['actor_name', 'action_type', 'section', 'summary'];

const FILTER_OPTIONS: FilterOption[] = [
  {
    id: 'action_type',
    label: 'Action Type',
    options: [
      { value: 'field_change', label: 'Field Changes' },
      { value: 'DealUpdated', label: 'Deal Updated' },
      { value: 'DealCreated', label: 'Deal Created' },
      { value: 'DealMarkedReady', label: 'Marked Ready' },
      { value: 'DocumentGenerated', label: 'Doc Generated' },
      { value: 'DocumentRegenerated', label: 'Doc Regenerated' },
    ],
  },
  {
    id: 'source',
    label: 'Source',
    options: [
      { value: 'event', label: 'Field Changes' },
      { value: 'activity', label: 'Activity Log' },
    ],
  },
];

const EXPORT_COLUMNS: ExportColumn[] = [
  { id: 'timestamp', label: 'Timestamp' },
  { id: 'actor_name', label: 'User' },
  { id: 'action_type', label: 'Action Type' },
  { id: 'section', label: 'Section' },
  { id: 'summary', label: 'Summary' },
  { id: 'ip_address', label: 'IP Address' },
];

const PAGE_SIZE = 10;

export const LoanHistoryViewer: React.FC<LoanHistoryViewerProps> = ({ dealId, disabled = false }) => {
  const [selectedEntry, setSelectedEntry] = useState<UnifiedHistoryEntry | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch event journal entries
  const { data: eventEntries, isLoading: eventsLoading } = useQuery({
    queryKey: ['loan-history-events', dealId],
    enabled: !!dealId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_journal')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch activity log entries
  const { data: activityEntries, isLoading: activityLoading } = useQuery({
    queryKey: ['loan-history-activity', dealId],
    enabled: !!dealId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch actor profiles for all unique user ids
  const allActorIds = useMemo(() => {
    const ids = new Set<string>();
    (eventEntries || []).forEach((e: any) => ids.add(e.actor_user_id));
    (activityEntries || []).forEach((a: any) => ids.add(a.actor_user_id));
    return [...ids];
  }, [eventEntries, activityEntries]);

  const { data: profiles } = useQuery({
    queryKey: ['loan-history-profiles', allActorIds.sort().join(',')],
    enabled: allActorIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', allActorIds);
      const map: Record<string, string> = {};
      (data || []).forEach((p: any) => {
        map[p.user_id] = p.full_name || p.email || 'Unknown';
      });
      return map;
    },
  });

  const profileMap = profiles || {};

  // Merge and sort
  const unifiedEntries: UnifiedHistoryEntry[] = useMemo(() => {
    const merged: UnifiedHistoryEntry[] = [];

    (eventEntries || []).forEach((e: any) => {
      merged.push({
        id: `event-${e.id}`,
        source: 'event',
        timestamp: e.created_at,
        actor_name: profileMap[e.actor_user_id] || 'Unknown',
        action_type: 'field_change',
        section: (e.section || '').replace(/_/g, ' '),
        summary: summarizeEventDetails(e.details),
        details_raw: e.details,
        ip_address: e.ip_address || null,
      });
    });

    (activityEntries || []).forEach((a: any) => {
      merged.push({
        id: `activity-${a.id}`,
        source: 'activity',
        timestamp: a.created_at,
        actor_name: profileMap[a.actor_user_id] || 'Unknown',
        action_type: a.action_type,
        section: '—',
        summary: summarizeActivityDetails(a.action_type, a.action_details),
        details_raw: a.action_details,
        ip_address: null,
      });
    });

    merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return merged;
  }, [eventEntries, activityEntries, profileMap]);

  const isLoading = eventsLoading || activityLoading;

  const {
    searchQuery, setSearchQuery, sortState, toggleSort,
    activeFilters, setFilter, clearFilters, activeFilterCount, filteredData,
  } = useGridSortFilter(unifiedEntries, SEARCH_FIELDS);

  // Paginate filtered data locally
  const totalCount = filteredData.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const paginatedData = filteredData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset page on filter/search change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilters]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-muted-foreground">Loading loan history…</p>
      </div>
    );
  }

  if (unifiedEntries.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Loan History</h3>
          <p className="text-muted-foreground">No history available for this loan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GridToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
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
            <SortableTableHead columnId="timestamp" label="Timestamp" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="w-[160px]" />
            <SortableTableHead columnId="actor_name" label="User" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="w-[140px]" />
            <SortableTableHead columnId="action_type" label="Action" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="w-[150px]" />
            <SortableTableHead columnId="section" label="Section" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="w-[120px]" />
            <TableHead>Summary</TableHead>
            <SortableTableHead columnId="ip_address" label="IP Address" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="w-[120px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No records match your search or filters.
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((entry) => (
              <TableRow key={entry.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedEntry(entry)}>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(entry.timestamp), 'MMM d, yyyy h:mm a')}
                </TableCell>
                <TableCell className="text-sm">{entry.actor_name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={`text-xs font-medium ${ACTION_TYPE_COLORS[entry.action_type] || ''}`}>
                    {ACTION_TYPE_LABELS[entry.action_type] || entry.action_type}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm capitalize">{entry.section}</TableCell>
                <TableCell className="text-sm text-muted-foreground truncate max-w-[300px]">
                  {entry.summary}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground font-mono">
                  {entry.ip_address || '—'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {totalCount > 0 && (
            <>Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount} records</>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage <= 1}>First</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage <= 1}>Previous</Button>
            <span className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm">{currentPage}</span>
            <span className="text-sm text-muted-foreground">of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage >= totalPages}>Next</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages}>Last</Button>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge variant="secondary" className={`text-xs ${ACTION_TYPE_COLORS[selectedEntry?.action_type || ''] || ''}`}>
                {ACTION_TYPE_LABELS[selectedEntry?.action_type || ''] || selectedEntry?.action_type}
              </Badge>
              {selectedEntry?.section !== '—' && (
                <span className="capitalize text-muted-foreground text-sm">— {selectedEntry?.section}</span>
              )}
            </DialogTitle>
            <DialogDescription>
              By {selectedEntry?.actor_name} on{' '}
              {selectedEntry ? format(new Date(selectedEntry.timestamp), 'MMM d, yyyy h:mm a') : ''}
              {selectedEntry?.ip_address && (
                <span className="block mt-1">IP: {selectedEntry.ip_address}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && renderDetailsFull(selectedEntry)}
        </DialogContent>
      </Dialog>

      <GridExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        columns={EXPORT_COLUMNS}
        data={unifiedEntries}
        fileName="loan_history"
      />
    </div>
  );
};
