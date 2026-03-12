import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SortableTableHead from '@/components/deal/SortableTableHead';
import { type SortDirection } from '@/hooks/useGridSortFilter';

interface PortfolioRow {
  id: string; loanAccount: string; borrowerName: string; noteRate: string; lenderRate: string;
  regularPayment: string; principalBalance: string; nextPayment: string; maturityDate: string;
  termLeft: string; daysLate: string; percentOwned: string; propertyDescription: string;
}

const COLUMNS = [
  { id: 'loanAccount', label: 'Loan Account' },
  { id: 'borrowerName', label: 'Borrower Name' },
  { id: 'noteRate', label: 'Note Rate' },
  { id: 'lenderRate', label: 'Lender Rate' },
  { id: 'regularPayment', label: 'Regular Payment' },
  { id: 'principalBalance', label: 'Principal Balance' },
  { id: 'nextPayment', label: 'Next Payment' },
  { id: 'maturityDate', label: 'Maturity Date' },
  { id: 'termLeft', label: 'Term Left' },
  { id: 'daysLate', label: 'Days Late' },
  { id: 'percentOwned', label: '% Owned' },
  { id: 'propertyDescription', label: 'Property Description' },
];

const PAGE_SIZE = 20;

const LenderPortfolio: React.FC<{ lenderId: string }> = () => {
  const [rows] = useState<PortfolioRow[]>([]);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [page, setPage] = useState(0);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : sortDir === 'desc' ? null : 'asc');
      if (sortDir === 'desc') setSortCol(null);
    } else { setSortCol(col); setSortDir('asc'); }
  };

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)));
  }, [rows, search]);

  const sorted = useMemo(() => {
    if (!sortCol || !sortDir) return filtered;
    return [...filtered].sort((a, b) => {
      const av = (a as any)[sortCol] || '';
      const bv = (b as any)[sortCol] || '';
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [filtered, sortCol, sortDir]);

  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-foreground">Portfolio</h4>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 w-[200px]" />
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-x-auto">
        <Table className="min-w-[1400px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              {COLUMNS.map(c => (
                <SortableTableHead key={c.id} columnId={c.id} label={c.label} sortColumnId={sortCol} sortDirection={sortDir} onSort={handleSort} />
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMNS.length} className="text-center py-8 text-muted-foreground">
                  No portfolio records found.
                </TableCell>
              </TableRow>
            ) : paged.map(r => (
              <TableRow key={r.id}>
                {COLUMNS.map(c => <TableCell key={c.id}>{(r as any)[c.id] || '-'}</TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {sorted.length > PAGE_SIZE && (
        <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span>Page {page + 1} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  );
};

export default LenderPortfolio;
