import React from 'react';
import { Plus, Pencil } from 'lucide-react';
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

export interface LenderData {
  id: string;
  isPrimary: boolean;
  type: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  taxId: string;
}

interface LendersTableViewProps {
  lenders: LenderData[];
  onAddLender: () => void;
  onEditLender: (lender: LenderData) => void;
  onRowClick: (lender: LenderData) => void;
  onPrimaryChange: (lenderId: string, isPrimary: boolean) => void;
  disabled?: boolean;
  isLoading?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export const LendersTableView: React.FC<LendersTableViewProps> = ({
  lenders,
  onAddLender,
  onEditLender,
  onRowClick,
  onPrimaryChange,
  disabled = false,
  isLoading = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) => {
  const renderLoadingSkeleton = () => (
    <>
      {[1, 2, 3].map((i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-4" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-8 w-8" /></TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <div className="p-6 space-y-4">
      {/* Header with title and actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg text-foreground">Lenders</h3>
          <p className="text-sm text-muted-foreground">
            Manage lenders for this deal. One lender can be marked as primary.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
              <TableHead className="w-[80px]">PRIMARY</TableHead>
              <TableHead>TYPE</TableHead>
              <TableHead>FULL NAME</TableHead>
              <TableHead>FIRST NAME</TableHead>
              <TableHead>LAST NAME</TableHead>
              <TableHead>EMAIL</TableHead>
              <TableHead>PHONE</TableHead>
              <TableHead>CITY</TableHead>
              <TableHead>STATE</TableHead>
              <TableHead>TAX ID</TableHead>
              <TableHead className="w-[80px]">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              renderLoadingSkeleton()
            ) : lenders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
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
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={lender.isPrimary}
                      onCheckedChange={(checked) => onPrimaryChange(lender.id, !!checked)}
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell>{lender.type || '-'}</TableCell>
                  <TableCell className="font-medium">{lender.fullName || '-'}</TableCell>
                  <TableCell>{lender.firstName || '-'}</TableCell>
                  <TableCell>{lender.lastName || '-'}</TableCell>
                  <TableCell>{lender.email || '-'}</TableCell>
                  <TableCell>{lender.phone || '-'}</TableCell>
                  <TableCell>{lender.city || '-'}</TableCell>
                  <TableCell>{lender.state || '-'}</TableCell>
                  <TableCell>{lender.taxId || '-'}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditLender(lender)}
                      disabled={disabled}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
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
    </div>
  );
};

export default LendersTableView;
