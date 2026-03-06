import React, { useState } from 'react';
import { Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ColumnConfigPopover, ColumnConfig } from './ColumnConfigPopover';
import { useTableColumnConfig } from '@/hooks/useTableColumnConfig';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { GridToolbar, FilterOption } from './GridToolbar';
import { GridExportDialog, ExportColumn } from './GridExportDialog';
import { SortableTableHead } from './SortableTableHead';
import { useGridSortFilter } from '@/hooks/useGridSortFilter';
import { useGridSelection } from '@/hooks/useGridSelection';

export interface NoteData {
  id: string;
  highPriority: boolean;
  date: string;
  asOfDate: string;
  account: string;
  name: string;
  reference: string;
  content: string;
  type: string;
  attachments: string[];
}

interface NotesTableViewProps {
  notes: NoteData[];
  onAddNote: () => void;
  onEditNote: (note: NoteData) => void;
  onRowClick: (note: NoteData) => void;
  onDeleteNote?: (note: NoteData) => void;
  onBulkDelete?: (notes: NoteData[]) => void;
  onExport?: () => void;
  onRefresh?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  asOfFilter?: string;
  onAsOfFilterChange?: (value: string) => void;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'date', label: 'Date - Time', visible: true },
  { id: 'asOfDate', label: 'As Of', visible: true },
  { id: 'highPriority', label: 'High Priority', visible: true },
  { id: 'type', label: 'Type', visible: true },
  { id: 'account', label: 'Account', visible: true },
  { id: 'name', label: 'Name', visible: true },
  { id: 'reference', label: 'Reference', visible: true },
];

const SEARCH_FIELDS = ['name', 'account', 'reference', 'type', 'content', 'date'];

const FILTER_OPTIONS: FilterOption[] = [
  {
    id: 'type',
    label: 'Type',
    options: [
      { value: 'note', label: 'Note' },
      { value: 'call', label: 'Call' },
      { value: 'email', label: 'Email' },
      { value: 'meeting', label: 'Meeting' },
    ],
  },
  {
    id: 'highPriority',
    label: 'Priority',
    options: [
      { value: 'true', label: 'High Priority' },
      { value: 'false', label: 'Normal' },
    ],
  },
];

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  } catch { return dateStr; }
};

export const NotesTableView: React.FC<NotesTableViewProps> = ({
  notes, onAddNote, onEditNote, onRowClick, onDeleteNote, onBulkDelete, onExport, onRefresh, disabled = false, isLoading = false,
  asOfFilter, onAsOfFilterChange,
}) => {
  const [columns, setColumns, resetColumns] = useTableColumnConfig('notes_v3', DEFAULT_COLUMNS);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const visibleColumns = columns.filter((col) => col.visible);

  const {
    searchQuery, setSearchQuery, sortState, toggleSort,
    activeFilters, setFilter, clearFilters, activeFilterCount, filteredData,
  } = useGridSortFilter(notes, SEARCH_FIELDS);

  const {
    selectedIds, selectedItems, toggleOne, toggleAll, clearSelection,
    isAllSelected, isSomeSelected, selectedCount,
  } = useGridSelection(filteredData);

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yyyy = d.getFullYear();
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      return `${mm}/${dd}/${yyyy} ${hh}:${min}:${ss}`;
    } catch { return dateStr; }
  };

  const renderCellValue = (note: NoteData, columnId: string) => {
    switch (columnId) {
      case 'date': return formatDateTime(note.date);
      case 'asOfDate': return formatDate(note.asOfDate);
      case 'highPriority': return note.highPriority ? 'Yes' : 'No';
      case 'type': return note.type || '-';
      case 'account': return note.account || '-';
      case 'name': return note.name || '-';
      case 'reference': return note.reference || '-';
      default: return '-';
    }
  };

  const handleBulkDelete = () => {
    if (onBulkDelete) {
      onBulkDelete(selectedItems);
    } else if (onDeleteNote) {
      selectedItems.forEach((item) => onDeleteNote(item));
    }
    clearSelection();
    setBulkDeleteOpen(false);
  };

  const exportColumns: ExportColumn[] = DEFAULT_COLUMNS.map(c => ({ id: c.id, label: c.label }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-lg text-foreground">Conversation Log</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <label className="text-xs text-muted-foreground whitespace-nowrap">As Of:</label>
            <input
              type="date"
              value={asOfFilter || ''}
              onChange={(e) => onAsOfFilterChange?.(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            />
            {asOfFilter && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAsOfFilterChange?.('')}>
                <span className="text-xs">✕</span>
              </Button>
            )}
          </div>
          <ColumnConfigPopover columns={columns} onColumnsChange={setColumns} onResetColumns={resetColumns} disabled={disabled} />
          <Button variant="outline" size="sm" onClick={onAddNote} disabled={disabled} className="gap-1">
            <Plus className="h-4 w-4" />
            Add Conversation Logs
          </Button>
        </div>
      </div>

      {/* Grid Toolbar */}
      <GridToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={onRefresh}
        filterOptions={FILTER_OPTIONS}
        activeFilters={activeFilters}
        onFilterChange={setFilter}
        onClearFilters={clearFilters}
        activeFilterCount={activeFilterCount}
        disabled={disabled}
        selectedCount={selectedCount}
        onBulkDelete={() => setBulkDeleteOpen(true)}
        onExport={() => setExportOpen(true)}
        searchPlaceholder="Search conversations..."
      />

      {/* Table */}
      <div className="border border-border rounded-lg overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={isAllSelected}
                  ref={(el) => { if (el) (el as any).indeterminate = isSomeSelected; }}
                  onCheckedChange={toggleAll}
                  disabled={disabled || filteredData.length === 0}
                />
              </TableHead>
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
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  {Array.from({ length: visibleColumns.length }).map((_, ci) => (
                    <TableCell key={`sc-${ci}`}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 1} className="text-center py-8 text-muted-foreground">
                  {notes.length === 0 ? 'No conversation logs added. Click "Add Conversation Logs" to add one.' : 'No conversation logs match your search or filters.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((note) => (
                <TableRow key={note.id} className="cursor-pointer hover:bg-muted/30" onClick={() => onRowClick(note)}>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selectedIds.has(note.id)} onCheckedChange={() => toggleOne(note.id)} disabled={disabled} />
                  </TableCell>
                  {visibleColumns.map((col) => (
                    <TableCell key={col.id}>{renderCellValue(note, col.id)}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      {notes.length > 0 && (
        <div className="flex justify-end">
          <div className="text-sm text-muted-foreground">
            {filteredData.length !== notes.length && `Showing ${filteredData.length} of `}
            Total Conversation Logs: {notes.length}
          </div>
        </div>
      )}

      <DeleteConfirmationDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
        title={`Delete ${selectedCount} Conversation Logs`}
        description={`Are you sure you want to delete ${selectedCount} selected conversation logs? This action cannot be undone.`}
      />

      <GridExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        columns={exportColumns}
        data={notes}
        fileName="conversation_log"
      />
    </div>
  );
};

export default NotesTableView;
