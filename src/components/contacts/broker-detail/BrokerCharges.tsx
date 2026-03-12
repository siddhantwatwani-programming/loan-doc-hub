import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SortableTableHead from '@/components/deal/SortableTableHead';
import { type SortDirection } from '@/hooks/useGridSortFilter';

interface ChargeRow {
  id: string;
  date: string;
  description: string;
  interest_rate: string;
  interest_from: string;
  deferred: string;
  loan_account: string;
  owed_to_account: string;
  unpaid_balance: string;
  accrued_interest: string;
  total_due_to_you: string;
  total_owed_by_you: string;
}

const COLUMNS = [
  { id: 'date', label: 'Date' },
  { id: 'description', label: 'Description' },
  { id: 'interest_rate', label: 'Interest Rate' },
  { id: 'interest_from', label: 'Interest From' },
  { id: 'deferred', label: 'Deferred' },
  { id: 'loan_account', label: 'Loan Account' },
  { id: 'owed_to_account', label: 'Owed To Account' },
  { id: 'unpaid_balance', label: 'Unpaid Balance' },
  { id: 'accrued_interest', label: 'Accrued Interest' },
  { id: 'total_due_to_you', label: 'Total Due To You' },
  { id: 'total_owed_by_you', label: 'Total Owed By You' },
];

const BrokerCharges: React.FC<{ brokerId: string }> = () => {
  const [rows] = useState<ChargeRow[]>([]);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [filterValue, setFilterValue] = useState('all');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : sortDir === 'desc' ? null : 'asc');
      if (sortDir === 'desc') setSortCol(null);
    } else { setSortCol(col); setSortDir('asc'); }
  };

  const filtered = useMemo(() => {
    let result = rows;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)));
    }
    return result;
  }, [rows, search]);

  const toggleRow = (id: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedRows.size === filtered.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filtered.map(r => r.id)));
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-lg font-semibold text-foreground">Lender Charges</h4>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" variant="outline" className="gap-1 h-8 text-xs">
          <Plus className="h-3.5 w-3.5" /> New
        </Button>
        <Button size="sm" variant="outline" className="gap-1 h-8 text-xs" disabled={selectedRows.size !== 1}>
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Button>
        <Button size="sm" variant="outline" className="gap-1 h-8 text-xs text-destructive" disabled={selectedRows.size === 0}>
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
        <div className="h-5 w-px bg-border mx-1" />
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-8 w-[160px] text-xs" />
        </div>
        <Select value={filterValue} onValueChange={setFilterValue}>
          <SelectTrigger className="h-8 w-[120px] text-xs">
            <SelectValue placeholder="Show All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Show All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10 px-2">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selectedRows.size === filtered.length}
                  onChange={toggleAll}
                  className="rounded border-input"
                />
              </TableHead>
              {COLUMNS.map(c => (
                <SortableTableHead
                  key={c.id}
                  columnId={c.id}
                  label={c.label}
                  sortColumnId={sortCol}
                  sortDirection={sortDir}
                  onSort={handleSort}
                  className="whitespace-nowrap text-xs"
                />
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMNS.length + 1} className="text-center py-8 text-muted-foreground text-sm">
                  No charge records found.
                </TableCell>
              </TableRow>
            ) : filtered.map(r => (
              <TableRow key={r.id} className={selectedRows.has(r.id) ? 'bg-primary/5' : ''}>
                <TableCell className="w-10 px-2">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(r.id)}
                    onChange={() => toggleRow(r.id)}
                    className="rounded border-input"
                  />
                </TableCell>
                {COLUMNS.map(c => (
                  <TableCell key={c.id} className="whitespace-nowrap text-xs">
                    {(r as any)[c.id] || '-'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default BrokerCharges;
