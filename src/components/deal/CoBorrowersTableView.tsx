import React, { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';

export interface CoBorrowerData {
  id: string;
  fullName: string;
  firstName: string;
  middleName: string;
  lastName: string;
  salutation: string;
  generation: string;
  email: string;
  homePhone: string;
  homePhone2: string;
  workPhone: string;
  mobilePhone: string;
  fax: string;
  preferredHome: boolean;
  preferredHome2: boolean;
  preferredWork: boolean;
  preferredCell: boolean;
  preferredFax: boolean;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  primaryStreet: string;
  primaryCity: string;
  primaryState: string;
  primaryZip: string;
  mailingStreet: string;
  mailingCity: string;
  mailingState: string;
  mailingZip: string;
  mailingSameAsPrimary: boolean;
  loanNumber: string;
  tin: string;
  relation: string;
  type: string;
  borrowerId: string;
  borrowerType: string;
  capacity: string;
  creditScore: string;
  vesting: string;
  ford: string;
  ford1: string;
  ford2: string;
  ford3: string;
  ford4: string;
  ford5: string;
  ford6: string;
  ford7: string;
  ford8: string;
  taxIdType: string;
  issue1098: boolean;
  alternateReporting: boolean;
  deliveryOnline: boolean;
  deliveryMail: boolean;
  dob: string;
  creditReporting: boolean;
  resCode: string;
  addressIndicator: string;
  sendBorrowerNotifications: boolean;
  format: string;
  deliveryPrint: boolean;
  deliveryEmail: boolean;
  deliverySms: boolean;
  parentBorrowerPrefix: string;
}

interface CoBorrowersTableViewProps {
  coBorrowers: CoBorrowerData[];
  onAddCoBorrower: () => void;
  onEditCoBorrower: (coBorrower: CoBorrowerData) => void;
  onRowClick: (coBorrower: CoBorrowerData) => void;
  onDeleteCoBorrower?: (coBorrower: CoBorrowerData) => void;
  disabled?: boolean;
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const CoBorrowersTableView: React.FC<CoBorrowersTableViewProps> = ({
  coBorrowers,
  onAddCoBorrower,
  onEditCoBorrower,
  onRowClick,
  onDeleteCoBorrower,
  disabled = false,
  isLoading = false,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const [deleteTarget, setDeleteTarget] = useState<CoBorrowerData | null>(null);

  const renderLoader = () => (
    <TableRow>
      <TableCell colSpan={8} className="py-4">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4">
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
          <h3 className="font-semibold text-lg text-foreground">Co-Borrowers</h3>
          <p className="text-sm text-muted-foreground">
            Manage co-borrowers for this deal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onAddCoBorrower}
            disabled={disabled}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Co-Borrower
          </Button>
        </div>
      </div>

      {/* Co-Borrowers Table */}
      <div className="border border-border rounded-lg overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>TYPE</TableHead>
              <TableHead>FULL NAME</TableHead>
              <TableHead>RELATION</TableHead>
              <TableHead>EMAIL</TableHead>
              <TableHead>MOBILE PHONE</TableHead>
              <TableHead>CITY</TableHead>
              <TableHead>STATE</TableHead>
              <TableHead className="w-[80px]">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              renderLoader()
            ) : coBorrowers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No co-borrowers added. Click "Add Co-Borrower" to add one.
                </TableCell>
              </TableRow>
            ) : (
              coBorrowers.map((coBorrower) => (
                <TableRow
                  key={coBorrower.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => onRowClick(coBorrower)}
                >
                  <TableCell>{coBorrower.type || '-'}</TableCell>
                  <TableCell className="font-medium">{coBorrower.fullName || `${coBorrower.firstName} ${coBorrower.lastName}`.trim() || '-'}</TableCell>
                  <TableCell>{coBorrower.relation || '-'}</TableCell>
                  <TableCell>{coBorrower.email || '-'}</TableCell>
                  <TableCell>{coBorrower.mobilePhone || '-'}</TableCell>
                  <TableCell>{coBorrower.city || '-'}</TableCell>
                  <TableCell>{coBorrower.state || '-'}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditCoBorrower(coBorrower)}
                        disabled={disabled}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {onDeleteCoBorrower && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(coBorrower)}
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
      {coBorrowers.length > 0 && (
        <div className="flex justify-end">
          <div className="text-sm text-muted-foreground">
            Total Co-Borrowers: {coBorrowers.length}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={() => {
          if (deleteTarget && onDeleteCoBorrower) {
            onDeleteCoBorrower(deleteTarget);
          }
          setDeleteTarget(null);
        }}
        title="Delete Co-Borrower"
        description="Are you sure you want to delete this co-borrower? This action cannot be undone."
      />
    </div>
  );
};

export default CoBorrowersTableView;
