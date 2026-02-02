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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

export interface BorrowerData {
  id: string;
  isPrimary: boolean;
  borrowerType: string;
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
  taxIdType: string;
  taxId: string;
  creditScore: string;
  capacity: string;
}

interface BorrowersTableViewProps {
  borrowers: BorrowerData[];
  onAddBorrower: () => void;
  onEditBorrower: (borrower: BorrowerData) => void;
  onRowClick: (borrower: BorrowerData) => void;
  onPrimaryChange: (borrowerId: string, isPrimary: boolean) => void;
  disabled?: boolean;
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const BorrowersTableView: React.FC<BorrowersTableViewProps> = ({
  borrowers,
  onAddBorrower,
  onEditBorrower,
  onRowClick,
  onPrimaryChange,
  disabled = false,
  isLoading = false,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const renderLoader = () => (
    <TableRow>
      <TableCell colSpan={10} className="py-4">
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
          <p className="text-sm text-muted-foreground">
            Manage borrowers for this deal. One borrower is marked as primary.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
              <TableHead className="w-[80px]">PRIMARY</TableHead>
              <TableHead>TYPE</TableHead>
              <TableHead>FULL NAME</TableHead>
              <TableHead>EMAIL</TableHead>
              <TableHead>PHONE</TableHead>
              <TableHead>CITY</TableHead>
              <TableHead>STATE</TableHead>
              <TableHead>CREDIT SCORE</TableHead>
              <TableHead>CAPACITY</TableHead>
              <TableHead className="w-[80px]">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              renderLoader()
            ) : borrowers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
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
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={borrower.isPrimary}
                      onCheckedChange={(checked) => onPrimaryChange(borrower.id, !!checked)}
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell>{borrower.borrowerType || '-'}</TableCell>
                  <TableCell className="font-medium">{borrower.fullName || `${borrower.firstName} ${borrower.lastName}`.trim() || '-'}</TableCell>
                  <TableCell>{borrower.email || '-'}</TableCell>
                  <TableCell>{borrower.phone || '-'}</TableCell>
                  <TableCell>{borrower.city || '-'}</TableCell>
                  <TableCell>{borrower.state || '-'}</TableCell>
                  <TableCell>{borrower.creditScore || '-'}</TableCell>
                  <TableCell>{borrower.capacity || '-'}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditBorrower(borrower)}
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
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => onPageChange(page)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Footer with totals */}
      {borrowers.length > 0 && (
        <div className="flex justify-end">
          <div className="text-sm text-muted-foreground">
            Total Borrowers: {borrowers.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default BorrowersTableView;
