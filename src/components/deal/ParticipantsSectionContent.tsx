import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { GridToolbar } from './GridToolbar';
import { SortableTableHead } from './SortableTableHead';
import { ColumnConfigPopover, type ColumnConfig } from './ColumnConfigPopover';
import { GridExportDialog, type ExportColumn } from './GridExportDialog';
import { useGridSortFilter } from '@/hooks/useGridSortFilter';
import { useTableColumnConfig } from '@/hooks/useTableColumnConfig';
import { useGridSelection } from '@/hooks/useGridSelection';
import { AddParticipantModal } from './AddParticipantModal';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { cn } from '@/lib/utils';

interface Participant {
  id: string;
  contact_id_display: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  capacity: string;
  participant_type_capacity: string;
  status: string;
  contact_id: string | null;
  created_at: string;
}

interface ParticipantsSectionContentProps {
  dealId: string;
  disabled?: boolean;
  onRefresh?: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  borrower: 'Borrower',
  lender: 'Lender',
  broker: 'Broker',
  other: 'Other',
  csr: 'CSR',
  admin: 'Admin',
};

const ROLE_COLORS: Record<string, string> = {
  borrower: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  lender: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  broker: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  csr: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const STATUS_LABELS: Record<string, string> = {
  invited: 'Active',
  in_progress: 'Active',
  completed: 'Active',
  expired: 'Inactive',
};

const STATUS_COLORS: Record<string, string> = {
  invited: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  in_progress: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  expired: 'bg-destructive/10 text-destructive',
};

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'contact_id_display', label: 'ID', visible: true },
  { id: 'name', label: 'Name', visible: true },
  { id: 'email', label: 'Email', visible: true },
  { id: 'phone', label: 'Phone', visible: true },
  { id: 'participant_type_capacity', label: 'Participant Type - Capacity', visible: true },
  { id: 'status', label: 'Status', visible: true },
  { id: 'created_at', label: 'Added Date', visible: true },
];

const SEARCHABLE_FIELDS = ['name', 'email', 'phone', 'role', 'contact_id_display', 'capacity', 'participant_type_capacity'];

export const ParticipantsSectionContent: React.FC<ParticipantsSectionContentProps> = ({
  dealId,
  disabled = false,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const [columns, setColumns, resetColumns] = useTableColumnConfig('participants_v3', DEFAULT_COLUMNS);
  const visibleColumns = columns.filter((c) => c.visible);

  const {
    searchQuery,
    setSearchQuery,
    sortState,
    toggleSort,
    activeFilters,
    setFilter,
    clearFilters,
    activeFilterCount,
    filteredData,
  } = useGridSortFilter<Participant>(participants, SEARCHABLE_FIELDS);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Reset to page 1 when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilterCount]);

  const {
    selectedIds,
    isAllSelected,
    toggleOne,
    toggleAll,
    clearSelection,
  } = useGridSelection(paginatedData);

  const fetchParticipants = useCallback(async () => {
    if (!dealId) return;
    setLoading(true);
    try {
      // Get total count
      const { count: rowCount } = await supabase
        .from('deal_participants')
        .select('id', { count: 'exact', head: true })
        .eq('deal_id', dealId);

      setTotalCount(rowCount || 0);

      const { data, error } = await supabase
        .from('deal_participants')
        .select('id, name, email, phone, role, status, contact_id, created_at')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const rows = data || [];

      // For participants with a linked contact, fetch latest name/email/phone from contacts
      const contactIds = rows
        .map((p: any) => p.contact_id)
        .filter((id: string | null): id is string => !!id);

      let contactMap: Record<string, { full_name: string; email: string; phone: string; contact_id: string; capacity: string }> = {};
      if (contactIds.length > 0) {
        const { data: contacts } = await supabase
          .from('contacts')
          .select('id, full_name, email, phone, contact_id, contact_data')
          .in('id', contactIds);

        if (contacts) {
          for (const c of contacts) {
            const cData = (c.contact_data || {}) as Record<string, string>;
            contactMap[c.id] = {
              full_name: c.full_name || '',
              email: c.email || '',
              phone: c.phone || '',
              contact_id: c.contact_id || '',
              capacity: cData['capacity'] || '',
            };
          }
        }

        // Sync stale deal_participants with latest contact data
        const updates: { id: string; name: string; email: string; phone: string }[] = [];
        for (const p of rows) {
          const contact = p.contact_id ? contactMap[p.contact_id] : null;
          if (contact) {
            const needsUpdate =
              (contact.full_name && contact.full_name !== (p.name || '')) ||
              (contact.email && contact.email !== (p.email || '')) ||
              (contact.phone && contact.phone !== (p.phone || ''));
            if (needsUpdate) {
              updates.push({
                id: p.id,
                name: contact.full_name || p.name || '',
                email: contact.email || p.email || '',
                phone: contact.phone || p.phone || '',
              });
            }
          }
        }

        // Batch-update stale participant records in background
        if (updates.length > 0) {
          for (const u of updates) {
            supabase
              .from('deal_participants')
              .update({ name: u.name, email: u.email, phone: u.phone })
              .eq('id', u.id)
              .then(() => {});
          }
        }
      }

      // Fetch deal-specific participant capacities from deal_section_values
      let dealCapacityMap: Record<string, string> = {};
      const { data: participantSection } = await supabase
        .from('deal_section_values')
        .select('field_values')
        .eq('deal_id', dealId)
        .eq('section', 'participants')
        .maybeSingle();

      if (participantSection?.field_values) {
        const pValues = participantSection.field_values as Record<string, any>;
        Object.entries(pValues).forEach(([key, val]) => {
          const match = key.match(/^participant_(.+)_capacity$/);
          if (match && val) {
            dealCapacityMap[match[1]] = String(val);
          }
        });
      }

      setParticipants(
        rows.map((p: any) => {
          const contact = p.contact_id ? contactMap[p.contact_id] : null;
          const roleLabel = ROLE_LABELS[p.role] || p.role || '';
          // Priority: deal-specific capacity > global contact capacity
          const capacityVal = (p.contact_id && dealCapacityMap[p.contact_id]) || contact?.capacity || '';
          const mergedTypeCapacity = capacityVal && capacityVal !== roleLabel
            ? `${roleLabel} - ${capacityVal}`
            : roleLabel;
          return {
            id: p.id,
            contact_id_display: contact?.contact_id || '',
            name: contact?.full_name || p.name || '',
            email: contact?.email || p.email || '',
            phone: contact?.phone || p.phone || '',
            role: p.role || '',
            capacity: capacityVal || roleLabel,
            participant_type_capacity: mergedTypeCapacity,
            status: p.status || 'invited',
            contact_id: p.contact_id,
            created_at: p.created_at,
          };
        })
      );
    } catch (err) {
      console.error('Error fetching participants:', err);
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const handleRowClick = (participant: Participant) => {
    if (!participant.contact_id) {
      navigateToContactByEmail(participant);
      return;
    }
    navigateToContactById(participant.contact_id, participant.role, participant);
  };

  const navigateToContactByEmail = async (participant: Participant) => {
    if (!participant.email) {
      toast.info('No contact record linked to this participant');
      return;
    }
    const { data } = await supabase
      .from('contacts')
      .select('id, contact_type, full_name, email, phone, contact_data')
      .eq('email', participant.email)
      .limit(1)
      .maybeSingle();

    if (data) {
      // Sync participant data back to contact — preserve existing contact detail fields
      const updates: Record<string, any> = {};
      const existingData = (data.contact_data || {}) as Record<string, string>;
      const mergedContactData = { ...existingData };

      if (participant.name) {
        const existingLastName = existingData['last_name'] || '';
        const existingFirstName = data.full_name || '';

        if (!existingFirstName && !existingLastName) {
          updates.full_name = participant.name;
          const parts = participant.name.split(' ');
          const firstName = parts[0] || '';
          const lastName = parts.slice(1).join(' ') || '';
          updates.first_name = firstName;
          updates.last_name = lastName;
          mergedContactData['full_name'] = participant.name;
          mergedContactData['first_name'] = firstName;
          mergedContactData['last_name'] = lastName;
        }
      }
      if (participant.email && !data.email) {
        updates.email = participant.email;
        mergedContactData['email'] = participant.email;
      }
      if (participant.phone && !(data.phone)) {
        updates.phone = participant.phone;
        mergedContactData['phone.home'] = participant.phone;
      }
      // Capacity is set during participant creation — do not overwrite here

      updates.contact_data = mergedContactData;

      if (Object.keys(updates).length > 0) {
        await supabase.from('contacts').update(updates).eq('id', data.id);
      }

      // Link contact_id back to participant if missing
      if (!participant.contact_id) {
        await supabase
          .from('deal_participants')
          .update({ contact_id: data.id })
          .eq('id', participant.id);
      }

      const route = data.contact_type === 'lender' ? 'lenders' : data.contact_type === 'broker' ? 'brokers' : 'borrowers';
      navigate(`/contacts/${route}/${data.id}`);
    } else {
      toast.info('No contact record found for this participant');
    }
  };

  const navigateToContactById = async (contactId: string, role: string, participant?: Participant) => {
    const { data } = await supabase
      .from('contacts')
      .select('id, contact_type, full_name, email, phone, contact_data')
      .eq('id', contactId)
      .maybeSingle();

    if (data) {
      // Sync participant data back to contact — preserve existing contact detail fields
      if (participant) {
        const updates: Record<string, any> = {};
        const existingData = (data.contact_data || {}) as Record<string, string>;
        const mergedContactData = { ...existingData };

        if (participant.name) {
          // Only update name fields if the contact doesn't already have richer data
          const existingLastName = data.contact_data ? (data.contact_data as Record<string, string>)['last_name'] || '' : '';
          const existingFirstName = data.full_name || '';

          if (!existingFirstName && !existingLastName) {
            // Contact has no name data — populate from participant
            updates.full_name = participant.name;
            const parts = participant.name.split(' ');
            const firstName = parts[0] || '';
            const lastName = parts.slice(1).join(' ') || '';
            updates.first_name = firstName;
            updates.last_name = lastName;
            mergedContactData['full_name'] = participant.name;
            mergedContactData['first_name'] = firstName;
            mergedContactData['last_name'] = lastName;
          }
          // If contact already has name data, don't overwrite — contact is source of truth
        }
        if (participant.email && !data.email) {
          updates.email = participant.email;
          mergedContactData['email'] = participant.email;
        }
        if (participant.phone && !(data.phone)) {
          updates.phone = participant.phone;
          mergedContactData['phone.home'] = participant.phone;
        }
        // Capacity is set during participant creation — do not overwrite here

        updates.contact_data = mergedContactData;

        if (Object.keys(updates).length > 0) {
          await supabase
            .from('contacts')
            .update(updates)
            .eq('id', contactId);
        }
      }

      const route = data.contact_type === 'lender' ? 'lenders' : data.contact_type === 'broker' ? 'brokers' : 'borrowers';
      navigate(`/contacts/${route}/${data.id}`);
    } else {
      toast.info('Contact record not found');
    }
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      const { error } = await supabase
        .from('deal_participants')
        .delete()
        .in('id', ids);

      if (error) throw error;

      toast.success(`Deleted ${ids.length} participant(s)`);
      clearSelection();
      fetchParticipants();
    } catch (err) {
      console.error('Error deleting participants:', err);
      toast.error('Failed to delete participants');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleParticipantAdded = () => {
    fetchParticipants();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Filter options from unique roles
  const roleFilterOptions = useMemo(() => {
    const roles = [...new Set(participants.map((p) => p.role))];
    return roles.map((r) => ({ value: r, label: ROLE_LABELS[r] || r }));
  }, [participants]);

  const statusFilterOptions = useMemo(() => {
    const statuses = [...new Set(participants.map((p) => p.status))];
    return statuses.map((s) => ({ value: s, label: STATUS_LABELS[s] || 'Active' }));
  }, [participants]);

  const exportColumns: ExportColumn[] = columns.map((c) => ({ id: c.id, label: c.label }));

  const renderCellValue = (participant: Participant, columnId: string) => {
    switch (columnId) {
      case 'contact_id_display':
        return <span className="font-medium text-foreground">{participant.contact_id_display || '—'}</span>;
      case 'name':
        return <span className="font-medium text-foreground">{participant.name || '—'}</span>;
      case 'email':
        return <span className="text-muted-foreground">{participant.email || '—'}</span>;
      case 'phone':
        return <span className="text-muted-foreground">{participant.phone || '—'}</span>;
      case 'participant_type_capacity':
        return (
          <Badge variant="secondary" className={cn('text-xs', ROLE_COLORS[participant.role] || '')}>
            {participant.participant_type_capacity || '—'}
          </Badge>
        );
      case 'role':
        return (
          <Badge variant="secondary" className={cn('text-xs', ROLE_COLORS[participant.role] || '')}>
            {ROLE_LABELS[participant.role] || participant.role}
          </Badge>
        );
      case 'capacity':
        return <span className="text-muted-foreground">{participant.capacity || '—'}</span>;
      case 'status':
        return (
          <Badge variant="secondary" className={cn('text-xs', STATUS_COLORS[participant.status] || '')}>
            {STATUS_LABELS[participant.status] || 'Active'}
          </Badge>
        );
      case 'created_at':
        return <span className="text-muted-foreground">{formatDate(participant.created_at)}</span>;
      default:
        return '—';
    }
  };

  return (
    <div className="flex flex-col border border-border rounded-lg bg-background overflow-hidden">
    <div className="p-6 space-y-4">
      {/* Header with title and actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg text-foreground">Participants</h3>
        </div>
        <div className="flex items-center gap-2">
          <ColumnConfigPopover
            columns={columns}
            onColumnsChange={setColumns}
            onResetColumns={resetColumns}
            disabled={disabled}
          />
          {!disabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddModalOpen(true)}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Participant
            </Button>
          )}
        </div>
      </div>

      {/* Grid Toolbar */}
      <GridToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterOptions={[
          { id: 'role', label: 'Type', options: roleFilterOptions },
          { id: 'status', label: 'Status', options: statusFilterOptions },
        ]}
        activeFilters={activeFilters}
        onFilterChange={setFilter}
        onClearFilters={clearFilters}
        activeFilterCount={activeFilterCount}
        disabled={disabled}
        selectedCount={disabled ? 0 : selectedIds.size}
        onBulkDelete={disabled ? undefined : () => setDeleteDialogOpen(true)}
        onExport={() => setExportOpen(true)}
        searchPlaceholder="Search participants..."
      />

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            {participants.length === 0 ? 'No participants added yet' : 'No participants match your search'}
          </p>
          {participants.length === 0 && !disabled && (
            <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={() => setAddModalOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Add First Participant
            </Button>
          )}
          {disabled && (
            <p className="text-xs text-muted-foreground mt-2">View-only mode</p>
          )}
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-x-auto">
        <Table className="min-w-[1400px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              {!disabled && (
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              )}
              {visibleColumns.map((col) => (
                <SortableTableHead
                  key={col.id}
                  columnId={col.id}
                  label={col.label.toUpperCase()}
                  sortColumnId={sortState.columnId}
                  sortDirection={sortState.direction}
                  onSort={toggleSort}
                />
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((participant) => (
              <TableRow
                key={participant.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(participant)}
              >
                {!disabled && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(participant.id)}
                    onCheckedChange={() => toggleOne(participant.id)}
                  />
                </TableCell>
                )}
                {visibleColumns.map((col) => (
                  <TableCell key={col.id}>
                    {renderCellValue(participant, col.id)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalCount)} of {totalCount} participants
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage <= 1 || disabled}>First</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage <= 1 || disabled}>Previous</Button>
            <span className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm">{currentPage}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage >= totalPages || disabled}>Next</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages || disabled}>Last</Button>
          </div>
        </div>
      )}

      {/* Footer */}
      {participants.length > 0 && (
        <div className="flex justify-end">
          <div className="text-sm text-muted-foreground">
            {filteredData.length !== participants.length && `Showing ${filteredData.length} of `}
            Total Participants: {participants.length}
          </div>
        </div>
      )}

      {/* Add Participant Modal */}
      <AddParticipantModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        dealId={dealId}
        onParticipantAdded={handleParticipantAdded}
      />

      {/* Export Dialog */}
      <GridExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        columns={exportColumns}
        data={filteredData}
        fileName="participants"
      />

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleBulkDelete}
        title="Delete Participants"
        description={`Are you sure you want to delete ${selectedIds.size} selected participant(s)? This action cannot be undone.`}
      />
    </div>
  );
};

export default ParticipantsSectionContent;
