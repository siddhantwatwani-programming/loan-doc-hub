import React, { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ColumnConfigPopover, ColumnConfig } from './ColumnConfigPopover';
import { useTableColumnConfig } from '@/hooks/useTableColumnConfig';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { GridToolbar, FilterOption } from './GridToolbar';
import { GridExportDialog, ExportColumn } from './GridExportDialog';
import { SortableTableHead } from './SortableTableHead';
import { useGridSortFilter } from '@/hooks/useGridSortFilter';
import { useGridSelection } from '@/hooks/useGridSelection';

export interface LenderData {
  id: string;
  isPrimary: boolean;
  type: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  taxId: string;
  taxIdType: string;
}

interface LendersTableViewProps {
  lenders: LenderData[];
  onAddLender: () => void;
  onEditLender: (lender: LenderData) => void;
  onRowClick: (lender: LenderData) => void;
  onPrimaryChange: (lenderId: string, isPrimary: boolean) => void;
  onDeleteLender?: (lender: LenderData) => void;
  onBulkDelete?: (lenders: LenderData[]) => void;
  onRefresh?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'isPrimary', label: 'Primary Contact', visible: true },
  { id: 'type', label: 'Type', visible: true },
  { id: 'fullName', label: 'Full Name', visible: true },
  { id: 'email', label: 'Email', visible: true },
  { id: 'phone', label: 'Phone', visible: true },
  { id: 'street', label: 'Street', visible: true },
  { id: 'city', label: 'City', visible: true },
  { id: 'state', label: 'State', visible: true },
  { id: 'zip', label: 'ZIP', visible: true },
];

const SEARCH_FIELDS = ['fullName', 'email', 'phone', 'street', 'city', 'state', 'zip', 'type'];

const FILTER_OPTIONS: FilterOption[] = [
  {
    id: 'type',
    label: 'Type',
    options: [
      { value: 'individual', label: 'Individual' },
      { value: 'entity', label: 'Entity' },
      { value: 'trust', label: 'Trust' },
      { value: 'ira', label: 'IRA' },
    ],
  },
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
];

export const LendersTableView: React.FC<LendersTableViewProps> = ({
  lenders,
  onAddLender,
  onEditLender,
  onRowClick,
  onPrimaryChange,
  onDeleteLender,
  onBulkDelete,
  onRefresh,
  disabled = false,
  isLoading = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) => {
  const [columns, setColumns, resetColumns] = useTableColumnConfig('lenders_v2', DEFAULT_COLUMNS);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const visibleColumns = columns.filter((col) => col.visible);

  const {
    searchQuery, setSearchQuery, sortState, toggleSort,
    activeFilters, setFilter, clearFilters, activeFilterCount, filteredData,
  } = useGridSortFilter(lenders, SEARCH_FIELDS);

  const {
    selectedIds, selectedItems, toggleOne, toggleAll, clearSelection,
    isAllSelected, isSomeSelected, selectedCount,
  } = useGridSelection(filteredData);

  const renderCellValue = (lender: LenderData, columnId: string) => {
    switch (columnId) {
      case 'isPrimary':
        return lender.isPrimary ? (
          <Check className="h-5 w-5 text-primary" />
        ) : null;
      case 'fullName':
        return <span className="font-medium">{lender.fullName || '-'}</span>;
      default:
        return lender[columnId as keyof LenderData] || '-';
    }
  };

  const renderLoadingSkeleton = () => (
    <>
      {[1, 2, 3].map((i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-4" /></TableCell>
          {visibleColumns.map((col) => (
            <TableCell key={col.id}><Skeleton className="h-4 w-20" /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );

  const handleBulkDelete = () => {
    if (onBulkDelete) {
      onBulkDelete(selectedItems);
    } else if (onDeleteLender) {
      selectedItems.forEach((item) => onDeleteLender(item));
    }
    clearSelection();
    setBulkDeleteOpen(false);
  };

  const exportColumns: ExportColumn[] = DEFAULT_COLUMNS.filter(c => c.id !== 'isPrimary').map(c => ({ id: c.id, label: c.label }));

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-foreground">Lenders</h3>
        <div className="flex items-center gap-2">
          <ColumnConfigPopover columns={columns} onColumnsChange={setColumns} onResetColumns={resetColumns} disabled={disabled} />
          <Button variant="outline" size="sm" onClick={onAddLender} disabled={disabled} className="gap-1">
            <Plus className="h-4 w-4" />
            Add Lender
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
      />

      {/* Table */}
      <div className="border border-border rounded-lg overflow-x-auto">
        <Table className="min-w-[1000px]">
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
                col.id === 'isPrimary' ? (
                  <TableHead key={col.id} className="w-[80px]">{col.label.toUpperCase()}</TableHead>
                ) : (
                  <SortableTableHead
                    key={col.id}
                    columnId={col.id}
                    label={col.label.toUpperCase()}
                    sortColumnId={sortState.columnId}
                    sortDirection={sortState.direction}
                    onSort={toggleSort}
                  />
                )
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? renderLoadingSkeleton() : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 1} className="text-center py-8 text-muted-foreground">
                  {lenders.length === 0 ? 'No lenders added. Click "Add Lender" to add one.' : 'No lenders match your search or filters.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((lender) => (
                <TableRow key={lender.id} className="cursor-pointer hover:bg-muted/30" onClick={() => onRowClick(lender)}>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selectedIds.has(lender.id)} onCheckedChange={() => toggleOne(lender.id)} disabled={disabled} />
                  </TableCell>
                  {visibleColumns.map((col) => (
                    <TableCell key={col.id} onClick={col.id === 'isPrimary' ? (e) => e.stopPropagation() : undefined}>
                      {renderCellValue(lender, col.id)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onPageChange?.(currentPage - 1)} disabled={currentPage <= 1 || isLoading}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => onPageChange?.(currentPage + 1)} disabled={currentPage >= totalPages || isLoading}>Next</Button>
        </div>
      )}

      {/* Footer */}
      {lenders.length > 0 && (
        <div className="flex justify-end">
          <div className="text-sm text-muted-foreground">
            {filteredData.length !== lenders.length && `Showing ${filteredData.length} of `}
            Total Lenders: {lenders.length}
          </div>
        </div>
      )}

      <DeleteConfirmationDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
        title={`Delete ${selectedCount} Lenders`}
        description={`Are you sure you want to delete ${selectedCount} selected lenders? This action cannot be undone.`}
      />

      <GridExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        columns={exportColumns}
        data={lenders}
        fileName="lenders"
      />
    </div>
  );
};

export default LendersTableView;
