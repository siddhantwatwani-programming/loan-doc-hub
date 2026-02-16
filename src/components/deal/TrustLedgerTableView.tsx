import React, { useState, useMemo } from 'react';
import { Plus, Pencil, Download, Search, DollarSign, FileText, ArrowRightLeft, Ban, CheckSquare, Building, RefreshCw, FileCheck, Trash2 } from 'lucide-react';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tabs, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { ColumnConfigPopover, ColumnConfig } from './ColumnConfigPopover';
import { useTableColumnConfig } from '@/hooks/useTableColumnConfig';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface TrustLedgerEntry {
  id: string;
  date: string;
  reference: string;
  fromWhomReceivedPaid: string;
  memo: string;
  payment: string;
  clr: string;
  deposit: string;
  balance: string;
  category: 'all' | 'reserve' | 'impound';
}

interface TrustLedgerTableViewProps {
  entries: TrustLedgerEntry[];
  onAddEntry: () => void;
  onEditEntry: (entry: TrustLedgerEntry) => void;
  onRowClick: (entry: TrustLedgerEntry) => void;
  onDeleteEntry?: (entry: TrustLedgerEntry) => void;
  onExport?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'date', label: 'Date', visible: true },
  { id: 'reference', label: 'Reference', visible: true },
  { id: 'fromWhomReceivedPaid', label: 'From Whom Received / Paid', visible: true },
  { id: 'memo', label: 'Memo', visible: true },
  { id: 'payment', label: 'Payment', visible: true },
  { id: 'clr', label: 'CLR', visible: true },
  { id: 'deposit', label: 'Deposit', visible: true },
  { id: 'balance', label: 'Balance', visible: true },
];

const DATE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Dates' },
  { value: 'quarter_to_date', label: 'Quarter To Date' },
  { value: 'year_to_date', label: 'Year To Date' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'last_6_months', label: 'Last 6 Months' },
  { value: 'last_9_months', label: 'Last 9 Months' },
  { value: 'last_12_months', label: 'Last 12 Months' },
  { value: 'last_24_months', label: 'Last 24 Months' },
  { value: 'last_36_months', label: 'Last 36 Months' },
  { value: 'last_48_months', label: 'Last 48 Months' },
  { value: 'last_60_months', label: 'Last 60 Months' },
  { value: 'last_year', label: 'Last Year' },
];

const formatCurrency = (val: string) => {
  if (!val) return '';
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  const isNeg = num < 0;
  const formatted = `$${Math.abs(num).toFixed(2)}`;
  return isNeg ? `(${formatted})` : formatted;
};

const filterByDate = (entries: TrustLedgerEntry[], filter: string): TrustLedgerEntry[] => {
  if (filter === 'all') return entries;
  const now = new Date();
  let cutoff: Date;
  switch (filter) {
    case 'quarter_to_date': {
      const q = Math.floor(now.getMonth() / 3) * 3;
      cutoff = new Date(now.getFullYear(), q, 1);
      break;
    }
    case 'year_to_date': cutoff = new Date(now.getFullYear(), 0, 1); break;
    case 'last_3_months': cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()); break;
    case 'last_6_months': cutoff = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()); break;
    case 'last_9_months': cutoff = new Date(now.getFullYear(), now.getMonth() - 9, now.getDate()); break;
    case 'last_12_months': cutoff = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate()); break;
    case 'last_24_months': cutoff = new Date(now.getFullYear(), now.getMonth() - 24, now.getDate()); break;
    case 'last_36_months': cutoff = new Date(now.getFullYear(), now.getMonth() - 36, now.getDate()); break;
    case 'last_48_months': cutoff = new Date(now.getFullYear(), now.getMonth() - 48, now.getDate()); break;
    case 'last_60_months': cutoff = new Date(now.getFullYear(), now.getMonth() - 60, now.getDate()); break;
    case 'last_year': cutoff = new Date(now.getFullYear() - 1, 0, 1); break;
    default: return entries;
  }
  return entries.filter(e => {
    if (!e.date) return false;
    return new Date(e.date) >= cutoff;
  });
};

export const TrustLedgerTableView: React.FC<TrustLedgerTableViewProps> = ({
  entries, onAddEntry, onEditEntry, onRowClick, onDeleteEntry, onExport, disabled = false, isLoading = false,
}) => {
  const [columns, setColumns] = useTableColumnConfig('trust_ledger', DEFAULT_COLUMNS);
  const visibleColumns = columns.filter((col) => col.visible);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<TrustLedgerEntry | null>(null);

  const filteredEntries = useMemo(() => {
    let result = entries;
    // Tab filter
    if (activeTab !== 'all') {
      result = result.filter(e => e.category === activeTab);
    }
    // Date filter
    result = filterByDate(result, dateFilter);
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.reference.toLowerCase().includes(q) ||
        e.fromWhomReceivedPaid.toLowerCase().includes(q) ||
        e.memo.toLowerCase().includes(q) ||
        e.date.toLowerCase().includes(q)
      );
    }
    return result;
  }, [entries, activeTab, dateFilter, searchQuery]);

  const renderCellValue = (entry: TrustLedgerEntry, columnId: string) => {
    switch (columnId) {
      case 'date': return entry.date || '-';
      case 'reference': return entry.reference || '-';
      case 'fromWhomReceivedPaid': return entry.fromWhomReceivedPaid || '-';
      case 'memo': return entry.memo || '-';
      case 'payment': return formatCurrency(entry.payment) || '-';
      case 'clr': return entry.clr || '-';
      case 'deposit': return formatCurrency(entry.deposit) || '-';
      case 'balance': return formatCurrency(entry.balance) || '-';
      default: return '-';
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Title */}
      <h3 className="font-semibold text-lg text-foreground">Trust Ledger</h3>

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <TooltipProvider>
            {/* 1 - Delete */}
            <Tooltip><TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={disabled}><Ban className="h-4 w-4" /></Button>
            </TooltipTrigger><TooltipContent>Void Transaction</TooltipContent></Tooltip>

            {/* 3 - Enter Deposit */}
            <DropdownMenu>
              <Tooltip><TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={disabled}><DollarSign className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
              </TooltipTrigger><TooltipContent>Transactions</TooltipContent></Tooltip>
              <DropdownMenuContent align="start">
                <DropdownMenuItem><DollarSign className="h-4 w-4 mr-2" />Enter Deposit</DropdownMenuItem>
                <DropdownMenuItem><FileText className="h-4 w-4 mr-2" />Enter Check</DropdownMenuItem>
                <DropdownMenuItem><RefreshCw className="h-4 w-4 mr-2" />Enter Adjustment</DropdownMenuItem>
                <DropdownMenuItem><ArrowRightLeft className="h-4 w-4 mr-2" />Transfer Funds</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem><Ban className="h-4 w-4 mr-2" />Void Transaction</DropdownMenuItem>
                <DropdownMenuItem><CheckSquare className="h-4 w-4 mr-2" />Clear Status</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 4 - Info */}
            <Tooltip><TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={disabled}><FileText className="h-4 w-4" /></Button>
            </TooltipTrigger><TooltipContent>Info</TooltipContent></Tooltip>

            {/* 5 - Group deposits / Bank */}
            <DropdownMenu>
              <Tooltip><TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={disabled}><Building className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
              </TooltipTrigger><TooltipContent>Banking</TooltipContent></Tooltip>
              <DropdownMenuContent align="start">
                <DropdownMenuItem><Building className="h-4 w-4 mr-2" />Make Bank Deposit</DropdownMenuItem>
                <DropdownMenuItem><RefreshCw className="h-4 w-4 mr-2" />Reconcile Bank Account</DropdownMenuItem>
                <DropdownMenuItem><FileCheck className="h-4 w-4 mr-2" />Create Positive Pay File</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 7 - Select & Print */}
            <Tooltip><TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={disabled}><FileCheck className="h-4 w-4" /></Button>
            </TooltipTrigger><TooltipContent>Select & Print Checks</TooltipContent></Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-2">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_FILTER_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-8 w-[150px] pl-7 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-8">
            <TabsTrigger value="all" className="text-xs px-3 py-1">All Transactions</TabsTrigger>
            <TabsTrigger value="reserve" className="text-xs px-3 py-1">Reserve</TabsTrigger>
            <TabsTrigger value="impound" className="text-xs px-3 py-1">Impound</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <ColumnConfigPopover columns={columns} onColumnsChange={setColumns} disabled={disabled} />
          <Button variant="outline" size="sm" onClick={onAddEntry} disabled={disabled} className="gap-1 text-xs">
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              {visibleColumns.map((col) => (
                <TableHead key={col.id} className="text-xs">{col.label.toUpperCase()}</TableHead>
              ))}
              <TableHead className="w-[60px] text-xs">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {Array.from({ length: visibleColumns.length + 1 }).map((_, ci) => (
                    <TableCell key={`sc-${ci}`}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 1} className="text-center py-8 text-muted-foreground">
                  No entries found. Click "Add Entry" to add one.
                </TableCell>
              </TableRow>
            ) : (
              filteredEntries.map((entry, idx) => (
                <TableRow
                  key={entry.id}
                  className={`cursor-pointer hover:bg-muted/30 ${idx === 0 ? 'bg-accent/20' : ''}`}
                  onClick={() => onRowClick(entry)}
                >
                  {visibleColumns.map((col) => (
                    <TableCell key={col.id} className="text-xs py-2">{renderCellValue(entry, col.id)}</TableCell>
                  ))}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => onEditEntry(entry)} disabled={disabled} className="h-7 w-7">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {onDeleteEntry && (
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(entry)} disabled={disabled} className="h-7 w-7 text-destructive hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* Footer */}
      {filteredEntries.length > 0 && (
        <div className="flex justify-end">
          <div className="text-sm text-muted-foreground">Total Entries: {filteredEntries.length}</div>
        </div>
      )}
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={() => {
          if (deleteTarget && onDeleteEntry) {
            onDeleteEntry(deleteTarget);
          }
          setDeleteTarget(null);
        }}
        title="Delete Entry"
        description="Are you sure you want to delete this trust ledger entry? This action cannot be undone."
      />
    </div>
  );
};

export default TrustLedgerTableView;
