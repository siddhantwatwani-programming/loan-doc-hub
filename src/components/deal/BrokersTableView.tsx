import React from 'react';
import { Plus, Pencil } from 'lucide-react';
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

export interface BrokerData {
  id: string;
  brokerId: string;
  license: string;
  company: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  phoneWork: string;
  phoneCell: string;
}

interface BrokersTableViewProps {
  brokers: BrokerData[];
  onAddBroker: () => void;
  onEditBroker: (broker: BrokerData) => void;
  onRowClick: (broker: BrokerData) => void;
  disabled?: boolean;
  isLoading?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'brokerId', label: 'Broker ID', visible: true },
  { id: 'license', label: 'License', visible: true },
  { id: 'company', label: 'Company', visible: true },
  { id: 'name', label: 'Name', visible: true },
  { id: 'email', label: 'Email', visible: true },
  { id: 'address', label: 'Address', visible: true },
  { id: 'phoneWork', label: 'Work Phone', visible: true },
  { id: 'phoneCell', label: 'Cell Phone', visible: true },
];

export const BrokersTableView: React.FC<BrokersTableViewProps> = ({
  brokers,
  onAddBroker,
  onEditBroker,
  onRowClick,
  disabled = false,
  isLoading = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) => {
  const [columns, setColumns] = useTableColumnConfig('brokers', DEFAULT_COLUMNS);
  const visibleColumns = columns.filter((col) => col.visible);

  const getFullName = (broker: BrokerData): string => {
    const parts = [broker.firstName, broker.middleName, broker.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : '-';
  };

  const getAddress = (broker: BrokerData): string => {
    const parts = [broker.street, broker.city, broker.state, broker.zip].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '-';
  };

  const renderCellValue = (broker: BrokerData, columnId: string) => {
    switch (columnId) {
      case 'brokerId':
        return <span className="font-medium">{broker.brokerId || '-'}</span>;
      case 'license':
        return broker.license || '-';
      case 'company':
        return broker.company || '-';
      case 'name':
        return getFullName(broker);
      case 'email':
        return broker.email || '-';
      case 'address':
        return <span className="max-w-[200px] truncate block">{getAddress(broker)}</span>;
      case 'phoneWork':
        return broker.phoneWork || '-';
      case 'phoneCell':
        return broker.phoneCell || '-';
      default:
        return '-';
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header with title and actions */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-foreground">Brokers</h3>
        <div className="flex items-center gap-2">
          <ColumnConfigPopover
            columns={columns}
            onColumnsChange={setColumns}
            disabled={disabled}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={onAddBroker}
            disabled={disabled}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Broker
          </Button>
        </div>
      </div>

      {/* Brokers Table */}
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
              // Loading skeleton
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {Array.from({ length: visibleColumns.length + 1 }).map((_, cellIndex) => (
                    <TableCell key={`skeleton-cell-${cellIndex}`}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : brokers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 1} className="text-center py-8 text-muted-foreground">
                  No brokers added. Click "Add Broker" to add one.
                </TableCell>
              </TableRow>
            ) : (
              brokers.map((broker) => (
                <TableRow
                  key={broker.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => onRowClick(broker)}
                >
                  {visibleColumns.map((col) => (
                    <TableCell key={col.id}>
                      {renderCellValue(broker, col.id)}
                    </TableCell>
                  ))}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditBroker(broker)}
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
      {brokers.length > 0 && (
        <div className="flex justify-end">
          <div className="text-sm text-muted-foreground">
            Total Brokers: {brokers.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default BrokersTableView;
