import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, ArrowLeft } from 'lucide-react';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { GridToolbar, FilterOption } from './GridToolbar';
import { GridExportDialog, ExportColumn } from './GridExportDialog';
import { SortableTableHead } from './SortableTableHead';
import { useGridSortFilter } from '@/hooks/useGridSortFilter';
import { useGridSelection } from '@/hooks/useGridSelection';

export interface InsuranceData {
  id: string;
  property: string;
  description: string;
  insuredName: string;
  companyName: string;
  policyNumber: string;
  expiration: string;
  coverage: string;
  annualPremium: string;
  frequency: string;
  active: boolean;
  agentName: string;
  businessAddress: string;
  businessAddressCity: string;
  businessAddressState: string;
  businessAddressZip: string;
  phoneNumber: string;
  faxNumber: string;
  email: string;
  note: string;
  paymentMailingStreet: string;
  paymentMailingCity: string;
  paymentMailingState: string;
  paymentMailingZip: string;
  insuranceTracking: boolean;
  lastVerified: string;
  trackingStatus: string;
  impoundsActive: boolean;
  redFlagTrigger: string;
  attemptAgent: boolean;
  attemptBorrower: boolean;
  lenderNotified: boolean;
  lenderNotifiedDate: string;
}

interface InsuranceTableViewProps {
  insurances: InsuranceData[];
  onAddInsurance: () => void;
  onEditInsurance: (insurance: InsuranceData) => void;
  onRowClick: (insurance: InsuranceData) => void;
  onDeleteInsurance?: (insurance: InsuranceData) => void;
  onBulkDelete?: (insurances: InsuranceData[]) => void;
  onBack?: () => void;
  onRefresh?: () => void;
  disabled?: boolean;
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
}

const SEARCH_FIELDS = ['description', 'companyName', 'policyNumber', 'agentName', 'annualPremium', 'frequency'];

const FILTER_OPTIONS: FilterOption[] = [
  {
    id: 'active',
    label: 'Status',
    options: [
      { value: 'true', label: 'Active' },
      { value: 'false', label: 'Inactive' },
    ],
  },
];

const EXPORT_COLUMNS: ExportColumn[] = [
  { id: 'description', label: 'Description' },
  { id: 'companyName', label: 'Company' },
  { id: 'policyNumber', label: 'Policy #' },
  { id: 'expiration', label: 'Expiration' },
  { id: 'annualPremium', label: 'Annual Premium' },
  { id: 'frequency', label: 'Frequency' },
  { id: 'active', label: 'Status' },
  { id: 'agentName', label: 'Agent' },
];

export const InsuranceTableView: React.FC<InsuranceTableViewProps> = ({
  insurances,
  onAddInsurance,
  onEditInsurance,
  onRowClick,
  onDeleteInsurance,
  onBulkDelete,
  onBack,
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
  } = useGridSortFilter(insurances, SEARCH_FIELDS);

  // Clear search when insurance list changes (e.g., after modal save)
  const prevCountRef = React.useRef(insurances.length);
  React.useEffect(() => {
    if (insurances.length !== prevCountRef.current) {
      setSearchQuery('');
      prevCountRef.current = insurances.length;
    }
  }, [insurances.length, setSearchQuery]);

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

  const handleBulkDelete = () => {
    if (onBulkDelete) {
      onBulkDelete(selectedItems);
    } else if (onDeleteInsurance) {
      selectedItems.forEach((item) => onDeleteInsurance(item));
    }
    clearSelection();
    setBulkDeleteOpen(false);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 h-8">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          <h3 className="text-lg font-semibold text-foreground">Insurance</h3>
        </div>
        <Button size="sm" onClick={onAddInsurance} disabled={disabled} className="gap-1">
          <Plus className="h-4 w-4" />
          Add Insurance
        </Button>
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
                <SortableTableHead columnId="description" label="Description" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="min-w-[120px]" />
                <SortableTableHead columnId="companyName" label="Company" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="min-w-[150px]" />
                <SortableTableHead columnId="policyNumber" label="Policy #" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="min-w-[120px]" />
                <SortableTableHead columnId="expiration" label="Expiration" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="min-w-[100px]" />
                <SortableTableHead columnId="annualPremium" label="Annual Premium" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="min-w-[120px] text-right" />
                <SortableTableHead columnId="frequency" label="Frequency" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="min-w-[100px]" />
                <SortableTableHead columnId="active" label="Status" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="min-w-[80px]" />
                <SortableTableHead columnId="agentName" label="Agent" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="min-w-[150px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {insurances.length === 0 ? 'No insurance records added. Click "Add Insurance" to create one.' : 'No insurance records match your search or filters.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((insurance) => (
                  <TableRow key={insurance.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onRowClick(insurance)}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selectedIds.has(insurance.id)} onCheckedChange={() => toggleOne(insurance.id)} disabled={disabled} />
                    </TableCell>
                    <TableCell className="font-medium">{insurance.description || '-'}</TableCell>
                    <TableCell>{insurance.companyName || '-'}</TableCell>
                    <TableCell>{insurance.policyNumber || '-'}</TableCell>
                    <TableCell>{(() => {
                      if (!insurance.expiration) return '-';
                      try {
                        const d = new Date(insurance.expiration);
                        if (isNaN(d.getTime())) return insurance.expiration;
                        return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
                      } catch { return insurance.expiration; }
                    })()}</TableCell>
                    <TableCell className="text-right">{formatCurrency(insurance.coverage) || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={insurance.active ? 'default' : 'secondary'}>
                        {insurance.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{insurance.agentName || '-'}</TableCell>
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
            Showing {(currentPage - 1) * 10 + 1}–{Math.min(currentPage * 10, totalCount ?? insurances.length)} of {totalCount ?? insurances.length} records
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
      {insurances.length > 0 && (
        <div className="flex justify-end">
          <div className="text-sm text-muted-foreground">
            {filteredData.length !== insurances.length && `Showing ${filteredData.length} of `}
            Total Insurance Records: {totalCount ?? insurances.length}
          </div>
        </div>
      )}

      <DeleteConfirmationDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
        title={`Delete ${selectedCount} Insurance Records`}
        description={`Are you sure you want to delete ${selectedCount} selected insurance records? This action cannot be undone.`}
      />

      <GridExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        columns={EXPORT_COLUMNS}
        data={insurances}
        fileName="insurance"
      />
    </div>
  );
};

export default InsuranceTableView;
