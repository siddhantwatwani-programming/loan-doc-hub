import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit, ArrowLeft } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
}

interface LiensTableViewProps {
  liens: LienData[];
  onAddLien: () => void;
  onEditLien: (lien: LienData) => void;
  onRowClick: (lien: LienData) => void;
  onBack?: () => void;
  disabled?: boolean;
}

export const LiensTableView: React.FC<LiensTableViewProps> = ({
  liens,
  onAddLien,
  onEditLien,
  onRowClick,
  onBack,
  disabled = false,
}) => {
  const formatCurrency = (value: string) => {
    if (!value) return '';
    const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-1 h-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          <h3 className="text-lg font-semibold text-foreground">Liens</h3>
        </div>
        <Button
          size="sm"
          onClick={onAddLien}
          disabled={disabled}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Lien
        </Button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto" style={{ minWidth: '100%' }}>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="min-w-[120px]">Related Property</TableHead>
                <TableHead className="min-w-[100px]">Lien Holder</TableHead>
                <TableHead className="min-w-[100px]">Loan Type</TableHead>
                <TableHead className="min-w-[80px]">Priority Now</TableHead>
                <TableHead className="min-w-[80px]">Priority After</TableHead>
                <TableHead className="min-w-[100px]">Interest Rate</TableHead>
                <TableHead className="min-w-[120px] text-right">Original Balance</TableHead>
                <TableHead className="min-w-[120px] text-right">Balance After</TableHead>
                <TableHead className="min-w-[120px] text-right">Regular Payment</TableHead>
                <TableHead className="min-w-[100px]">Recording Number</TableHead>
                <TableHead className="min-w-[100px]">Last Verified</TableHead>
                <TableHead className="w-10">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {liens.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                    No liens added. Click "Add Lien" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                liens.map((lien) => (
                  <TableRow
                    key={lien.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onRowClick(lien)}
                  >
                    <TableCell className="font-medium">
                      {lien.property || 'Unassigned'}
                    </TableCell>
                    <TableCell>{lien.holder || '-'}</TableCell>
                    <TableCell>{lien.loanType || '-'}</TableCell>
                    <TableCell>{lien.lienPriorityNow || '-'}</TableCell>
                    <TableCell>{lien.lienPriorityAfter || '-'}</TableCell>
                    <TableCell>{lien.interestRate ? `${lien.interestRate}%` : '-'}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(lien.originalBalance) || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(lien.balanceAfter) || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(lien.regularPayment) || '-'}
                    </TableCell>
                    <TableCell>{lien.recordingNumber || '-'}</TableCell>
                    <TableCell>{lien.lastVerified || '-'}</TableCell>
                    <TableCell className="w-10">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditLien(lien);
                        }}
                        disabled={disabled}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default LiensTableView;
