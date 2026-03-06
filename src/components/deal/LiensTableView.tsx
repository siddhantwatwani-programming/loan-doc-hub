import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { GridToolbar } from './GridToolbar';
import { GridExportDialog, ExportColumn } from './GridExportDialog';
import { SortableTableHead } from './SortableTableHead';
import { useGridSortFilter } from '@/hooks/useGridSortFilter';
import { useGridSelection } from '@/hooks/useGridSelection';
import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from '@/components/ui/table';

export interface LienData {
  id: string;
  property: string;
  priority: string;
  holder: string;
  account: string;
  contact: string;
  phone: string;
  fax: string;
  email: string;
  loanType: string;
  anticipated: string;
  existingRemain: string;
  existingPaydown: string;
  existingPayoff: string;
  existingPaydownAmount: string;
  existingPayoffAmount: string;
  lienPriorityNow: string;
  lienPriorityAfter: string;
  interestRate: string;
  maturityDate: string;
  originalBalance: string;
  balanceAfter: string;
  currentBalance: string;
  regularPayment: string;
  recordingNumber: string;
  recordingNumberFlag: string;
  recordingDate: string;
  seniorLienTracking: string;
  lastVerified: string;
  lastChecked: string;
  note: string;
  thisLoan: string;
  estimate: string;
  status: string;
}

interface LiensTableViewProps {
  liens: LienData[];
  onAddLien: () => void;
  onEditLien: (lien: LienData) => void;
  onRowClick: (lien: LienData) => void;
  onDeleteLien?: (lien: LienData) => void;
  onBulkDelete?: (liens: LienData[]) => void;
  onRefresh?: () => void;
  onBack?: () => void;
  disabled?: boolean;
}

const SEARCHABLE_FIELDS = ['property', 'holder', 'loanType', 'lienPriorityNow', 'lienPriorityAfter', 'recordingNumber', 'lastVerified'];

const FILTER_OPTIONS = [
  {
    id: 'loanType',
    label: 'Loan Type',
    options: [
      { value: 'conventional', label: 'Conventional' },
      { value: 'fha', label: 'FHA' },
      { value: 'va', label: 'VA' },
      { value: 'heloc', label: 'HELOC' },
      { value: 'commercial', label: 'Commercial' },
    ],
  },
];

const EXPORT_COLUMNS: ExportColumn[] = [
  { id: 'property', label: 'Related Property' },
  { id: 'holder', label: 'Lien Holder' },
  { id: 'loanType', label: 'Loan Type' },
  { id: 'lienPriorityNow', label: 'Lien Priority Now' },
  { id: 'lienPriorityAfter', label: 'Lien Priority After' },
  { id: 'interestRate', label: 'Interest Rate' },
  { id: 'originalBalance', label: 'Original Balance' },
  { id: 'balanceAfter', label: 'Balance After' },
  { id: 'regularPayment', label: 'Regular Payment' },
  { id: 'recordingNumber', label: 'Recording Number' },
  { id: 'lastVerified', label: 'Last Verified' },
];

export const LiensTableView: React.FC<LiensTableViewProps> = ({
  liens, onAddLien, onEditLien, onRowClick, onDeleteLien, onBulkDelete, onRefresh, onBack, disabled = false,
}) => {
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const {
    searchQuery, setSearchQuery, sortState, toggleSort,
    activeFilters, setFilter, clearFilters, activeFilterCount, filteredData,
  } = useGridSortFilter(liens, SEARCHABLE_FIELDS);

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
    } else if (onDeleteLien) {
      selectedItems.forEach((l) => onDeleteLien(l));
    }
    clearSelection();
    setBulkDeleteOpen(false);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 h-8">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          <h3 className="text-lg font-semibold text-foreground">Liens</h3>
        </div>
        <Button size="sm" onClick={onAddLien} disabled={disabled} className="gap-1">
          <Plus className="h-4 w-4" />
          Add Lien
        </Button>
      </div>

      <div className="mb-3">
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
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto" style={{ minWidth: '100%' }}>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[40px]">
                  <Checkbox checked={isAllSelected} onCheckedChange={() => toggleAll()} aria-label="Select all" />
                </TableHead>
                <SortableTableHead columnId="property" label="Related Property" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="min-w-[120px]" />
                <SortableTableHead columnId="holder" label="Lien Holder" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="min-w-[100px]" />
                <SortableTableHead columnId="loanType" label="Loan Type" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="min-w-[100px]" />
                <SortableTableHead columnId="lienPriorityNow" label="Lien Priority Now" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="min-w-[80px]" />
                <SortableTableHead columnId="lienPriorityAfter" label="Lien Priority After" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="min-w-[80px]" />
                <SortableTableHead columnId="interestRate" label="Interest Rate" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="min-w-[100px]" />
                <SortableTableHead columnId="originalBalance" label="Original Balance" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="min-w-[120px] text-right" />
                <SortableTableHead columnId="balanceAfter" label="Balance After" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="min-w-[120px] text-right" />
                <SortableTableHead columnId="regularPayment" label="Regular Payment" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="min-w-[120px] text-right" />
                <SortableTableHead columnId="recordingNumber" label="Recording Number" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="min-w-[100px]" />
                <SortableTableHead columnId="lastVerified" label="Last Verified" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="min-w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                    No liens added. Click "Add Lien" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((lien) => (
                  <TableRow key={lien.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onRowClick(lien)}>
                    <TableCell onClick={(e) => e.stopPropagation()} className="w-[40px]">
                      <Checkbox checked={selectedIds.has(lien.id)} onCheckedChange={() => toggleOne(lien.id)} aria-label={`Select lien`} />
                    </TableCell>
                    <TableCell className="font-medium">{lien.property || 'Unassigned'}</TableCell>
                    <TableCell>{lien.holder || '-'}</TableCell>
                    <TableCell>{lien.loanType || '-'}</TableCell>
                    <TableCell>{lien.lienPriorityNow || '-'}</TableCell>
                    <TableCell>{lien.lienPriorityAfter || '-'}</TableCell>
                    <TableCell>{lien.interestRate ? `${lien.interestRate}%` : '-'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(lien.originalBalance) || '-'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(lien.balanceAfter) || '-'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(lien.regularPayment) || '-'}</TableCell>
                    <TableCell>{lien.recordingNumber || '-'}</TableCell>
                    <TableCell>{lien.lastVerified || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <DeleteConfirmationDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
        title="Delete Selected Liens"
        description={`Are you sure you want to delete ${selectedCount} selected lien(s)? This action cannot be undone.`}
      />

      <GridExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        columns={EXPORT_COLUMNS}
        data={filteredData}
        fileName="liens_export"
      />
    </div>
  );
};

export default LiensTableView;
