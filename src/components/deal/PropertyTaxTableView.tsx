import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus } from 'lucide-react';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { GridToolbar, FilterOption } from './GridToolbar';
import { GridExportDialog, ExportColumn } from './GridExportDialog';
import { SortableTableHead } from './SortableTableHead';
import { useGridSortFilter } from '@/hooks/useGridSortFilter';
import { useGridSelection } from '@/hooks/useGridSelection';

export interface PropertyTaxData {
  id: string;
  authority: string;
  type: string;
  annualPayment: string;
  frequency: string;
  active: boolean;
  lastVerified: string;
  lenderNotified: string;
  current: boolean;
  delinquent: boolean;
  delinquentAmount: string;
}

interface PropertyTaxTableViewProps {
  taxes: PropertyTaxData[];
  onAddTax: () => void;
  onEditTax: (tax: PropertyTaxData) => void;
  onRowClick: (tax: PropertyTaxData) => void;
  onDeleteTax?: (tax: PropertyTaxData) => void;
  onBulkDelete?: (taxes: PropertyTaxData[]) => void;
  onRefresh?: () => void;
  disabled?: boolean;
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
}

const SEARCH_FIELDS = ['authority', 'type', 'frequency'];

const FILTER_OPTIONS: FilterOption[] = [
  {
    id: 'type',
    label: 'Type',
    options: [
      { value: 'Current Property Tax', label: 'Current Property Tax' },
      { value: 'Delinquent Property Tax', label: 'Delinquent Property Tax' },
      { value: 'Other', label: 'Other' },
    ],
  },
];

const EXPORT_COLUMNS: ExportColumn[] = [
  { id: 'authority', label: 'Tax Authority' },
  { id: 'type', label: 'Type' },
  { id: 'annualPayment', label: 'Annual Payment (est.)' },
  { id: 'frequency', label: 'Frequency' },
  { id: 'active', label: 'Active' },
  { id: 'lastVerified', label: 'Last Verified' },
  { id: 'lenderNotified', label: 'Lender Notified' },
  { id: 'current', label: 'Current' },
  { id: 'delinquent', label: 'Delinquent' },
];

export const PropertyTaxTableView: React.FC<PropertyTaxTableViewProps> = ({
  taxes,
  onAddTax,
  onRowClick,
  onDeleteTax,
  onBulkDelete,
  onRefresh,
  disabled = false,
  currentPage = 1,
  totalPages = 1,
  totalCount,
  onPageChange,
}) => {
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const {
    searchQuery, setSearchQuery, sortState, toggleSort,
    activeFilters, setFilter, clearFilters, activeFilterCount, filteredData,
  } = useGridSortFilter(taxes, SEARCH_FIELDS);

  // Clear search when list changes
  const prevCountRef = React.useRef(taxes.length);
  React.useEffect(() => {
    if (taxes.length !== prevCountRef.current) {
      setSearchQuery('');
      prevCountRef.current = taxes.length;
    }
  }, [taxes.length, setSearchQuery]);

  const {
    selectedIds, selectedItems, toggleOne, toggleAll, clearSelection,
    isAllSelected, isSomeSelected, selectedCount,
  } = useGridSelection(filteredData);

  const formatCurrency = (value: string) => {
    if (!value) return '';
    const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(num);
  };

  const formatDate = (val: string) => {
    if (!val) return '-';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return val;
      return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
    } catch { return val; }
  };

  const handleBulkDelete = () => {
    if (onBulkDelete) {
      onBulkDelete(selectedItems);
    } else if (onDeleteTax) {
      selectedItems.forEach((item) => onDeleteTax(item));
    }
    clearSelection();
    setBulkDeleteOpen(false);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Property Tax</h3>
        <Button size="sm" onClick={onAddTax} disabled={disabled} className="gap-1">
          <Plus className="h-4 w-4" />
          Add Property Tax
        </Button>
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

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto" style={{ minWidth: '100%' }}>
          <Table>
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
                <SortableTableHead columnId="authority" label="Tax Authority" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="min-w-[150px]" />
                <SortableTableHead columnId="type" label="Type" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="min-w-[150px]" />
                <SortableTableHead columnId="annualPayment" label="Annual Payment (est.)" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="min-w-[150px] text-right" />
                <SortableTableHead columnId="frequency" label="Frequency" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="min-w-[120px]" />
                <SortableTableHead columnId="active" label="Active" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="min-w-[70px]" />
                <SortableTableHead columnId="lastVerified" label="Last Verified" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="min-w-[110px]" />
                <SortableTableHead columnId="lenderNotified" label="Lender Notified" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="min-w-[120px]" />
                <SortableTableHead columnId="current" label="Current" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="min-w-[80px]" />
                <SortableTableHead columnId="delinquent" label="Delinquent" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="min-w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    {taxes.length === 0 ? 'No property tax records added. Click "Add Property Tax" to create one.' : 'No property tax records match your search or filters.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((tax) => (
                  <TableRow key={tax.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onRowClick(tax)}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selectedIds.has(tax.id)} onCheckedChange={() => toggleOne(tax.id)} disabled={disabled} />
                    </TableCell>
                    <TableCell className="font-medium">{tax.authority || '-'}</TableCell>
                    <TableCell>{tax.type || '-'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(tax.annualPayment) || '-'}</TableCell>
                    <TableCell>{tax.frequency || '-'}</TableCell>
                    <TableCell>{tax.active ? '✓' : '-'}</TableCell>
                    <TableCell>{formatDate(tax.lastVerified)}</TableCell>
                    <TableCell>{formatDate(tax.lenderNotified)}</TableCell>
                    <TableCell>{tax.current ? '✓' : '-'}</TableCell>
                    <TableCell>
                      {tax.delinquent ? (
                        <span>{formatCurrency(tax.delinquentAmount) || '✓'}</span>
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * 10 + 1}–{Math.min(currentPage * 10, totalCount ?? taxes.length)} of {totalCount ?? taxes.length} records
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => onPageChange?.(1)} disabled={currentPage <= 1 || disabled}>First</Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange?.(currentPage - 1)} disabled={currentPage <= 1 || disabled}>Previous</Button>
            <span className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm">{currentPage}</span>
            <Button variant="outline" size="sm" onClick={() => onPageChange?.(currentPage + 1)} disabled={currentPage >= totalPages || disabled}>Next</Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange?.(totalPages)} disabled={currentPage >= totalPages || disabled}>Last</Button>
          </div>
        </div>
      )}

      {/* Footer */}
      {taxes.length > 0 && (
        <div className="flex justify-end">
          <div className="text-sm text-muted-foreground">
            {filteredData.length !== taxes.length && `Showing ${filteredData.length} of `}
            Total Property Tax Records: {totalCount ?? taxes.length}
          </div>
        </div>
      )}

      <DeleteConfirmationDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
        title={`Delete ${selectedCount} Property Tax Records`}
        description={`Are you sure you want to delete ${selectedCount} selected property tax records? This action cannot be undone.`}
      />

      <GridExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        columns={EXPORT_COLUMNS}
        data={taxes}
        fileName="property_tax"
      />
    </div>
  );
};

export default PropertyTaxTableView;
