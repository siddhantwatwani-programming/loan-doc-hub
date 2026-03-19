import React, { useState, useMemo, useEffect, useRef } from 'react';
import { logContactEvent } from '@/hooks/useContactEventJournal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Plus, Settings2, Filter, Download, CalendarIcon, Paperclip, FileDown, Eye } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SortableTableHead from '@/components/deal/SortableTableHead';
import { RichTextEditor } from '@/components/deal/RichTextEditor';
import { type SortDirection } from '@/hooks/useGridSortFilter';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface AttachmentMeta { name: string; storagePath: string; uploadedAt: string; }

interface LogRow {
  id: string; date: string; asOfDate: string; type: string; subject: string;
  from: string; to: string; status: string; content: string; highPriority: boolean;
  reference: string; attachments: (string | AttachmentMeta)[]; account: string; name: string;
}

const ALL_COLUMNS = [
  { id: 'date', label: 'Date - Time' }, { id: 'asOfDate', label: 'As Of' },
  { id: 'highPriority', label: 'High Priority' }, { id: 'type', label: 'Type' },
  { id: 'account', label: 'Account' }, { id: 'name', label: 'Name' },
  { id: 'reference', label: 'Reference' }, { id: 'attachments', label: 'Attachment' },
];

const LOG_TYPES_FALLBACK = ['Conversation Log', 'Attorney / Client', 'Internal'];

const getEmptyLog = (): Omit<LogRow, 'id'> => {
  const now = new Date();
  return { date: now.toISOString(), asOfDate: now.toISOString(), type: '', subject: '', from: '', to: '', status: '', content: '', highPriority: false, reference: '', attachments: [], account: '', name: '' };
};

const BorrowerConversationLog: React.FC<{ borrowerId: string; contactDbId: string }> = ({ contactDbId }) => {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(ALL_COLUMNS.map(c => c.id)));
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [newLog, setNewLog] = useState<Omit<LogRow, 'id'>>(getEmptyLog());
  const [filterType, setFilterType] = useState('');
  const [logTypes, setLogTypes] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [viewingRow, setViewingRow] = useState<LogRow | null>(null);
  const [asOfDateFilter, setAsOfDateFilter] = useState<Date | undefined>(undefined);
  const [asOfFilterOpen, setAsOfFilterOpen] = useState(false);
  const [addAsOfOpen, setAddAsOfOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (supabase as any).from('conversation_log_types').select('label').eq('is_active', true).order('display_order').then(({ data, error }: any) => {
      if (error || !data?.length) setLogTypes(LOG_TYPES_FALLBACK); else setLogTypes(data.map((r: any) => r.label));
    });
  }, []);

  useEffect(() => {
    if (!contactDbId) return;
    const load = async () => {
      const { data } = await supabase.from('contacts').select('contact_data').eq('id', contactDbId).single();
      if (data?.contact_data && (data.contact_data as any)._conversation_logs) setRows((data.contact_data as any)._conversation_logs);
    };
    load();
  }, [contactDbId]);

  const persistLogs = async (updated: LogRow[]) => {
    const { data: current } = await supabase.from('contacts').select('contact_data').eq('id', contactDbId).single();
    const existing = (current?.contact_data as Record<string, any>) || {};
    const merged = { ...existing, _conversation_logs: updated };
    const { error } = await supabase.from('contacts').update({ contact_data: merged as any }).eq('id', contactDbId);
    if (error) toast.error('Failed to save conversation log');
  };

  const handleSort = (col: string) => { if (sortCol === col) { setSortDir(sortDir === 'asc' ? 'desc' : sortDir === 'desc' ? null : 'asc'); if (sortDir === 'desc') setSortCol(null); } else { setSortCol(col); setSortDir('asc'); } };
  const toggleColumn = (colId: string) => setVisibleColumns(prev => { const n = new Set(prev); n.has(colId) ? n.delete(colId) : n.add(colId); return n; });
  const activeColumns = ALL_COLUMNS.filter(c => visibleColumns.has(c.id));

  const filtered = useMemo(() => {
    let result = rows;
    if (search) { const q = search.toLowerCase(); result = result.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q))); }
    if (asOfDateFilter) { const fs = format(asOfDateFilter, 'yyyy-MM-dd'); result = result.filter(r => r.asOfDate?.startsWith(fs)); }
    if (filterType) result = result.filter(r => r.type === filterType);
    if (sortCol && sortDir) { result = [...result].sort((a, b) => { const va = (a as any)[sortCol] || ''; const vb = (b as any)[sortCol] || ''; return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va)); }); }
    return result;
  }, [rows, search, sortCol, sortDir, asOfDateFilter, filterType]);

  const handleAddLog = async () => {
    setUploading(true);
    const logId = `conv_${Date.now()}`;
    let attachmentsMeta: (string | AttachmentMeta)[] = [...newLog.attachments];
    if (pendingFiles.length > 0) {
      for (const file of pendingFiles) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `borrower/${contactDbId}/${logId}/${Date.now()}_${safeName}`;
        const { error } = await supabase.storage.from('contact-attachments').upload(path, file);
        if (!error) attachmentsMeta.push({ name: file.name, storagePath: path, uploadedAt: new Date().toISOString() });
      }
    }
    const entry: LogRow = { ...newLog, id: logId, attachments: attachmentsMeta };
    const updated = [...rows, entry];
    setRows(updated); await persistLogs(updated);
    setNewLog(getEmptyLog()); setPendingFiles([]); setAddOpen(false); setUploading(false);
    toast.success('Conversation log added');
    logContactEvent(contactDbId, 'Conversation Log', [{ fieldLabel: 'Log Added', oldValue: '', newValue: entry.subject || 'New log' }]);
  };

  const handleDeleteSelected = async () => {
    if (selectedRows.size === 0) return;
    const updated = rows.filter(r => !selectedRows.has(r.id));
    setRows(updated); setSelectedRows(new Set()); await persistLogs(updated);
    toast.success(`Deleted ${selectedRows.size} entry(ies)`);
  };

  const handleExport = () => {
    const exp = selectedRows.size > 0 ? filtered.filter(r => selectedRows.has(r.id)) : filtered;
    if (exp.length === 0) { toast.info('No data to export'); return; }
    const h = activeColumns.map(c => c.label); const csvR = exp.map(r => activeColumns.map(c => `"${String((r as any)[c.id] || '').replace(/"/g, '""')}"`).join(','));
    const blob = new Blob([[h.join(','), ...csvR].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'borrower_conversation_log.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const toggleSelectAll = () => { if (selectedRows.size === filtered.length) setSelectedRows(new Set()); else setSelectedRows(new Set(filtered.map(r => r.id))); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const files = e.target.files; if (!files) return; const arr = Array.from(files); setPendingFiles(prev => [...prev, ...arr]); setNewLog(prev => ({ ...prev, attachments: [...prev.attachments, ...arr.map(f => ({ name: f.name, storagePath: '', uploadedAt: '' }))] })); if (fileInputRef.current) fileInputRef.current.value = ''; };
  const removeAttachment = (idx: number) => { setPendingFiles(prev => prev.filter((_, i) => i !== idx)); setNewLog(p => ({ ...p, attachments: p.attachments.filter((_, i) => i !== idx) })); };

  const addAsOfDateObj = newLog.asOfDate ? (() => { try { const d = new Date(newLog.asOfDate); return isNaN(d.getTime()) ? undefined : d; } catch { return undefined; } })() : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-foreground">Conversation Log</h4>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">As Of</span>
          <Popover open={asOfFilterOpen} onOpenChange={setAsOfFilterOpen}>
            <PopoverTrigger asChild><Button variant="outline" size="sm" className="h-8 text-xs gap-1 w-[130px] justify-start">{asOfDateFilter ? format(asOfDateFilter, 'dd-MM-yyyy') : <span className="text-muted-foreground">dd-mm-yyyy</span>}<CalendarIcon className="h-3 w-3 ml-auto" /></Button></PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[9999]" align="end">
              <Calendar mode="single" selected={asOfDateFilter} onSelect={(d) => { setAsOfDateFilter(d); setAsOfFilterOpen(false); }} initialFocus />
              {asOfDateFilter && <div className="px-3 pb-2"><Button variant="ghost" size="sm" className="text-xs w-full" onClick={() => { setAsOfDateFilter(undefined); setAsOfFilterOpen(false); }}>Clear</Button></div>}
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild><Button variant="outline" size="sm" className="h-8 text-xs gap-1"><Settings2 className="h-3.5 w-3.5" /> Columns</Button></PopoverTrigger>
            <PopoverContent className="w-48 p-2 z-[9999]" align="end">
              {ALL_COLUMNS.map(c => (<label key={c.id} className="flex items-center gap-2 py-1 px-1 text-xs cursor-pointer hover:bg-muted/50 rounded"><Checkbox checked={visibleColumns.has(c.id)} onCheckedChange={() => toggleColumn(c.id)} />{c.label}</label>))}
            </PopoverContent>
          </Popover>
          <Button size="sm" className="h-8 text-xs gap-1" onClick={() => { setNewLog(getEmptyLog()); setPendingFiles([]); setAddOpen(true); }}><Plus className="h-3.5 w-3.5" /> Add Conversation Logs</Button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-[220px]"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search conversations..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" /></div>
        <Popover>
          <PopoverTrigger asChild><Button variant="outline" size="sm" className="h-8 text-xs gap-1"><Filter className="h-3.5 w-3.5" /> Filters</Button></PopoverTrigger>
          <PopoverContent className="w-56 p-3 space-y-3 z-[9999]" align="start">
            <div><Label className="text-xs">Type</Label><Select value={filterType} onValueChange={setFilterType}><SelectTrigger className="h-7 text-xs"><SelectValue placeholder="All" /></SelectTrigger><SelectContent><SelectItem value="__all__" className="text-xs">All</SelectItem>{[...new Set(rows.map(r => r.type).filter(Boolean))].map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}</SelectContent></Select></div>
            <Button variant="ghost" size="sm" className="text-xs w-full" onClick={() => setFilterType('')}>Clear Filters</Button>
          </PopoverContent>
        </Popover>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handleExport}><Download className="h-3.5 w-3.5" /> Export</Button>
        {selectedRows.size > 0 && <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={handleDeleteSelected}>Delete ({selectedRows.size})</Button>}
      </div>
      <div className="border border-border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader><TableRow className="bg-muted/50">
            <TableHead className="w-10"><Checkbox checked={filtered.length > 0 && selectedRows.size === filtered.length} onCheckedChange={toggleSelectAll} /></TableHead>
            {activeColumns.map(c => <SortableTableHead key={c.id} columnId={c.id} label={c.label} sortColumnId={sortCol} sortDirection={sortDir} onSort={handleSort} />)}
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={activeColumns.length + 1} className="text-center py-8 text-muted-foreground">No conversation log entries found.</TableCell></TableRow>
            ) : filtered.map(r => (
              <TableRow key={r.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setViewingRow(r)}>
                <TableCell onClick={e => e.stopPropagation()}><Checkbox checked={selectedRows.has(r.id)} onCheckedChange={() => { const n = new Set(selectedRows); n.has(r.id) ? n.delete(r.id) : n.add(r.id); setSelectedRows(n); }} /></TableCell>
                {activeColumns.map(c => (
                  <TableCell key={c.id} className="text-xs">
                    {c.id === 'date' ? (() => { try { return format(new Date(r.date), 'MM/dd/yyyy HH:mm:ss'); } catch { return r.date; } })() :
                     c.id === 'asOfDate' ? (() => { try { return format(new Date(r.asOfDate), 'MM/dd/yyyy'); } catch { return r.asOfDate; } })() :
                     c.id === 'highPriority' ? (r.highPriority ? 'Yes' : 'No') :
                     c.id === 'attachments' ? (r.attachments?.length > 0 ? <span className="flex items-center gap-1"><Paperclip className="h-3.5 w-3.5 text-primary" />{r.attachments.length}</span> : '-') :
                     (r as any)[c.id] || '-'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* View Dialog */}
      <Dialog open={!!viewingRow} onOpenChange={() => setViewingRow(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Conversation Log Details</DialogTitle></DialogHeader>
          {viewingRow && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs text-muted-foreground">Type</Label><p>{viewingRow.type || '-'}</p></div>
                <div><Label className="text-xs text-muted-foreground">Subject</Label><p>{viewingRow.subject || '-'}</p></div>
                <div><Label className="text-xs text-muted-foreground">From</Label><p>{viewingRow.from || '-'}</p></div>
                <div><Label className="text-xs text-muted-foreground">To</Label><p>{viewingRow.to || '-'}</p></div>
              </div>
              {viewingRow.content && <div><Label className="text-xs text-muted-foreground">Content</Label><div className="prose prose-sm max-w-none mt-1 p-2 bg-muted/30 rounded" dangerouslySetInnerHTML={{ __html: viewingRow.content }} /></div>}
              {viewingRow.attachments?.length > 0 && (
                <div><Label className="text-xs text-muted-foreground">Attachments</Label>
                  {viewingRow.attachments.map((att, i) => {
                    const name = typeof att === 'string' ? att : att.name;
                    const path = typeof att === 'object' ? att.storagePath : null;
                    return <div key={i} className="flex items-center gap-2 text-xs py-1"><Paperclip className="h-3 w-3" /><span>{name}</span>
                      {path && <Button variant="ghost" size="sm" className="h-6 px-1" onClick={async () => { const { data } = await supabase.storage.from('contact-attachments').download(path); if (data) { const url = URL.createObjectURL(data); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url); } }}><FileDown className="h-3 w-3" /></Button>}
                    </div>;
                  })}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Conversation Log</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label className="text-xs">Type</Label><Select value={newLog.type} onValueChange={v => setNewLog(p => ({ ...p, type: v }))}><SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent className="z-[9999]">{logTypes.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label className="text-xs">Subject</Label><Input className="h-8 text-xs" value={newLog.subject} onChange={e => setNewLog(p => ({ ...p, subject: e.target.value }))} /></div>
            <div className="space-y-1"><Label className="text-xs">From</Label><Input className="h-8 text-xs" value={newLog.from} onChange={e => setNewLog(p => ({ ...p, from: e.target.value }))} /></div>
            <div className="space-y-1"><Label className="text-xs">To</Label><Input className="h-8 text-xs" value={newLog.to} onChange={e => setNewLog(p => ({ ...p, to: e.target.value }))} /></div>
            <div className="space-y-1"><Label className="text-xs">Account</Label><Input className="h-8 text-xs" value={newLog.account} onChange={e => setNewLog(p => ({ ...p, account: e.target.value }))} /></div>
            <div className="space-y-1"><Label className="text-xs">Name</Label><Input className="h-8 text-xs" value={newLog.name} onChange={e => setNewLog(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="space-y-1"><Label className="text-xs">Reference</Label><Input className="h-8 text-xs" value={newLog.reference} onChange={e => setNewLog(p => ({ ...p, reference: e.target.value }))} /></div>
            <div className="space-y-1">
              <Label className="text-xs">As Of Date</Label>
              <Popover open={addAsOfOpen} onOpenChange={setAddAsOfOpen}>
                <PopoverTrigger asChild><Button variant="outline" className="w-full h-8 text-xs justify-start font-normal">{addAsOfDateObj ? format(addAsOfDateObj, 'MM/dd/yyyy') : <span className="text-muted-foreground">Select date</span>}<CalendarIcon className="h-3 w-3 ml-auto" /></Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[9999]" align="start"><Calendar mode="single" selected={addAsOfDateObj} onSelect={d => { setNewLog(p => ({ ...p, asOfDate: d ? d.toISOString() : '' })); setAddAsOfOpen(false); }} initialFocus /></PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2"><Checkbox checked={newLog.highPriority} onCheckedChange={v => setNewLog(p => ({ ...p, highPriority: !!v }))} /><Label className="text-xs">High Priority</Label></div>
          <div className="mt-2"><Label className="text-xs">Content</Label><RichTextEditor value={newLog.content} onChange={v => setNewLog(p => ({ ...p, content: v }))} /></div>
          <div className="mt-2">
            <Label className="text-xs">Attachments</Label>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
            <Button variant="outline" size="sm" className="gap-1 mt-1" onClick={() => fileInputRef.current?.click()}><Paperclip className="h-3.5 w-3.5" /> Attach Files</Button>
            {pendingFiles.length > 0 && <div className="mt-2 space-y-1">{pendingFiles.map((f, i) => <div key={i} className="flex items-center gap-2 text-xs"><Paperclip className="h-3 w-3" /><span className="truncate">{f.name}</span><Button variant="ghost" size="sm" className="h-5 px-1 text-destructive" onClick={() => removeAttachment(i)}>×</Button></div>)}</div>}
          </div>
          <DialogFooter><Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button><Button size="sm" onClick={handleAddLog} disabled={uploading}>{uploading ? 'Saving...' : 'Add Log'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BorrowerConversationLog;
