import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, History, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddFundingModal } from './AddFundingModal';
import { FundingHistoryDialog } from './FundingHistoryDialog';
import { ColumnConfigPopover, ColumnConfig } from './ColumnConfigPopover';
import { useTableColumnConfig } from '@/hooks/useTableColumnConfig';

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
  onUpdateRecord: (id: string, data: Partial<FundingRecord>) => void;
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const LoanFundingGrid: React.FC<LoanFundingGridProps> = ({
  dealId,
  loanNumber,
  borrowerName,
  fundingRecords,
  historyRecords = [],
  onAddFunding,
  onUpdateRecord,
  isLoading = false,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FundingRecord | null>(null);
  const [columns, setColumns] = useTableColumnConfig('funding', DEFAULT_COLUMNS);
  const visibleColumns = columns.filter((col) => col.visible);

  // Calculate totals
  const totalOwnership = fundingRecords.reduce((sum, r) => sum + r.pctOwned, 0);
  const totalPrincipalBalance = fundingRecords.reduce((sum, r) => sum + r.principalBalance, 0);
  const totalPayment = fundingRecords.reduce((sum, r) => sum + r.regularPayment, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(3)}%`;
  };

  const handleRowClick = (record: FundingRecord) => {
    setSelectedRecord(record);
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
              onCheckedChange={(checked) => {
                onUpdateRecord(record.id, { roundingError: !!checked });
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        );
      default:
        return '-';
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header with title and actions */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-foreground">Loan Funding</h3>
        <div className="flex items-center gap-2">
          <ColumnConfigPopover
            columns={columns}
            onColumnsChange={setColumns}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Funding
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsHistoryOpen(true)}
            className="gap-1"
          >
            <History className="h-4 w-4" />
            History
          </Button>
        </div>
      </div>

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
                {visibleColumns.map((col) => (
                  <TableHead key={col.id}>
                    {col.label.toUpperCase()}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {fundingRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length} className="text-center text-muted-foreground py-8">
                    No funding records found. Click "Add Funding" to add a new funding record.
                  </TableCell>
                </TableRow>
              ) : (
                fundingRecords.map((record) => (
                  <TableRow
                    key={record.id}
                    className={cn(
                      'cursor-pointer hover:bg-muted/30',
                      selectedRecord?.id === record.id && 'bg-primary/10'
                    )}
                    onClick={() => handleRowClick(record)}
                  >
                    {visibleColumns.map((col) => (
                      <TableCell key={col.id}>
                        {renderCellValue(record, col.id)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
              {/* Totals Row */}
              {fundingRecords.length > 0 && (
                <TableRow className="bg-muted/30 font-semibold border-t-2">
                  {visibleColumns.map((col, idx) => {
                    if (col.id === 'pctOwned') {
                      return (
                        <TableCell key={col.id} className="text-right">
                          <span className={cn(totalOwnership !== 100 && 'text-destructive')}>
                            {formatPercentage(totalOwnership)}
                          </span>
                        </TableCell>
                      );
                    }
                    if (col.id === 'principalBalance') {
                      return <TableCell key={col.id} className="text-right">{formatCurrency(totalPrincipalBalance)}</TableCell>;
                    }
                    if (col.id === 'regularPayment') {
                      return <TableCell key={col.id} className="text-right">{formatCurrency(totalPayment)}</TableCell>;
                    }
                    // First two visible columns show "Totals:" label
                    if (idx === 0) {
                      return <TableCell key={col.id} className="text-right font-semibold">Totals:</TableCell>;
                    }
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
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="w-[70px] h-8">
              <SelectValue />
            </SelectTrigger>
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
          >
            First
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm">
            {currentPage}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages}
          >
            Last
          </Button>
        </div>
      </div>

      {/* Validation Messages */}
      {totalOwnership !== 100 && fundingRecords.length > 0 && (
        <p className="text-sm text-destructive">
          Total ownership must equal 100% (currently {formatPercentage(totalOwnership)})
        </p>
      )}

      {/* Add Funding Modal */}
      <AddFundingModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        loanNumber={loanNumber}
        borrowerName={borrowerName}
        onSubmit={onAddFunding}
      />

      {/* Funding History Dialog */}
      <FundingHistoryDialog
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        dealId={dealId}
        historyRecords={historyRecords}
      />
    </div>
  );
};

export default LoanFundingGrid;
