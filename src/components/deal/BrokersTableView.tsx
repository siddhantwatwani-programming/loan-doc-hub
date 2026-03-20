import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ColumnConfigPopover, ColumnConfig } from './ColumnConfigPopover';
import { FilterOption } from './GridToolbar';
import { useTableColumnConfig } from '@/hooks/useTableColumnConfig';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { GridToolbar } from './GridToolbar';
import { GridExportDialog, ExportColumn } from './GridExportDialog';
import { SortableTableHead } from './SortableTableHead';
import { useGridSortFilter } from '@/hooks/useGridSortFilter';
import { useGridSelection } from '@/hooks/useGridSelection';

export interface BrokerData {
  id: string;
  brokerId: string;
  license: string;
  company: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  phoneWork: string;
  phoneCell: string;
}

interface BrokersTableViewProps {
  brokers: BrokerData[];
  onAddBroker: () => void;
  onEditBroker: (broker: BrokerData) => void;
  onRowClick: (broker: BrokerData) => void;
  onDeleteBroker?: (broker: BrokerData) => void;
  onBulkDelete?: (brokers: BrokerData[]) => void;
  onRefresh?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'brokerId', label: 'Broker ID', visible: true },
  { id: 'license', label: 'License', visible: true },
  { id: 'company', label: 'Company', visible: true },
  { id: 'name', label: 'Name', visible: true },
  { id: 'email', label: 'Email', visible: true },
  { id: 'address', label: 'Address', visible: true },
  { id: 'phoneWork', label: 'Work Phone', visible: true },
  { id: 'phoneCell', label: 'Cell Phone', visible: true },
];

const SEARCHABLE_FIELDS = ['brokerId', 'license', 'company', 'firstName', 'lastName', 'email', 'street', 'city', 'state', 'phoneWork', 'phoneCell'];

const FILTER_OPTIONS: FilterOption[] = [
  {
    id: 'state',
    label: 'State',
    options: [
      { value: 'CA', label: 'CA' },
      { value: 'TX', label: 'TX' },
      { value: 'FL', label: 'FL' },
      { value: 'NY', label: 'NY' },
      { value: 'WA', label: 'WA' },
    ],
  },
  {
    id: 'company',
    label: 'Company',
    options: [
      { value: 'all', label: 'All' },
    ],
  },
];

export const BrokersTableView: React.FC<BrokersTableViewProps> = ({
  brokers,
  onAddBroker,
  onEditBroker,
  onRowClick,
  onDeleteBroker,
  onBulkDelete,
  onRefresh,
  disabled = false,
  isLoading = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) => {
  const [columns, setColumns, resetColumns] = useTableColumnConfig('brokers', DEFAULT_COLUMNS);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const visibleColumns = columns.filter((col) => col.visible);

  const {
    searchQuery, setSearchQuery, sortState, toggleSort,
    activeFilters, setFilter, clearFilters, activeFilterCount, filteredData,
  } = useGridSortFilter(brokers, SEARCHABLE_FIELDS);

  const {
    selectedIds, selectedItems, toggleOne, toggleAll, clearSelection,
    isAllSelected, isSomeSelected, selectedCount,
  } = useGridSelection(filteredData);

  const getFullName = (broker: BrokerData): string => {
    const parts = [broker.firstName, broker.middleName, broker.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : '-';
  };

  const getAddress = (broker: BrokerData): string => {
    const parts = [broker.street, broker.city, broker.state, broker.zip].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '-';
  };

  const renderCellValue = (broker: BrokerData, columnId: string) => {
    switch (columnId) {
      case 'brokerId': return <span className="font-medium">{broker.brokerId || '-'}</span>;
      case 'license': return broker.license || '-';
      case 'company': return broker.company || '-';
      case 'name': return getFullName(broker);
      case 'email': return broker.email || '-';
      case 'address': return <span className="max-w-[200px] truncate block">{getAddress(broker)}</span>;
      case 'phoneWork': return broker.phoneWork || '-';
      case 'phoneCell': return broker.phoneCell || '-';
      default: return '-';
    }
  };

  const exportColumns: ExportColumn[] = DEFAULT_COLUMNS.map((c) => ({ id: c.id, label: c.label }));

  const handleBulkDelete = () => {
    if (onBulkDelete) {
      onBulkDelete(selectedItems);
    } else if (onDeleteBroker) {
      selectedItems.forEach((b) => onDeleteBroker(b));
    }
    clearSelection();
    setBulkDeleteOpen(false);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-foreground">Brokers</h3>
        <div className="flex items-center gap-2">
          <ColumnConfigPopover columns={columns} onColumnsChange={setColumns} onResetColumns={resetColumns} disabled={disabled} />
          <Button variant="outline" size="sm" onClick={onAddBroker} disabled={disabled} className="gap-1">
            <Plus className="h-4 w-4" />
            Add Broker
          </Button>
        </div>
      </div>

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
      />

      <div className="border border-border rounded-lg overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={() => toggleAll()}
                  aria-label="Select all"
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
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {Array.from({ length: visibleColumns.length + 1 }).map((_, cellIndex) => (
                    <TableCell key={`skeleton-cell-${cellIndex}`}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 1} className="text-center py-8 text-muted-foreground">
                  No brokers added. Click "Add Broker" to add one.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((broker) => (
                <TableRow
                  key={broker.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => onRowClick(broker)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()} className="w-[40px]">
                    <Checkbox
                      checked={selectedIds.has(broker.id)}
                      onCheckedChange={() => toggleOne(broker.id)}
                      aria-label={`Select broker ${broker.brokerId}`}
                    />
                  </TableCell>
                  {visibleColumns.map((col) => (
                    <TableCell key={col.id}>
                      {renderCellValue(broker, col.id)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onPageChange?.(currentPage - 1)} disabled={currentPage <= 1 || disabled}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange?.(currentPage + 1)} disabled={currentPage >= totalPages || disabled}>Next</Button>
          </div>
        </div>
      )}

      {brokers.length > 0 && (
        <div className="flex justify-end">
          <div className="text-sm text-muted-foreground">Total Brokers: {brokers.length}</div>
        </div>
      )}

      <DeleteConfirmationDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
        title="Delete Selected Brokers"
        description={`Are you sure you want to delete ${selectedCount} selected broker(s)? This action cannot be undone.`}
      />

      <GridExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        columns={exportColumns}
        data={filteredData}
        fileName="brokers_export"
      />
    </div>
  );
};

export default BrokersTableView;
