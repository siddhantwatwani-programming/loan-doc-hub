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
import { ColumnConfigPopover, ColumnConfig } from './ColumnConfigPopover';
import { useTableColumnConfig } from '@/hooks/useTableColumnConfig';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';

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

export const LendersTableView: React.FC<LendersTableViewProps> = ({
  lenders,
  onAddLender,
  onEditLender,
  onRowClick,
  onPrimaryChange,
  onDeleteLender,
  disabled = false,
  isLoading = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) => {
  const [columns, setColumns] = useTableColumnConfig('lenders_v2', DEFAULT_COLUMNS);
  const [deleteTarget, setDeleteTarget] = useState<LenderData | null>(null);
  const visibleColumns = columns.filter((col) => col.visible);

  const renderCellValue = (lender: LenderData, columnId: string) => {
    switch (columnId) {
      case 'isPrimary':
        return (
          <Checkbox
            checked={lender.isPrimary}
            onCheckedChange={(checked) => onPrimaryChange(lender.id, !!checked)}
            disabled={disabled}
          />
        );
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
          {visibleColumns.map((col) => (
            <TableCell key={col.id}><Skeleton className="h-4 w-20" /></TableCell>
          ))}
          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <div className="p-6 space-y-4">
      {/* Header with title and actions */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-foreground">Lenders</h3>
        <div className="flex items-center gap-2">
          <ColumnConfigPopover
            columns={columns}
            onColumnsChange={setColumns}
            disabled={disabled}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={onAddLender}
            disabled={disabled}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Lender
          </Button>
        </div>
      </div>

      {/* Lenders Table */}
      <div className="border border-border rounded-lg overflow-x-auto">
        <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              {visibleColumns.map((col) => (
                <TableHead key={col.id} className={col.id === 'isPrimary' ? 'w-[80px]' : undefined}>
                  {col.label.toUpperCase()}
                </TableHead>
              ))}
              <TableHead className="w-[80px]">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              renderLoadingSkeleton()
            ) : lenders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 1} className="text-center py-8 text-muted-foreground">
                  No lenders added. Click "Add Lender" to add one.
                </TableCell>
              </TableRow>
            ) : (
              lenders.map((lender) => (
                <TableRow
                  key={lender.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => onRowClick(lender)}
                >
                  {visibleColumns.map((col) => (
                    <TableCell
                      key={col.id}
                      onClick={col.id === 'isPrimary' ? (e) => e.stopPropagation() : undefined}
                    >
                      {renderCellValue(lender, col.id)}
                    </TableCell>
                  ))}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditLender(lender)}
                        disabled={disabled}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {onDeleteLender && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(lender)}
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
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage <= 1 || isLoading}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage >= totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      )}

      {/* Footer with count */}
      {lenders.length > 0 && (
        <div className="flex justify-end">
          <div className="text-sm text-muted-foreground">
            Total Lenders: {lenders.length}
          </div>
        </div>
      )}
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={() => {
          if (deleteTarget && onDeleteLender) {
            onDeleteLender(deleteTarget);
          }
          setDeleteTarget(null);
        }}
        title="Delete Lender"
        description="Are you sure you want to delete this lender? This action cannot be undone."
      />
    </div>
  );
};

export default LendersTableView;
