import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SortableTableHead from '@/components/deal/SortableTableHead';
import { type SortDirection } from '@/hooks/useGridSortFilter';

interface HistoryRow {
  id: string; date: string; account: string; reference: string; principal: string;
  interest: string; defaultInterest: string; lateFee: string; prepaymentPenalty: string;
  servicingFees: string; charges: string; chargesInterest: string; chargesReference: string;
  toTrust: string; fromTrust: string;
}

const COLUMNS = [
  { id: 'date', label: 'Date' }, { id: 'account', label: 'Account' },
  { id: 'reference', label: 'Reference' }, { id: 'principal', label: 'Principal' },
  { id: 'interest', label: 'Interest' }, { id: 'defaultInterest', label: 'Default Interest' },
  { id: 'lateFee', label: 'Late Fee' }, { id: 'prepaymentPenalty', label: 'Prepay Penalty' },
  { id: 'servicingFees', label: 'Servicing Fees' }, { id: 'charges', label: 'Charges' },
  { id: 'chargesInterest', label: 'Charges Interest' }, { id: 'chargesReference', label: 'Charges Ref' },
  { id: 'toTrust', label: 'To Trust' }, { id: 'fromTrust', label: 'From Trust' },
];

const BrokerHistory: React.FC<{ brokerId: string }> = () => {
  const [rows] = useState<HistoryRow[]>([]);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-foreground">History</h4>
        <div className="flex items-center gap-2">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="mtd">Month to Date</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="qtd">Quarter to Date</SelectItem>
              <SelectItem value="last_year">Last Year</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 w-[200px]" />
          </div>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-x-auto">
        <Table className="min-w-[1600px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              {COLUMNS.map(c => (
                <SortableTableHead key={c.id} columnId={c.id} label={c.label} sortColumnId={sortCol} sortDirection={sortDir} onSort={handleSort} />
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMNS.length} className="text-center py-8 text-muted-foreground">
                  No history records found.
                </TableCell>
              </TableRow>
            ) : filtered.map(r => (
              <TableRow key={r.id}>
                {COLUMNS.map(c => <TableCell key={c.id}>{(r as any)[c.id] || '-'}</TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default BrokerHistory;
