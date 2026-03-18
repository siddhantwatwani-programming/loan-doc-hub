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
  name: string;
  email: string;
  phone: string;
  role: string;
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
  { id: 'name', label: 'Name', visible: true },
  { id: 'email', label: 'Email', visible: true },
  { id: 'phone', label: 'Phone', visible: true },
  { id: 'role', label: 'Participant Type', visible: true },
  { id: 'status', label: 'Status', visible: true },
  { id: 'created_at', label: 'Added Date', visible: true },
];

const SEARCHABLE_FIELDS = ['name', 'email', 'phone', 'role'];

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

  const [columns, setColumns, resetColumns] = useTableColumnConfig('participants_v1', DEFAULT_COLUMNS);
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

  const {
    selectedIds,
    isAllSelected,
    toggleOne,
    toggleAll,
    clearSelection,
  } = useGridSelection(filteredData);

  const fetchParticipants = useCallback(async () => {
    if (!dealId) return;
    setLoading(true);
    try {
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

      let contactMap: Record<string, { full_name: string; email: string; phone: string }> = {};
      if (contactIds.length > 0) {
        const { data: contacts } = await supabase
          .from('contacts')
          .select('id, full_name, email, phone')
          .in('id', contactIds);

        if (contacts) {
          for (const c of contacts) {
            contactMap[c.id] = {
              full_name: c.full_name || '',
              email: c.email || '',
              phone: c.phone || '',
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

      setParticipants(
        rows.map((p: any) => {
          const contact = p.contact_id ? contactMap[p.contact_id] : null;
          return {
            id: p.id,
            name: contact?.full_name || p.name || '',
            email: contact?.email || p.email || '',
            phone: contact?.phone || p.phone || '',
            role: p.role || '',
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
      // Sync participant data back to contact — always overwrite with participant values
      const updates: Record<string, any> = {};
      const existingData = (data.contact_data || {}) as Record<string, string>;
      const mergedContactData = { ...existingData };

      if (participant.name) {
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
      if (participant.email) {
        updates.email = participant.email;
        mergedContactData['email'] = participant.email;
      }
      if (participant.phone) {
        updates.phone = participant.phone;
        mergedContactData['phone.home'] = participant.phone;
      }
      // Map role to capacity
      const capacityLabel = ROLE_LABELS[participant.role] || participant.role;
      mergedContactData['capacity'] = capacityLabel;

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
      // Sync participant data back to contact — always overwrite with participant values
      if (participant) {
        const updates: Record<string, any> = {};
        const existingData = (data.contact_data || {}) as Record<string, string>;
        const mergedContactData = { ...existingData };

        if (participant.name) {
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
        if (participant.email) {
          updates.email = participant.email;
          mergedContactData['email'] = participant.email;
        }
        if (participant.phone) {
          updates.phone = participant.phone;
          mergedContactData['phone.home'] = participant.phone;
        }
        // Map role to capacity
        const capacityLabel = ROLE_LABELS[participant.role] || participant.role;
        mergedContactData['capacity'] = capacityLabel;

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
      case 'name':
        return <span className="font-medium text-foreground">{participant.name || '—'}</span>;
      case 'email':
        return <span className="text-muted-foreground">{participant.email || '—'}</span>;
      case 'phone':
        return <span className="text-muted-foreground">{participant.phone || '—'}</span>;
      case 'role':
        return (
          <Badge variant="secondary" className={cn('text-xs', ROLE_COLORS[participant.role] || '')}>
            {ROLE_LABELS[participant.role] || participant.role}
          </Badge>
        );
      case 'role_capacity':
        return (
          <span className="text-muted-foreground">{ROLE_LABELS[participant.role] || participant.role}</span>
        );
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
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
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
          selectedCount={selectedIds.size}
          onBulkDelete={() => setDeleteDialogOpen(true)}
          onExport={() => setExportOpen(true)}
          searchPlaceholder="Search participants..."
        />
        <div className="flex items-center gap-2">
          <ColumnConfigPopover
            columns={columns}
            onColumnsChange={setColumns}
            onResetColumns={resetColumns}
            disabled={disabled}
          />
          <Button
            size="sm"
            onClick={() => setAddModalOpen(true)}
            disabled={disabled}
            className="gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Participant
          </Button>
        </div>
      </div>

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
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              {visibleColumns.map((col) => (
                <SortableTableHead
                  key={col.id}
                  columnId={col.id}
                  label={col.label}
                  sortColumnId={sortState.columnId}
                  sortDirection={sortState.direction}
                  onSort={toggleSort}
                />
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((participant) => (
              <TableRow
                key={participant.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(participant)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(participant.id)}
                    onCheckedChange={() => toggleOne(participant.id)}
                  />
                </TableCell>
                {visibleColumns.map((col) => (
                  <TableCell key={col.id}>
                    {renderCellValue(participant, col.id)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
