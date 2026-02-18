import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit, ArrowLeft, Trash2 } from 'lucide-react';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface InsuranceData {
  id: string;
  property: string;
  description: string;
  insuredName: string;
  companyName: string;
  policyNumber: string;
  expiration: string;
  coverage: string;
  active: boolean;
  agentName: string;
  businessAddress: string;
  businessAddressCity: string;
  businessAddressState: string;
  businessAddressZip: string;
  phoneNumber: string;
  faxNumber: string;
  email: string;
  note: string;
  paymentMailingStreet: string;
  paymentMailingCity: string;
  paymentMailingState: string;
  paymentMailingZip: string;
  insuranceTracking: boolean;
  lastVerified: string;
  trackingStatus: string;
}

interface InsuranceTableViewProps {
  insurances: InsuranceData[];
  onAddInsurance: () => void;
  onEditInsurance: (insurance: InsuranceData) => void;
  onRowClick: (insurance: InsuranceData) => void;
  onDeleteInsurance?: (insurance: InsuranceData) => void;
  onBack?: () => void;
  disabled?: boolean;
}

export const InsuranceTableView: React.FC<InsuranceTableViewProps> = ({
  insurances,
  onAddInsurance,
  onEditInsurance,
  onRowClick,
  onDeleteInsurance,
  onBack,
  disabled = false,
}) => {
  const [deleteTarget, setDeleteTarget] = useState<InsuranceData | null>(null);

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
          <h3 className="text-lg font-semibold text-foreground">Insurance</h3>
        </div>
        <Button
          size="sm"
          onClick={onAddInsurance}
          disabled={disabled}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Insurance
        </Button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto" style={{ minWidth: '100%' }}>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-10"></TableHead>
                <TableHead className="min-w-[120px]">Description</TableHead>
                <TableHead className="min-w-[150px]">Company</TableHead>
                <TableHead className="min-w-[120px]">Policy #</TableHead>
                <TableHead className="min-w-[100px]">Expiration</TableHead>
                <TableHead className="min-w-[120px] text-right">Coverage</TableHead>
                <TableHead className="min-w-[80px]">Status</TableHead>
                <TableHead className="min-w-[150px]">Agent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {insurances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No insurance records added. Click "Add Insurance" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                insurances.map((insurance) => (
                  <TableRow
                    key={insurance.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onRowClick(insurance)}
                  >
                    <TableCell className="w-10">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditInsurance(insurance);
                          }}
                          disabled={disabled}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {onDeleteInsurance && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(insurance);
                            }}
                            disabled={disabled}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {insurance.description || '-'}
                    </TableCell>
                    <TableCell>{insurance.companyName || '-'}</TableCell>
                    <TableCell>{insurance.policyNumber || '-'}</TableCell>
                    <TableCell>{insurance.expiration || '-'}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(insurance.coverage) || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={insurance.active ? 'default' : 'secondary'}>
                        {insurance.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{insurance.agentName || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={() => {
          if (deleteTarget && onDeleteInsurance) {
            onDeleteInsurance(deleteTarget);
          }
          setDeleteTarget(null);
        }}
        title="Delete Insurance"
        description="Are you sure you want to delete this insurance record? This action cannot be undone."
      />
    </div>
  );
};

export default InsuranceTableView;
