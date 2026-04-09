import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';
import { GridToolbar } from './GridToolbar';
import { GridExportDialog, ExportColumn } from './GridExportDialog';
import { SortableTableHead } from './SortableTableHead';
import { useGridSortFilter } from '@/hooks/useGridSortFilter';
import { format } from 'date-fns';

interface LoanHistoryViewerProps {
  dealId: string;
  disabled?: boolean;
}

interface LoanHistoryEntry {
  id: string;
  deal_id: string;
  date_received: string | null;
  date_due: string | null;
  reference: string | null;
  payment_code: string | null;
  total_amount_received: number;
  applied_to_interest: number;
  applied_to_principal: number;
  applied_to_late_charges: number;
  applied_to_reserve: number;
  applied_to_impound: number;
  prepayment_penalty: number;
  charges_principal: number;
  charges_interest: number;
  fees_paid_to_broker: number;
  fees_paid_to_lenders: number;
  created_at: string;
}

const formatCurrency = (val: number | null | undefined): string => {
  const num = val ?? 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
};

const formatDate = (val: string | null): string => {
  if (!val) return '—';
  try {
    return format(new Date(val), 'M/d/yyyy');
  } catch {
    return val;
  }
};

const SEARCH_FIELDS = ['reference', 'payment_code', 'date_received', 'date_due'];

const EXPORT_COLUMNS: ExportColumn[] = [
  { id: 'date_received', label: 'Date Received' },
  { id: 'date_due', label: 'Date Due' },
  { id: 'reference', label: 'Reference' },
  { id: 'payment_code', label: 'Payment Code' },
  { id: 'total_amount_received', label: 'Total Amount Received' },
  { id: 'applied_to_interest', label: 'Applied To Interest' },
  { id: 'applied_to_principal', label: 'Applied To Principal' },
  { id: 'applied_to_late_charges', label: 'Applied To Late Charges' },
  { id: 'applied_to_reserve', label: 'Applied To Reserve' },
  { id: 'applied_to_impound', label: 'Applied To Impound' },
  { id: 'prepayment_penalty', label: 'Prepayment Penalty' },
  { id: 'charges_principal', label: 'Charges Principal' },
  { id: 'charges_interest', label: 'Charges Interest' },
  { id: 'fees_paid_to_broker', label: 'Fees Paid To Broker' },
  { id: 'fees_paid_to_lenders', label: 'Fees Paid To Lenders' },
];

const PAGE_SIZE = 25;

export const LoanHistoryViewer: React.FC<LoanHistoryViewerProps> = ({ dealId, disabled = false }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [exportOpen, setExportOpen] = useState(false);

  const { data: paginatedResult, isLoading } = useQuery({
    queryKey: ['loan-history', dealId, currentPage],
    enabled: !!dealId,
    queryFn: async () => {
      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from('loan_history')
        .select('*', { count: 'exact' })
        .eq('deal_id', dealId)
        .order('date_received', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { entries: (data || []) as LoanHistoryEntry[], totalCount: count || 0 };
    },
  });

  const { data: allEntries } = useQuery({
    queryKey: ['loan-history-all', dealId],
    enabled: !!dealId && exportOpen,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loan_history')
        .select('*')
        .eq('deal_id', dealId)
        .order('date_received', { ascending: false });

      if (error) throw error;
      return (data || []) as LoanHistoryEntry[];
    },
  });

  const entries = paginatedResult?.entries || [];
  const totalCount = paginatedResult?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const {
    searchQuery, setSearchQuery, sortState, toggleSort, filteredData,
  } = useGridSortFilter(entries, SEARCH_FIELDS);

  if (isLoading && currentPage === 1) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-muted-foreground">Loading loan history…</p>
      </div>
    );
  }

  if (totalCount === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Loan History</h3>
          <p className="text-muted-foreground">No payment history recorded yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GridToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterOptions={[]}
        activeFilters={{}}
        onFilterChange={() => {}}
        onClearFilters={() => {}}
        activeFilterCount={0}
        disabled={disabled}
        onExport={() => setExportOpen(true)}
      />

      <div className="relative w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead columnId="date_received" label="Date Received" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="w-[110px]" />
              <SortableTableHead columnId="date_due" label="Date Due" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="w-[100px]" />
              <SortableTableHead columnId="reference" label="Reference" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="w-[100px]" />
              <SortableTableHead columnId="payment_code" label="Payment Code" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="w-[110px]" />
              <SortableTableHead columnId="total_amount_received" label="Total Amount Received" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="w-[140px] text-right" />
              <SortableTableHead columnId="applied_to_interest" label="Applied To Interest" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="w-[130px] text-right" />
              <SortableTableHead columnId="applied_to_principal" label="Applied To Principal" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="w-[130px] text-right" />
              <SortableTableHead columnId="applied_to_late_charges" label="Applied To Late Charges" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="w-[140px] text-right" />
              <SortableTableHead columnId="applied_to_reserve" label="Applied To Reserve" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="w-[130px] text-right" />
              <SortableTableHead columnId="applied_to_impound" label="Applied To Impound" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="w-[130px] text-right" />
              <SortableTableHead columnId="prepayment_penalty" label="Prepayment Penalty" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="w-[130px] text-right" />
              <SortableTableHead columnId="charges_principal" label="Charges Principal" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="w-[130px] text-right" />
              <SortableTableHead columnId="charges_interest" label="Charges Interest" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="w-[120px] text-right" />
              <SortableTableHead columnId="fees_paid_to_broker" label="Fees Paid To Broker" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="w-[130px] text-right" />
              <SortableTableHead columnId="fees_paid_to_lenders" label="Fees Paid To Lenders" sortColumnId={sortState.columnId} sortDirection={sortState.direction} onSort={toggleSort} className="w-[130px] text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={15} className="text-center py-8 text-muted-foreground">
                  {isLoading ? 'Loading…' : 'No records match your search.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-sm">{formatDate(entry.date_received)}</TableCell>
                  <TableCell className="text-sm">{formatDate(entry.date_due)}</TableCell>
                  <TableCell className="text-sm font-mono">{entry.reference || '—'}</TableCell>
                  <TableCell className="text-sm">{entry.payment_code || '—'}</TableCell>
                  <TableCell className="text-sm text-right font-mono">{formatCurrency(entry.total_amount_received)}</TableCell>
                  <TableCell className="text-sm text-right font-mono">{formatCurrency(entry.applied_to_interest)}</TableCell>
                  <TableCell className="text-sm text-right font-mono">{formatCurrency(entry.applied_to_principal)}</TableCell>
                  <TableCell className="text-sm text-right font-mono">{formatCurrency(entry.applied_to_late_charges)}</TableCell>
                  <TableCell className="text-sm text-right font-mono">{formatCurrency(entry.applied_to_reserve)}</TableCell>
                  <TableCell className="text-sm text-right font-mono">{formatCurrency(entry.applied_to_impound)}</TableCell>
                  <TableCell className="text-sm text-right font-mono">{formatCurrency(entry.prepayment_penalty)}</TableCell>
                  <TableCell className="text-sm text-right font-mono">{formatCurrency(entry.charges_principal)}</TableCell>
                  <TableCell className="text-sm text-right font-mono">{formatCurrency(entry.charges_interest)}</TableCell>
                  <TableCell className="text-sm text-right font-mono">{formatCurrency(entry.fees_paid_to_broker)}</TableCell>
                  <TableCell className="text-sm text-right font-mono">{formatCurrency(entry.fees_paid_to_lenders)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {totalCount > 0 && (
            <>
              Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount} records
            </>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage <= 1 || isLoading}>First</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage <= 1 || isLoading}>Previous</Button>
            <span className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm">{currentPage}</span>
            <span className="text-sm text-muted-foreground">of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage >= totalPages || isLoading}>Next</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages || isLoading}>Last</Button>
          </div>
        )}
      </div>

      <GridExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        columns={EXPORT_COLUMNS}
        data={allEntries || []}
        fileName="loan_history"
      />
    </div>
  );
};
