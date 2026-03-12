import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import SortableTableHead from '@/components/deal/SortableTableHead';
import { type SortDirection } from '@/hooks/useGridSortFilter';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface JournalRow {
  id: string; eventNumber: number; date: string; section: string; user: string; details: string;
}

const COLUMNS = [
  { id: 'eventNumber', label: 'Event #' }, { id: 'date', label: 'Date' },
  { id: 'section', label: 'Section' }, { id: 'user', label: 'User' },
  { id: 'details', label: 'Details' },
];

const LenderEventsJournal: React.FC<{ lenderId: string; contactDbId: string }> = ({ contactDbId }) => {
  const [rows, setRows] = useState<JournalRow[]>([]);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({ section: '', user: '', details: '' });

  useEffect(() => {
    if (!contactDbId) return;
    (async () => {
      const { data } = await supabase.from('contacts').select('contact_data').eq('id', contactDbId).single();
      if (data?.contact_data && (data.contact_data as any)._events_journal) {
        setRows((data.contact_data as any)._events_journal);
      }
    })();
  }, [contactDbId]);

  const persistRows = useCallback(async (updated: JournalRow[]) => {
    if (!contactDbId) return;
    const { data: current } = await supabase.from('contacts').select('contact_data').eq('id', contactDbId).single();
    const existing = (current?.contact_data || {}) as Record<string, any>;
    await supabase.from('contacts').update({ contact_data: { ...existing, _events_journal: updated } as any }).eq('id', contactDbId);
  }, [contactDbId]);

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
    if (sortCol && sortDir) {
      result = [...result].sort((a, b) => {
        const av = (a as any)[sortCol] ?? '';
        const bv = (b as any)[sortCol] ?? '';
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [rows, search, sortCol, sortDir]);

  const handleAdd = async () => {
    const entry: JournalRow = {
      id: crypto.randomUUID(),
      eventNumber: rows.length + 1,
      date: new Date().toLocaleDateString(),
      section: newEntry.section,
      user: newEntry.user,
      details: newEntry.details,
    };
    const updated = [...rows, entry];
    setRows(updated);
    await persistRows(updated);
    setNewEntry({ section: '', user: '', details: '' });
    setAddOpen(false);
    toast.success('Event added');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-foreground">Events Journal</h4>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 w-[200px]" />
          </div>
          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)} className="gap-1 text-xs">
            <Plus className="h-4 w-4" /> Add Event
          </Button>
        </div>
      </div>
      <div className="border border-border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {COLUMNS.map(c => <SortableTableHead key={c.id} columnId={c.id} label={c.label} sortColumnId={sortCol} sortDirection={sortDir} onSort={handleSort} />)}
            </TableRow>
          </TableHeader>
          <tbody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={COLUMNS.length} className="text-center py-8 text-muted-foreground">No events journal entries found.</TableCell></TableRow>
            ) : filtered.map(r => (
              <TableRow key={r.id}>{COLUMNS.map(c => <TableCell key={c.id} className="text-xs">{(r as any)[c.id] || '-'}</TableCell>)}</TableRow>
            ))}
          </tbody>
        </Table>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Event Journal Entry</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Section</Label>
              <Input value={newEntry.section} onChange={e => setNewEntry(p => ({ ...p, section: e.target.value }))} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">User</Label>
              <Input value={newEntry.user} onChange={e => setNewEntry(p => ({ ...p, user: e.target.value }))} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Details</Label>
              <Textarea value={newEntry.details} onChange={e => setNewEntry(p => ({ ...p, details: e.target.value }))} className="text-xs" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAdd}>Add Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LenderEventsJournal;
