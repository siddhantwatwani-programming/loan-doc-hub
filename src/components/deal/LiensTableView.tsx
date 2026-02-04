import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit } from 'lucide-react';
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
  originalBalance: string;
  currentBalance: string;
  regularPayment: string;
  lastChecked: string;
  note: string;
}

interface LiensTableViewProps {
  liens: LienData[];
  onAddLien: () => void;
  onEditLien: (lien: LienData) => void;
  onRowClick: (lien: LienData) => void;
  disabled?: boolean;
}

export const LiensTableView: React.FC<LiensTableViewProps> = ({
  liens,
  onAddLien,
  onEditLien,
  onRowClick,
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
        <h3 className="text-lg font-semibold text-foreground">Liens</h3>
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
                <TableHead className="w-10"></TableHead>
                <TableHead className="min-w-[120px]">Property</TableHead>
                <TableHead className="min-w-[80px]">Priority</TableHead>
                <TableHead className="min-w-[150px]">Lien Holder</TableHead>
                <TableHead className="min-w-[120px]">Account</TableHead>
                <TableHead className="min-w-[120px] text-right">Original Balance</TableHead>
                <TableHead className="min-w-[120px] text-right">Current Balance</TableHead>
                <TableHead className="min-w-[100px]">Last Checked</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {liens.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                    <TableCell className="font-medium">
                      {lien.property || 'Unassigned'}
                    </TableCell>
                    <TableCell>{lien.priority || '-'}</TableCell>
                    <TableCell>{lien.holder || '-'}</TableCell>
                    <TableCell>{lien.account || '-'}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(lien.originalBalance) || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(lien.currentBalance) || '-'}
                    </TableCell>
                    <TableCell>{lien.lastChecked || '-'}</TableCell>
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
