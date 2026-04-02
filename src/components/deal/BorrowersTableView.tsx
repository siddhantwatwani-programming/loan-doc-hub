import React, { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { ColumnConfigPopover, ColumnConfig } from './ColumnConfigPopover';
import { useTableColumnConfig } from '@/hooks/useTableColumnConfig';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';

export interface BorrowerData {
  id: string;
  isPrimary: boolean;
  borrowerType: string;
  borrowerId: string;
  fullName: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  creditScore: string;
  capacity: string;
  homePhone: string;
  workPhone: string;
  mobilePhone: string;
  fax: string;
  preferredHome: boolean;
  preferredWork: boolean;
  preferredCell: boolean;
  preferredFax: boolean;
  primaryStreet: string;
  primaryCity: string;
  primaryState: string;
  primaryZip: string;
  mailingStreet: string;
  mailingCity: string;
  mailingState: string;
  mailingZip: string;
  mailingSameAsPrimary: boolean;
  vesting: string;
  ford1: string;
  ford2: string;
  ford3: string;
  ford4: string;
  ford5: string;
  ford6: string;
  ford7: string;
  ford8: string;
  issue1098: boolean;
  alternateReporting: boolean;
  deliveryOnline: boolean;
  deliveryMail: boolean;
  taxIdType?: string;
  tin?: string;
  tinVerified?: boolean;
  deliveryPrint?: boolean;
  deliveryEmail?: boolean;
  deliverySms?: boolean;
  sendPaymentNotification?: boolean;
  sendLateNotice?: boolean;
  sendBorrowerStatement?: boolean;
  sendMaturityNotice?: boolean;
}

interface BorrowersTableViewProps {
  borrowers: BorrowerData[];
  onAddBorrower: () => void;
  onEditBorrower: (borrower: BorrowerData) => void;
  onRowClick: (borrower: BorrowerData) => void;
  onPrimaryChange: (borrowerId: string, isPrimary: boolean) => void;
  onDeleteBorrower?: (borrower: BorrowerData) => void;
  disabled?: boolean;
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'primaryContact', label: 'Primary Contact', visible: true },
  { id: 'type', label: 'Type', visible: true },
  { id: 'fullName', label: 'Full Name', visible: true },
  { id: 'email', label: 'Email', visible: true },
  { id: 'phone', label: 'Phone', visible: true },
  { id: 'street', label: 'Street', visible: true },
  { id: 'city', label: 'City', visible: true },
  { id: 'state', label: 'State', visible: true },
  { id: 'zip', label: 'ZIP', visible: true },
  { id: 'actions', label: 'Actions', visible: true },
];

const BORROWERS_TABLE_ID = 'borrowers_v2';

export const BorrowersTableView: React.FC<BorrowersTableViewProps> = ({
  borrowers,
  onAddBorrower,
  onEditBorrower,
  onRowClick,
  onPrimaryChange,
  onDeleteBorrower,
  disabled = false,
  isLoading = false,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const [columns, setColumns, resetColumns] = useTableColumnConfig(BORROWERS_TABLE_ID, DEFAULT_COLUMNS);
  const [deleteTarget, setDeleteTarget] = useState<BorrowerData | null>(null);
  
  const visibleColumns = columns.filter((col) => col.visible);

  const renderCellContent = (borrower: BorrowerData, columnId: string) => {
    switch (columnId) {
      case 'primaryContact':
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={borrower.isPrimary}
              onCheckedChange={(checked) => onPrimaryChange(borrower.id, !!checked)}
              disabled={disabled}
            />
          </div>
        );
      case 'type':
        return borrower.borrowerType || '-';
      case 'fullName':
        return (
          <span className="font-medium">
            {borrower.fullName || `${borrower.firstName} ${borrower.lastName}`.trim() || '-'}
          </span>
        );
      case 'email':
        return borrower.email || '-';
      case 'phone':
        return borrower.mobilePhone || borrower.phone || '-';
      case 'street':
        return borrower.primaryStreet || borrower.street || '-';
      case 'city':
        return borrower.primaryCity || borrower.city || '-';
      case 'state':
        return borrower.primaryState || borrower.state || '-';
      case 'zip':
        return borrower.primaryZip || borrower.zipCode || '-';
      case 'actions':
        return (
          <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEditBorrower(borrower)}
              disabled={disabled}
              className="h-8 w-8"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {onDeleteBorrower && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteTarget(borrower)}
                disabled={disabled}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      default:
        return '-';
    }
  };

  const renderLoader = () => (
    <TableRow>
      <TableCell colSpan={visibleColumns.length} className="py-4">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="p-6 space-y-4">
      {/* Header with title and actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg text-foreground">Borrowers</h3>
        </div>
        <div className="flex items-center gap-2">
          <ColumnConfigPopover
            columns={columns}
            onColumnsChange={setColumns}
            onResetColumns={resetColumns}
            disabled={disabled}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={onAddBorrower}
            disabled={disabled}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Borrower
          </Button>
        </div>
      </div>

      {/* Borrowers Table */}
      <div className="border border-border rounded-lg overflow-x-auto">
        <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              {visibleColumns.map((column) => (
                <TableHead
                  key={column.id}
                  className={
                    column.id === 'primaryContact' || column.id === 'actions'
                      ? 'w-[80px]'
                      : undefined
                  }
                >
                  {column.label.toUpperCase()}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              renderLoader()
            ) : borrowers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="text-center py-8 text-muted-foreground"
                >
                  No borrowers added. Click "Add Borrower" to add one.
                </TableCell>
              </TableRow>
            ) : (
              borrowers.map((borrower) => (
                <TableRow
                  key={borrower.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => onRowClick(borrower)}
                >
                  {visibleColumns.map((column) => (
                    <TableCell key={column.id}>
                      {renderCellContent(borrower, column.id)}
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
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * 10 + 1}–{Math.min(currentPage * 10, borrowers.length)} of {borrowers.length} borrowers
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => onPageChange(1)} disabled={currentPage <= 1 || disabled}>First</Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1 || disabled}>Previous</Button>
            <span className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm">{currentPage}</span>
            <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages || disabled}>Next</Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange(totalPages)} disabled={currentPage >= totalPages || disabled}>Last</Button>
          </div>
        </div>
      )}

      {/* Footer with totals */}
      {borrowers.length > 0 && (
        <div className="flex justify-end">
          <div className="text-sm text-muted-foreground">
            Total Borrowers: {borrowers.length}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={() => {
          if (deleteTarget && onDeleteBorrower) {
            onDeleteBorrower(deleteTarget);
          }
          setDeleteTarget(null);
        }}
        title="Delete Borrower"
        description="Are you sure you want to delete this borrower? This action cannot be undone."
      />
    </div>
  );
};

export default BorrowersTableView;
