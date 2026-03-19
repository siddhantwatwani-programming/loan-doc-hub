import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { logContactEvent } from '@/hooks/useContactEventJournal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Filter, Download, Settings2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SortableTableHead from '@/components/deal/SortableTableHead';
import { type SortDirection } from '@/hooks/useGridSortFilter';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PortfolioRow {
  id: string;
  loanNumber: string;
  loanAmount: string;
  role: string;
  status: string;
  nextPayment: string;
  balance: string;
}

const ALL_COLUMNS = [
  { id: 'loanNumber', label: 'Loan Number' },
  { id: 'loanAmount', label: 'Loan Amount' },
  { id: 'role', label: 'Role' },
  { id: 'status', label: 'Status' },
  { id: 'nextPayment', label: 'Next Payment' },
  { id: 'balance', label: 'Balance' },
];

const EMPTY_ROW: Omit<PortfolioRow, 'id'> = {
  loanNumber: '', loanAmount: '', role: '', status: '', nextPayment: '', balance: '',
};

interface Props { borrowerId: string; contactDbId: string; }

const BorrowerPortfolio: React.FC<Props> = ({ contactDbId }) => {
  const [rows, setRows] = useState<PortfolioRow[]>([]);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(ALL_COLUMNS.map(c => c.id)));
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newRecord, setNewRecord] = useState<Omit<PortfolioRow, 'id'>>(EMPTY_ROW);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('contacts').select('contact_data').eq('id', contactDbId).single();
      if (data?.contact_data) {
        const cd = data.contact_data as Record<string, any>;
        if (Array.isArray(cd._portfolio)) setRows(cd._portfolio);
      }
    };
    if (contactDbId) load();
  }, [contactDbId]);

  const persist = useCallback(async (updated: PortfolioRow[]) => {
    setIsSaving(true);
    try {
      const { data: current } = await supabase.from('contacts').select('contact_data').eq('id', contactDbId).single();
      const existing = (current?.contact_data as Record<string, any>) || {};
      const merged = { ...existing, _portfolio: updated } as any;
      const { error } = await supabase.from('contacts').update({ contact_data: merged as any, updated_at: new Date().toISOString() }).eq('id', contactDbId);
      if (error) throw error;
    } catch { toast.error('Failed to save portfolio'); } finally { setIsSaving(false); }
  }, [contactDbId]);

  const handleAdd = useCallback(async () => {
    const row: PortfolioRow = { ...newRecord, id: crypto.randomUUID() };
    const updated = [...rows, row];
    await persist(updated);
    setRows(updated);
    setNewRecord(EMPTY_ROW);
    setAddDialogOpen(false);
    toast.success('Portfolio record added');
    logContactEvent(contactDbId, 'Portfolio', [{ fieldLabel: 'Portfolio Added', oldValue: '', newValue: row.loanNumber || 'New' }]);
  }, [newRecord, rows, persist, contactDbId]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedRows.size === 0) return;
    const updated = rows.filter(r => !selectedRows.has(r.id));
    await persist(updated);
    setRows(updated);
    setSelectedRows(new Set());
    toast.success(`${selectedRows.size} record(s) deleted`);
  }, [rows, selectedRows, persist]);

  const handleSort = (col: string) => {
    if (sortCol === col) { setSortDir(sortDir === 'asc' ? 'desc' : sortDir === 'desc' ? null : 'asc'); if (sortDir === 'desc') setSortCol(null); }
    else { setSortCol(col); setSortDir('asc'); }
  };

  const activeColumns = useMemo(() => ALL_COLUMNS.filter(c => visibleColumns.has(c.id)), [visibleColumns]);

  const filtered = useMemo(() => {
    let result = rows;
    if (search) { const q = search.toLowerCase(); result = result.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q))); }
    if (sortCol && sortDir) { result = [...result].sort((a, b) => { const av = (a as any)[sortCol] || ''; const bv = (b as any)[sortCol] || ''; return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av); }); }
    return result;
  }, [rows, search, sortCol, sortDir]);

  const toggleRow = (id: string) => setSelectedRows(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => { if (selectedRows.size === filtered.length) setSelectedRows(new Set()); else setSelectedRows(new Set(filtered.map(r => r.id))); };
  const toggleColumn = (colId: string) => setVisibleColumns(prev => { const n = new Set(prev); n.has(colId) ? n.delete(colId) : n.add(colId); return n; });

  const handleExport = () => {
    const headers = activeColumns.map(c => c.label).join(',');
    const csvRows = filtered.map(r => activeColumns.map(c => `"${String((r as any)[c.id] || '').replace(/"/g, '""')}"`).join(','));
    const csv = [headers, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'borrower_portfolio.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-foreground">Portfolio</h4>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild><Button size="sm" variant="outline" className="gap-1 h-8 text-xs"><Settings2 className="h-3.5 w-3.5" /> Columns</Button></PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="end">
              <div className="space-y-2"><span className="text-sm font-medium">Toggle Columns</span>
                {ALL_COLUMNS.map(c => (<div key={c.id} className="flex items-center gap-2"><Checkbox id={`bp-col-${c.id}`} checked={visibleColumns.has(c.id)} onCheckedChange={() => toggleColumn(c.id)} /><label htmlFor={`bp-col-${c.id}`} className="text-xs cursor-pointer">{c.label}</label></div>))}
              </div>
            </PopoverContent>
          </Popover>
          {selectedRows.size > 0 && <Button size="sm" variant="destructive" className="gap-1 h-8 text-xs" onClick={handleDeleteSelected}>Delete ({selectedRows.size})</Button>}
          <Button size="sm" variant="outline" className="gap-1 h-8 text-xs" onClick={() => setAddDialogOpen(true)}><Plus className="h-3.5 w-3.5" /> Add Portfolio</Button>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-8 w-[180px] text-xs" /></div>
        <Button size="sm" variant="outline" className="gap-1 h-8 text-xs" onClick={handleExport}><Download className="h-3.5 w-3.5" /> Export</Button>
      </div>
      <div className="border border-border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10 px-2"><input type="checkbox" checked={filtered.length > 0 && selectedRows.size === filtered.length} onChange={toggleAll} className="rounded border-input" /></TableHead>
              {activeColumns.map(c => <SortableTableHead key={c.id} columnId={c.id} label={c.label} sortColumnId={sortCol} sortDirection={sortDir} onSort={handleSort} className="whitespace-nowrap text-xs" />)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={activeColumns.length + 1} className="text-center py-8 text-muted-foreground text-sm">No portfolio records found. Click "Add Portfolio" to add one.</TableCell></TableRow>
            ) : filtered.map(r => (
              <TableRow key={r.id} className={selectedRows.has(r.id) ? 'bg-primary/5' : ''}>
                <TableCell className="w-10 px-2"><input type="checkbox" checked={selectedRows.has(r.id)} onChange={() => toggleRow(r.id)} className="rounded border-input" /></TableCell>
                {activeColumns.map(c => <TableCell key={c.id} className="whitespace-nowrap text-xs">{(r as any)[c.id] || '-'}</TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Portfolio Record</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {ALL_COLUMNS.map(col => (
              <div key={col.id} className="space-y-1">
                <Label className="text-xs">{col.label}</Label>
                <Input className="h-8 text-xs" value={(newRecord as any)[col.id] || ''} onChange={e => setNewRecord(prev => ({ ...prev, [col.id]: e.target.value }))} placeholder={col.label} />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAdd} disabled={isSaving}>{isSaving ? 'Saving...' : 'Add Record'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BorrowerPortfolio;
