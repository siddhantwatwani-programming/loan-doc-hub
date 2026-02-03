import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FundingHistoryRecord {
  id: string;
  fundingDate: string;
  reference: string;
  lenderAccount: string;
  lenderName: string;
  amountFunded: number;
  notes: string;
}

interface FundingHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string;
}

export const FundingHistoryDialog: React.FC<FundingHistoryDialogProps> = ({
  open,
  onOpenChange,
  dealId,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [records, setRecords] = useState<FundingHistoryRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<FundingHistoryRecord | null>(null);

  // Simulated data fetch - in production, this would fetch from existing APIs
  useEffect(() => {
    if (open && dealId) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        // Sample data - would come from existing loan/property tables
        setRecords([
          {
            id: '1',
            fundingDate: '01/06/2014',
            reference: '0002174937',
            lenderAccount: 'MLP',
            lenderName: 'Mobile Loan Partners, LLC -',
            amountFunded: 18374.76,
            notes: 'No Funding History in SUG. Created default record',
          },
        ]);
        setTotalPages(1);
        setIsLoading(false);
      }, 500);
    }
  }, [open, dealId, currentPage, pageSize]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-primary">💾</span>
            Funding History
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Grid */}
          <div className="border rounded-lg overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">FUNDING DATE</TableHead>
                    <TableHead className="font-semibold">REFERENCE</TableHead>
                    <TableHead className="font-semibold">LENDER ACCOUNT</TableHead>
                    <TableHead className="font-semibold">LENDER NAME</TableHead>
                    <TableHead className="font-semibold text-right">AMOUNT FUNDED</TableHead>
                    <TableHead className="font-semibold">NOTES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No funding history records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record) => (
                      <TableRow
                        key={record.id}
                        className={cn(
                          'cursor-pointer hover:bg-primary/5',
                          selectedRecord?.id === record.id && 'bg-primary/10'
                        )}
                        onClick={() => setSelectedRecord(record)}
                      >
                        <TableCell>{record.fundingDate}</TableCell>
                        <TableCell>{record.reference}</TableCell>
                        <TableCell className="text-primary font-medium">
                          {record.lenderAccount}
                        </TableCell>
                        <TableCell>{record.lenderName}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(record.amountFunded)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={record.notes}>
                          {record.notes}
                        </TableCell>
                      </TableRow>
                    ))
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
                onValueChange={(value) => handlePageSizeChange(Number(value))}
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
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
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
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage >= totalPages}
              >
                Last
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FundingHistoryDialog;
