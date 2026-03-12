import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SortableTableHead from '@/components/deal/SortableTableHead';
import { type SortDirection } from '@/hooks/useGridSortFilter';

interface LogRow {
  id: string; date: string; type: string; subject: string; from: string; to: string; status: string;
}

const COLUMNS = [
  { id: 'date', label: 'Date' }, { id: 'type', label: 'Type' },
  { id: 'subject', label: 'Subject' }, { id: 'from', label: 'From' },
  { id: 'to', label: 'To' }, { id: 'status', label: 'Status' },
];

const BrokerConversationLog: React.FC<{ brokerId: string }> = () => {
  const [rows] = useState<LogRow[]>([]);
  const [search, setSearch] = useState('');
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
        <h4 className="text-lg font-semibold text-foreground">Conversation Log</h4>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 w-[200px]" />
        </div>
      </div>
      <div className="border border-border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {COLUMNS.map(c => <SortableTableHead key={c.id} columnId={c.id} label={c.label} sortColumnId={sortCol} sortDirection={sortDir} onSort={handleSort} />)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={COLUMNS.length} className="text-center py-8 text-muted-foreground">No conversation log entries found.</TableCell></TableRow>
            ) : filtered.map(r => (
              <TableRow key={r.id}>{COLUMNS.map(c => <TableCell key={c.id}>{(r as any)[c.id] || '-'}</TableCell>)}</TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default BrokerConversationLog;
