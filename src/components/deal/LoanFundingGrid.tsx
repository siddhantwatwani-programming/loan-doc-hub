import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, History, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddFundingModal, FundingFormData } from './AddFundingModal';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { FundingHistoryDialog } from './FundingHistoryDialog';
import { ColumnConfigPopover, ColumnConfig } from './ColumnConfigPopover';
import { useTableColumnConfig } from '@/hooks/useTableColumnConfig';
import { GridToolbar } from './GridToolbar';
import { GridExportDialog, ExportColumn } from './GridExportDialog';
import { SortableTableHead } from './SortableTableHead';
import { useGridSortFilter } from '@/hooks/useGridSortFilter';
import { useGridSelection } from '@/hooks/useGridSelection';

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'lenderAccount', label: 'Lender Account', visible: true },
  { id: 'lenderName', label: 'Lender Name', visible: true },
  { id: 'pctOwned', label: 'Pct Owned', visible: true },
  { id: 'lenderRate', label: 'Lender Rate', visible: true },
  { id: 'principalBalance', label: 'Principal Balance', visible: true },
  { id: 'originalAmount', label: 'Original Amount', visible: true },
  { id: 'regularPayment', label: 'Regular Payment', visible: true },
  { id: 'roundingError', label: 'Rounding Error', visible: true },
];

interface FundingRecord {
  id: string;
  lenderAccount: string;
  lenderName: string;
  pctOwned: number;
  lenderRate: number;
  principalBalance: number;
  originalAmount: number;
  regularPayment: number;
  roundingError: boolean;
}

interface LoanFundingGridProps {
  dealId: string;
  loanNumber?: string;
  borrowerName?: string;
  fundingRecords: FundingRecord[];
  historyRecords?: any[];
  onAddFunding: (data: any) => void;
  onDeleteRecord?: (record: FundingRecord) => void;
  onBulkDelete?: (records: FundingRecord[]) => void;
  onUpdateRecord: (id: string, data: Partial<FundingRecord>) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const SEARCH_FIELDS = ['lenderAccount', 'lenderName'];

export const LoanFundingGrid: React.FC<LoanFundingGridProps> = ({
  dealId,
  loanNumber,
  borrowerName,
  fundingRecords,
  historyRecords = [],
  onAddFunding,
  onDeleteRecord,
  onBulkDelete,
  onUpdateRecord,
  onRefresh,
  isLoading = false,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  disabled = false,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FundingRecord | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [editFundingData, setEditFundingData] = useState<FundingFormData | null>(null);
  const [columns, setColumns, resetColumns] = useTableColumnConfig('funding', DEFAULT_COLUMNS);
  const visibleColumns = columns.filter((col) => col.visible);

  const {
    searchQuery, setSearchQuery, sortState, toggleSort,
    activeFilters, setFilter, clearFilters, activeFilterCount, filteredData,
  } = useGridSortFilter(fundingRecords, SEARCH_FIELDS);

  const {
    selectedIds, selectedItems, toggleOne, toggleAll, clearSelection,
    isAllSelected, isSomeSelected, selectedCount,
  } = useGridSelection(filteredData);

  const totalOwnership = fundingRecords.reduce((sum, r) => sum + r.pctOwned, 0);
  const totalPrincipalBalance = fundingRecords.reduce((sum, r) => sum + r.principalBalance, 0);
  const totalPayment = fundingRecords.reduce((sum, r) => sum + r.regularPayment, 0);
  const totalFundingAmount = fundingRecords.reduce((sum, r) => sum + r.originalAmount, 0);

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  const formatPercentage = (value: number) => `${value.toFixed(3)}%`;

  const handleRowClick = (record: FundingRecord) => {
    setEditFundingData({
      loan: loanNumber || '',
      borrower: borrowerName || '',
      lenderId: record.lenderAccount,
      lenderFullName: record.lenderName,
      lenderRate: String(record.lenderRate),
      fundingAmount: String(record.originalAmount),
      fundingDate: '',
      interestFrom: '',
      notes: '',
      brokerParticipates: false,
    });
    setSelectedRecord(record);
    setIsAddModalOpen(true);
  };

  const renderCellValue = (record: FundingRecord, columnId: string) => {
    switch (columnId) {
      case 'lenderAccount':
        return <span className="font-medium">{record.lenderAccount || '-'}</span>;
      case 'lenderName':
        return record.lenderName || '-';
      case 'pctOwned':
        return <span className="text-right block">{formatPercentage(record.pctOwned)}</span>;
      case 'lenderRate':
        return <span className="text-right block">{formatPercentage(record.lenderRate)}</span>;
      case 'principalBalance':
        return <span className="text-right block">{formatCurrency(record.principalBalance)}</span>;
      case 'originalAmount':
        return <span className="text-right block">{formatCurrency(record.originalAmount)}</span>;
      case 'regularPayment':
        return <span className="text-right block">{formatCurrency(record.regularPayment)}</span>;
      case 'roundingError':
        return (
          <div className="text-center">
            <Checkbox
              checked={record.roundingError}
              onCheckedChange={(checked) => onUpdateRecord(record.id, { roundingError: !!checked })}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        );
      default:
        return '-';
    }
  };

  const handleBulkDelete = () => {
    if (onBulkDelete) {
      onBulkDelete(selectedItems);
    } else if (onDeleteRecord) {
      selectedItems.forEach((item) => onDeleteRecord(item));
    }
    clearSelection();
    setBulkDeleteOpen(false);
  };

  const exportColumns: ExportColumn[] = DEFAULT_COLUMNS.map(c => ({ id: c.id, label: c.label }));

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-foreground">Loan Funding</h3>
        <div className="flex items-center gap-2">
          <ColumnConfigPopover columns={columns} onColumnsChange={setColumns} onResetColumns={resetColumns} />
          <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(true)} className="gap-1" disabled={disabled}>
            <Plus className="h-4 w-4" />
            Add Funding
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsHistoryOpen(true)} className="gap-1" disabled={disabled}>
            <History className="h-4 w-4" />
            History
          </Button>
        </div>
      </div>

      {/* Grid Toolbar */}
      <GridToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={onRefresh}
        filterOptions={[]}
        activeFilters={activeFilters}
        onFilterChange={setFilter}
        onClearFilters={clearFilters}
        activeFilterCount={activeFilterCount}
        disabled={disabled}
        selectedCount={selectedCount}
        onBulkDelete={() => setBulkDeleteOpen(true)}
        onExport={() => setExportOpen(true)}
      />

      {/* Grid */}
      <div className="border border-border rounded-lg overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={isAllSelected}
                    ref={(el) => { if (el) (el as any).indeterminate = isSomeSelected; }}
                    onCheckedChange={toggleAll}
                    disabled={filteredData.length === 0}
                  />
                </TableHead>
                {visibleColumns.map((col) => (
                  col.id === 'roundingError' ? (
                    <TableHead key={col.id}>{col.label.toUpperCase()}</TableHead>
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
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 1} className="text-center text-muted-foreground py-8">
                    {fundingRecords.length === 0 ? 'No funding records found. Click "Add Funding" to add a new funding record.' : 'No funding records match your search.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((record) => (
                  <TableRow
                    key={record.id}
                    className={cn(!disabled && 'cursor-pointer hover:bg-muted/30', selectedRecord?.id === record.id && 'bg-primary/10')}
                    onClick={() => !disabled && handleRowClick(record)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selectedIds.has(record.id)} onCheckedChange={() => toggleOne(record.id)} />
                    </TableCell>
                    {visibleColumns.map((col) => (
                      <TableCell key={col.id}>{renderCellValue(record, col.id)}</TableCell>
                    ))}
                  </TableRow>
                ))
              )}
              {fundingRecords.length > 0 && (
                <TableRow className="bg-muted/30 font-semibold border-t-2">
                  <TableCell />
                  {visibleColumns.map((col, idx) => {
                    if (col.id === 'pctOwned') return <TableCell key={col.id} className="text-right"><span className={cn(totalOwnership !== 100 && 'text-destructive')}>{formatPercentage(totalOwnership)}</span></TableCell>;
                    if (col.id === 'principalBalance') return <TableCell key={col.id} className="text-right">{formatCurrency(totalPrincipalBalance)}</TableCell>;
                    if (col.id === 'regularPayment') return <TableCell key={col.id} className="text-right">{formatCurrency(totalPayment)}</TableCell>;
                    if (idx === 0) return <TableCell key={col.id} className="text-right font-semibold">Totals:</TableCell>;
                    return <TableCell key={col.id}></TableCell>;
                  })}
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Show</span>
          <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(Number(value))}>
            <SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span>entries</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => onPageChange(1)} disabled={currentPage === 1}>First</Button>
          <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>Previous</Button>
          <span className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm">{currentPage}</span>
          <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages}>Next</Button>
          <Button variant="outline" size="sm" onClick={() => onPageChange(totalPages)} disabled={currentPage >= totalPages}>Last</Button>
        </div>
      </div>

      {totalOwnership !== 100 && fundingRecords.length > 0 && (
        <p className="text-sm text-destructive">Total ownership must equal 100% (currently {formatPercentage(totalOwnership)})</p>
      )}

      {fundingRecords.length > 0 && (
        <div className="flex justify-end">
          <div className="text-sm text-muted-foreground">
            {filteredData.length !== fundingRecords.length && `Showing ${filteredData.length} of `}
            Total Funding Records: {fundingRecords.length} | Total Funding Amount: {formatCurrency(totalFundingAmount)}
          </div>
        </div>
      )}

      <AddFundingModal
        open={isAddModalOpen}
        onOpenChange={(open) => { setIsAddModalOpen(open); if (!open) { setEditFundingData(null); setSelectedRecord(null); } }}
        loanNumber={loanNumber}
        borrowerName={borrowerName}
        onSubmit={(data) => {
          if (selectedRecord) {
            onUpdateRecord(selectedRecord.id, {
              lenderAccount: data.lenderId,
              lenderName: data.lenderFullName,
              lenderRate: parseFloat(data.lenderRate) || 0,
              originalAmount: parseFloat(data.fundingAmount) || 0,
              principalBalance: parseFloat(data.fundingAmount) || 0,
            });
          } else {
            onAddFunding(data);
          }
        }}
        editData={editFundingData}
      />

      <FundingHistoryDialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen} dealId={dealId} historyRecords={historyRecords} />

      <DeleteConfirmationDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
        title={`Delete ${selectedCount} Funding Records`}
        description={`Are you sure you want to delete ${selectedCount} selected funding records? This action cannot be undone.`}
      />

      <GridExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        columns={exportColumns}
        data={fundingRecords}
        fileName="funding"
      />
    </div>
  );
};

export default LoanFundingGrid;
