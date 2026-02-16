import React from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ColumnConfigPopover, ColumnConfig } from './ColumnConfigPopover';
import { useTableColumnConfig } from '@/hooks/useTableColumnConfig';

export interface ChargeData {
  id: string;
  description: string;
  unpaidBalance: string;
  owedTo: string;
  owedFrom: string;
  totalDue: string;
  interestFrom: string;
  dateOfCharge: string;
  interestRate: string;
  notes: string;
  reference: string;
  chargeType: string;
  deferred: string;
  originalAmount: string;
  account: string;
  borrowerFullName: string;
  advancedByAccount: string;
  advancedByLenderName: string;
  advancedByAmount: string;
  onBehalfOfAccount: string;
  onBehalfOfLenderName: string;
  onBehalfOfAmount: string;
  amountOwedByBorrower: string;
  accruedInterest: string;
  distributeBetweenAllLenders: string;
}

interface ChargesTableViewProps {
  charges: ChargeData[];
  onAddCharge: () => void;
  onEditCharge: (charge: ChargeData) => void;
  onRowClick: (charge: ChargeData) => void;
  onDeleteCharge?: (charge: ChargeData) => void;
  disabled?: boolean;
  isLoading?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'dateOfCharge', label: 'Date', visible: true },
  { id: 'reference', label: 'Reference', visible: true },
  { id: 'chargeType', label: 'Type', visible: true },
  { id: 'description', label: 'Description', visible: true },
  { id: 'interestRate', label: 'Interest Rate', visible: true },
  { id: 'interestFrom', label: 'Interest From', visible: true },
  { id: 'deferred', label: 'Deferred', visible: true },
  { id: 'owedTo', label: 'Owed To Account', visible: true },
  { id: 'originalAmount', label: 'Original Balance', visible: true },
  { id: 'unpaidBalance', label: 'Unpaid Balance', visible: true },
  { id: 'totalDue', label: 'Total Due', visible: true },
  { id: 'accruedInterest', label: 'Accrued Interest', visible: true },
];

export const ChargesTableView: React.FC<ChargesTableViewProps> = ({
  charges,
  onAddCharge,
  onEditCharge,
  onRowClick,
  onDeleteCharge,
  disabled = false,
  isLoading = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) => {
  const [columns, setColumns] = useTableColumnConfig('charges_v5', DEFAULT_COLUMNS);
  const visibleColumns = columns.filter((col) => col.visible);

  const parseCurrency = (value: string): number => {
    if (!value) return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'number' ? value : parseFloat(value as string);
    if (isNaN(num)) return '$0.00';
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const totals = {
    originalAmount: charges.reduce((sum, c) => sum + parseCurrency(c.originalAmount), 0),
    unpaidBalance: charges.reduce((sum, c) => sum + parseCurrency(c.unpaidBalance), 0),
    totalDue: charges.reduce((sum, c) => sum + parseCurrency(c.totalDue), 0),
    accruedInterest: charges.reduce((sum, c) => sum + parseCurrency(c.accruedInterest), 0),
  };

  const renderCellValue = (charge: ChargeData, columnId: string) => {
    switch (columnId) {
      case 'description':
        return <span className="font-medium">{charge.description || '-'}</span>;
      case 'unpaidBalance':
      case 'totalDue':
      case 'originalAmount':
      case 'accruedInterest':
      case 'amountOwedByBorrower':
        return formatCurrency(charge[columnId as keyof ChargeData] as string);
      case 'interestRate':
        return charge.interestRate ? `${charge.interestRate}%` : '-';
      default:
        return charge[columnId as keyof ChargeData] || '-';
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header with title and actions */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-foreground">Charges</h3>
        <div className="flex items-center gap-2">
          <ColumnConfigPopover
            columns={columns}
            onColumnsChange={setColumns}
            disabled={disabled}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={onAddCharge}
            disabled={disabled}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Charge
          </Button>
        </div>
      </div>

      {/* Charges Table */}
      <div className="border border-border rounded-lg overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              {visibleColumns.map((col) => (
                <TableHead key={col.id}>
                  {col.label.toUpperCase()}
                </TableHead>
              ))}
              <TableHead className="w-[80px]">ACTIONS</TableHead>
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
            ) : charges.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 1} className="text-center py-8 text-muted-foreground">
                  No charges added. Click "Add Charge" to add one.
                </TableCell>
              </TableRow>
            ) : (
              charges.map((charge) => (
                <TableRow
                  key={charge.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => onRowClick(charge)}
                >
                  {visibleColumns.map((col) => (
                    <TableCell key={col.id}>
                      {renderCellValue(charge, col.id)}
                    </TableCell>
                  ))}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditCharge(charge)}
                        disabled={disabled}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {onDeleteCharge && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteCharge(charge)}
                          disabled={disabled}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
            {charges.length > 0 && (
              <TableRow className="bg-muted/50 font-semibold border-t-2 border-border">
                {visibleColumns.map((col) => {
                  const totalKey = col.id as keyof typeof totals;
                  if (totalKey in totals) {
                    return (
                      <TableCell key={col.id}>
                        {formatCurrency(totals[totalKey])}
                      </TableCell>
                    );
                  }
                  return <TableCell key={col.id}>{col.id === visibleColumns[0]?.id ? 'TOTALS' : ''}</TableCell>;
                })}
                <TableCell />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage <= 1 || disabled}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage >= totalPages || disabled}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Footer with totals */}
      {charges.length > 0 && (
        <div className="flex justify-end">
          <div className="text-sm text-muted-foreground">
            Total Charges: {charges.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChargesTableView;
