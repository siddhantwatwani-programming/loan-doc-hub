import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { logContactEvent } from '@/hooks/useContactEventJournal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Plus, Settings2, Filter, Download, CalendarIcon, Paperclip, FileDown, Mail, Phone, MessageSquare, StickyNote } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EnhancedCalendar } from '@/components/ui/enhanced-calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import SortableTableHead from '@/components/deal/SortableTableHead';
import { RichTextEditor } from '@/components/deal/RichTextEditor';
import { type SortDirection } from '@/hooks/useGridSortFilter';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface AttachmentMeta { name: string; storagePath: string; uploadedAt: string; }

interface LogRow {
  id: string; date: string; asOfDate: string; type: string; subject: string;
  from: string; to: string; status: string; content: string; highPriority: boolean;
  reference: string; attachments: (string | AttachmentMeta)[]; account: string; name: string;
}

interface UnifiedRow {
  id: string;
  dateTime: string;
  commType: string;
  subject: string;
  sentBy: string;
  recipient: string;
  relatedLoan: string;
  relatedDealId: string | null;
  channel: string;
  preview: string;
  status: string;
  attachments: (string | AttachmentMeta)[];
  source: 'contact' | 'deal';
  originalLog?: LogRow;
  fullContent: string;
  highPriority: boolean;
}

const ALL_COLUMNS = [
  { id: 'dateTime', label: 'Date / Time' },
  { id: 'commType', label: 'Type' },
  { id: 'subject', label: 'Subject' },
  { id: 'sentBy', label: 'Sent By' },
  { id: 'recipient', label: 'Recipient' },
  { id: 'relatedLoan', label: 'Related Loan' },
  { id: 'channel', label: 'Channel' },
  { id: 'preview', label: 'Message Preview' },
  { id: 'attachments', label: 'Attachments' },
  { id: 'status', label: 'Status' },
];

const LOG_TYPES_FALLBACK = ['Conversation Log', 'Attorney / Client', 'Internal'];

const COMM_TYPES = ['Email', 'SMS', 'Call', 'Internal Note', 'Portal Message'];

const getEmptyLog = (): Omit<LogRow, 'id'> => {
  const now = new Date();
  return { date: now.toISOString(), asOfDate: now.toISOString(), type: '', subject: '', from: '', to: '', status: '', content: '', highPriority: false, reference: '', attachments: [], account: '', name: '' };
};

const BorrowerConversationLog: React.FC<{ borrowerId: string; contactDbId: string; disabled?: boolean }> = ({ contactDbId, disabled }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string | null>('dateTime');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(ALL_COLUMNS.map(c => c.id)));
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [addMode, setAddMode] = useState<'email' | 'call' | 'note' | 'portal'>('note');
  const [newLog, setNewLog] = useState<Omit<LogRow, 'id'>>(getEmptyLog());
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [viewingRow, setViewingRow] = useState<UnifiedRow | null>(null);
  const [logTypes, setLogTypes] = useState<string[]>([]);
  const [addAsOfOpen, setAddAsOfOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterLoan, setFilterLoan] = useState('');
  const [filterSender, setFilterSender] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [asOfDateFilter, setAsOfDateFilter] = useState<Date | undefined>(undefined);
  const [asOfFilterOpen, setAsOfFilterOpen] = useState(false);

  useEffect(() => {
    (supabase as any).from('conversation_log_types').select('label').eq('is_active', true).order('display_order').then(({ data, error }: any) => {
      if (error || !data?.length) setLogTypes(LOG_TYPES_FALLBACK); else setLogTypes(data.map((r: any) => r.label));
    });
  }, []);

  // Fetch unified data
  const { data: unifiedRows = [], isLoading } = useQuery({
    queryKey: ['borrower-conversation-log', contactDbId],
    queryFn: async () => {
      const rows: UnifiedRow[] = [];

      // Step 1: Contact-level conversation logs from contact_data
      const { data: contactData } = await supabase.from('contacts').select('contact_data').eq('id', contactDbId).single();
      if (contactData?.contact_data && (contactData.contact_data as any)._conversation_logs) {
        const logs = (contactData.contact_data as any)._conversation_logs as LogRow[];
        logs.forEach(log => {
          rows.push({
            id: `contact_${log.id}`,
            dateTime: log.date,
            commType: log.type || 'Internal Note',
            subject: log.subject || '',
            sentBy: log.from || '',
            recipient: log.to || '',
            relatedLoan: log.account || '—',
            relatedDealId: null,
            channel: log.type || 'Internal',
            preview: log.content ? log.content.replace(/<[^>]*>/g, '').substring(0, 200) : '',
            status: log.status || 'sent',
            attachments: log.attachments || [],
            source: 'contact',
            originalLog: log,
            fullContent: log.content || '',
            highPriority: log.highPriority || false,
          });
        });
      }

      // Step 2: Find all deals where borrower participates
      const { data: participants } = await supabase
        .from('deal_participants')
        .select('deal_id, name')
        .eq('contact_id', contactDbId)
        .eq('role', 'borrower');

      if (participants && participants.length > 0) {
        const dealIds = participants.map(p => p.deal_id);

        // Fetch deal numbers
        const { data: deals } = await supabase.from('deals').select('id, deal_number').in('id', dealIds);
        const dealMap: Record<string, string> = {};
        (deals || []).forEach(d => { dealMap[d.id] = d.deal_number; });

        // Step 3: Fetch messages linked to those deals
        const { data: messages } = await supabase
          .from('messages')
          .select('*')
          .in('deal_id', dealIds)
          .order('created_at', { ascending: false });

        if (messages && messages.length > 0) {
          // Fetch sender profiles
          const senderIds: string[] = Array.from(new Set(messages.map(m => m.sender_id)));
          const { data: profiles } = await supabase.from('profiles').select('user_id, full_name').in('user_id', senderIds);
          const profileMap: Record<string, string> = {};
          (profiles || []).forEach(p => { profileMap[p.user_id] = p.full_name || 'Unknown'; });

          messages.forEach(msg => {
            const recipients = Array.isArray(msg.recipients) ? msg.recipients.map((r: any) => typeof r === 'string' ? r : r?.email || r?.name || '').join(', ') : '';
            rows.push({
              id: `deal_${msg.id}`,
              dateTime: msg.created_at,
              commType: msg.message_type === 'email' ? 'Email' : msg.message_type === 'sms' ? 'SMS' : msg.message_type === 'call' ? 'Call' : msg.message_type === 'portal' ? 'Portal Message' : msg.message_type || 'Email',
              subject: msg.subject || '',
              sentBy: profileMap[msg.sender_id] || 'Unknown',
              recipient: recipients,
              relatedLoan: msg.deal_id ? dealMap[msg.deal_id] || msg.deal_id : '—',
              relatedDealId: msg.deal_id,
              channel: msg.message_type || 'email',
              preview: msg.body ? msg.body.replace(/<[^>]*>/g, '').substring(0, 200) : '',
              status: msg.status || 'sent',
              attachments: Array.isArray(msg.attachments) ? msg.attachments as any : [],
              source: 'deal',
              fullContent: msg.body || '',
              highPriority: false,
            });
          });
        }
      }

      return rows;
    },
    enabled: !!contactDbId,
  });

  // Derived filter options
  const uniqueLoans = useMemo(() => [...new Set(unifiedRows.filter(r => r.relatedLoan !== '—').map(r => r.relatedLoan))], [unifiedRows]);
  const uniqueSenders = useMemo(() => [...new Set(unifiedRows.map(r => r.sentBy).filter(Boolean))], [unifiedRows]);
  const uniqueChannels = useMemo(() => [...new Set(unifiedRows.map(r => r.channel).filter(Boolean))], [unifiedRows]);

  const handleSort = (col: string) => {
    if (sortCol === col) { setSortDir(sortDir === 'asc' ? 'desc' : sortDir === 'desc' ? null : 'asc'); if (sortDir === 'desc') setSortCol(null); } else { setSortCol(col); setSortDir('asc'); }
  };
  const toggleColumn = (colId: string) => setVisibleColumns(prev => { const n = new Set(prev); n.has(colId) ? n.delete(colId) : n.add(colId); return n; });
  const activeColumns = ALL_COLUMNS.filter(c => visibleColumns.has(c.id));

  const filtered = useMemo(() => {
    let result = unifiedRows;
    if (search) { const q = search.toLowerCase(); result = result.filter(r => [r.subject, r.sentBy, r.recipient, r.preview, r.relatedLoan, r.commType].some(v => v?.toLowerCase().includes(q))); }
    if (asOfDateFilter) { const fs = format(asOfDateFilter, 'yyyy-MM-dd'); result = result.filter(r => r.dateTime?.startsWith(fs)); }
    if (filterType) result = result.filter(r => r.commType === filterType);
    if (filterLoan) result = result.filter(r => r.relatedLoan === filterLoan);
    if (filterSender) result = result.filter(r => r.sentBy === filterSender);
    if (filterChannel) result = result.filter(r => r.channel === filterChannel);
    if (sortCol && sortDir) {
      result = [...result].sort((a, b) => {
        const va = (a as any)[sortCol] || '';
        const vb = (b as any)[sortCol] || '';
        return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
      });
    }
    return result;
  }, [unifiedRows, search, sortCol, sortDir, asOfDateFilter, filterType, filterLoan, filterSender, filterChannel]);

  // Persist contact-level logs
  const persistLogs = useCallback(async (updated: LogRow[]) => {
    const { data: current } = await supabase.from('contacts').select('contact_data').eq('id', contactDbId).single();
    const existing = (current?.contact_data as Record<string, any>) || {};
    const merged = { ...existing, _conversation_logs: updated };
    const { error } = await supabase.from('contacts').update({ contact_data: merged as any }).eq('id', contactDbId);
    if (error) toast.error('Failed to save conversation log');
  }, [contactDbId]);

  const getContactLogs = useCallback((): LogRow[] => {
    return unifiedRows.filter(r => r.source === 'contact' && r.originalLog).map(r => r.originalLog!);
  }, [unifiedRows]);

  const openAddModal = (mode: 'email' | 'call' | 'note' | 'portal') => {
    setAddMode(mode);
    const defaults = getEmptyLog();
    defaults.type = mode === 'email' ? 'Email' : mode === 'call' ? 'Call' : mode === 'portal' ? 'Portal Message' : 'Internal Note';
    setNewLog(defaults);
    setPendingFiles([]);
    setAddOpen(true);
  };

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
    const existingLogs = getContactLogs();
    const updated = [...existingLogs, entry];
    await persistLogs(updated);
    setNewLog(getEmptyLog()); setPendingFiles([]); setAddOpen(false); setUploading(false);
    toast.success('Conversation log added');
    logContactEvent(contactDbId, 'Conversation Log', [{ fieldLabel: 'Log Added', oldValue: '', newValue: entry.subject || 'New log' }]);
    queryClient.invalidateQueries({ queryKey: ['borrower-conversation-log', contactDbId] });
  };

  const handleDeleteSelected = async () => {
    if (selectedRows.size === 0) return;
    // Only delete contact-level logs
    const contactLogIds = new Set(
      unifiedRows.filter(r => r.source === 'contact' && selectedRows.has(r.id)).map(r => r.originalLog?.id).filter(Boolean)
    );
    const existingLogs = getContactLogs();
    const updated = existingLogs.filter(r => !contactLogIds.has(r.id));
    await persistLogs(updated);
    setSelectedRows(new Set());
    toast.success(`Deleted ${contactLogIds.size} entry(ies)`);
    queryClient.invalidateQueries({ queryKey: ['borrower-conversation-log', contactDbId] });
  };

  const handleExport = () => {
    const exp = selectedRows.size > 0 ? filtered.filter(r => selectedRows.has(r.id)) : filtered;
    if (exp.length === 0) { toast.info('No data to export'); return; }
    const h = activeColumns.map(c => c.label);
    const csvR = exp.map(r => activeColumns.map(c => {
      let val = '';
      if (c.id === 'dateTime') { try { val = format(new Date(r.dateTime), 'MM/dd/yyyy HH:mm:ss'); } catch { val = r.dateTime; } }
      else if (c.id === 'attachments') val = String(r.attachments?.length || 0);
      else val = String((r as any)[c.id] || '');
      return `"${val.replace(/"/g, '""')}"`;
    }).join(','));
    const blob = new Blob([[h.join(','), ...csvR].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'borrower_conversation_log.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const toggleSelectAll = () => { if (selectedRows.size === filtered.length) setSelectedRows(new Set()); else setSelectedRows(new Set(filtered.map(r => r.id))); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const files = e.target.files; if (!files) return; const arr = Array.from(files); setPendingFiles(prev => [...prev, ...arr]); setNewLog(prev => ({ ...prev, attachments: [...prev.attachments, ...arr.map(f => ({ name: f.name, storagePath: '', uploadedAt: '' }))] })); if (fileInputRef.current) fileInputRef.current.value = ''; };
  const removeAttachment = (idx: number) => { setPendingFiles(prev => prev.filter((_, i) => i !== idx)); setNewLog(p => ({ ...p, attachments: p.attachments.filter((_, i) => i !== idx) })); };

  const addAsOfDateObj = newLog.asOfDate ? (() => { try { const d = new Date(newLog.asOfDate); return isNaN(d.getTime()) ? undefined : d; } catch { return undefined; } })() : undefined;

  const hasActiveFilters = filterType || filterLoan || filterSender || filterChannel || asOfDateFilter;

  return (
    <div className="space-y-4">
      {/* Header + Quick Actions */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h4 className="text-lg font-semibold text-foreground">Conversation Log</h4>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => openAddModal('email')}>
            <Mail className="h-3.5 w-3.5" /> Send Email
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => openAddModal('call')}>
            <Phone className="h-3.5 w-3.5" /> Log Call
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => openAddModal('note')}>
            <StickyNote className="h-3.5 w-3.5" /> Add Internal Note
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => openAddModal('portal')}>
            <MessageSquare className="h-3.5 w-3.5" /> Portal Message
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search conversations..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
        </div>

        <span className="text-xs text-muted-foreground">As Of</span>
        <Popover open={asOfFilterOpen} onOpenChange={setAsOfFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1 w-[130px] justify-start">
              {asOfDateFilter ? format(asOfDateFilter, 'dd-MM-yyyy') : <span className="text-muted-foreground">dd-mm-yyyy</span>}
              <CalendarIcon className="h-3 w-3 ml-auto" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-[9999]" align="end">
            <EnhancedCalendar mode="single" selected={asOfDateFilter} onSelect={(d) => { setAsOfDateFilter(d); setAsOfFilterOpen(false); }} onClear={() => { setAsOfDateFilter(undefined); setAsOfFilterOpen(false); }} onToday={() => { setAsOfDateFilter(new Date()); setAsOfFilterOpen(false); }} initialFocus />
            
          </PopoverContent>
        </Popover>

        {/* Filters */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
              <Filter className="h-3.5 w-3.5" /> Filters
              {hasActiveFilters && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">!</Badge>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3 space-y-3 z-[9999]" align="start">
            <div><Label className="text-xs">Communication Type</Label>
              <Select value={filterType} onValueChange={v => setFilterType(v === '__all__' ? '' : v)}>
                <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent><SelectItem value="__all__" className="text-xs">All</SelectItem>{COMM_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Loan Reference</Label>
              <Select value={filterLoan} onValueChange={v => setFilterLoan(v === '__all__' ? '' : v)}>
                <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent><SelectItem value="__all__" className="text-xs">All</SelectItem>{uniqueLoans.map(l => <SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Sender</Label>
              <Select value={filterSender} onValueChange={v => setFilterSender(v === '__all__' ? '' : v)}>
                <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent><SelectItem value="__all__" className="text-xs">All</SelectItem>{uniqueSenders.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Channel</Label>
              <Select value={filterChannel} onValueChange={v => setFilterChannel(v === '__all__' ? '' : v)}>
                <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent><SelectItem value="__all__" className="text-xs">All</SelectItem>{uniqueChannels.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button variant="ghost" size="sm" className="text-xs w-full" onClick={() => { setFilterType(''); setFilterLoan(''); setFilterSender(''); setFilterChannel(''); }}>Clear Filters</Button>
          </PopoverContent>
        </Popover>

        {/* Column visibility */}
        <Popover>
          <PopoverTrigger asChild><Button variant="outline" size="sm" className="h-8 text-xs gap-1"><Settings2 className="h-3.5 w-3.5" /> Columns</Button></PopoverTrigger>
          <PopoverContent className="w-48 p-2 z-[9999]" align="end">
            {ALL_COLUMNS.map(c => (<label key={c.id} className="flex items-center gap-2 py-1 px-1 text-xs cursor-pointer hover:bg-muted/50 rounded"><Checkbox checked={visibleColumns.has(c.id)} onCheckedChange={() => toggleColumn(c.id)} />{c.label}</label>))}
          </PopoverContent>
        </Popover>

        <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handleExport}><Download className="h-3.5 w-3.5" /> Export</Button>
        {selectedRows.size > 0 && <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={handleDeleteSelected}>Delete ({selectedRows.size})</Button>}
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10"><Checkbox checked={filtered.length > 0 && selectedRows.size === filtered.length} onCheckedChange={toggleSelectAll} /></TableHead>
              {activeColumns.map(c => <SortableTableHead key={c.id} columnId={c.id} label={c.label} sortColumnId={sortCol} sortDirection={sortDir} onSort={handleSort} />)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={activeColumns.length + 1} className="text-center py-8 text-muted-foreground">Loading conversations…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={activeColumns.length + 1} className="text-center py-8 text-muted-foreground">No conversations recorded for this borrower.</TableCell></TableRow>
            ) : filtered.map(r => (
              <TableRow key={r.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setViewingRow(r)}>
                <TableCell onClick={e => e.stopPropagation()}>
                  <Checkbox checked={selectedRows.has(r.id)} onCheckedChange={() => { const n = new Set(selectedRows); n.has(r.id) ? n.delete(r.id) : n.add(r.id); setSelectedRows(n); }} />
                </TableCell>
                {activeColumns.map(c => (
                  <TableCell key={c.id} className="text-xs">
                    {c.id === 'dateTime' ? (() => { try { return format(new Date(r.dateTime), 'MM/dd/yyyy HH:mm:ss'); } catch { return r.dateTime; } })() :
                     c.id === 'commType' ? <Badge variant="outline" className="text-[10px]">{r.commType}</Badge> :
                     c.id === 'relatedLoan' ? (r.relatedLoan !== '—' ? <Badge variant="secondary" className="text-[10px]">{r.relatedLoan}</Badge> : <span className="text-muted-foreground">General</span>) :
                     c.id === 'attachments' ? (r.attachments?.length > 0 ? <span className="flex items-center gap-1"><Paperclip className="h-3.5 w-3.5 text-primary" />{r.attachments.length}</span> : '—') :
                     c.id === 'preview' ? <span className="text-muted-foreground line-clamp-1">{r.preview || '—'}</span> :
                     c.id === 'status' ? <Badge variant={r.status === 'sent' ? 'default' : r.status === 'delivered' ? 'secondary' : 'outline'} className="text-[10px]">{r.status || '—'}</Badge> :
                     (r as any)[c.id] || '—'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Conversation Detail Drawer */}
      <Sheet open={!!viewingRow} onOpenChange={() => setViewingRow(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>Conversation Details</SheetTitle></SheetHeader>
          {viewingRow && (
            <div className="space-y-4 mt-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs text-muted-foreground">Date / Time</Label><p>{(() => { try { return format(new Date(viewingRow.dateTime), 'MM/dd/yyyy HH:mm:ss'); } catch { return viewingRow.dateTime; } })()}</p></div>
                <div><Label className="text-xs text-muted-foreground">Type</Label><p><Badge variant="outline">{viewingRow.commType}</Badge></p></div>
                <div><Label className="text-xs text-muted-foreground">Subject</Label><p>{viewingRow.subject || '—'}</p></div>
                <div><Label className="text-xs text-muted-foreground">Channel</Label><p>{viewingRow.channel || '—'}</p></div>
                <div><Label className="text-xs text-muted-foreground">Sent By</Label><p>{viewingRow.sentBy || '—'}</p></div>
                <div><Label className="text-xs text-muted-foreground">Recipient</Label><p>{viewingRow.recipient || '—'}</p></div>
                <div><Label className="text-xs text-muted-foreground">Related Loan</Label><p>{viewingRow.relatedLoan !== '—' ? <Badge variant="secondary">{viewingRow.relatedLoan}</Badge> : 'General'}</p></div>
                <div><Label className="text-xs text-muted-foreground">Status</Label><p>{viewingRow.status || '—'}</p></div>
              </div>

              {viewingRow.fullContent && (
                <div>
                  <Label className="text-xs text-muted-foreground">Full Message</Label>
                  <div className="prose prose-sm max-w-none mt-1 p-3 bg-muted/30 rounded border border-border" dangerouslySetInnerHTML={{ __html: viewingRow.fullContent }} />
                </div>
              )}

              {viewingRow.attachments?.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Attachments</Label>
                  {viewingRow.attachments.map((att, i) => {
                    const name = typeof att === 'string' ? att : att.name;
                    const path = typeof att === 'object' ? att.storagePath : null;
                    return (
                      <div key={i} className="flex items-center gap-2 text-xs py-1">
                        <Paperclip className="h-3 w-3" /><span>{name}</span>
                        {path && <Button variant="ghost" size="sm" className="h-6 px-1" onClick={async () => {
                          const { data } = await supabase.storage.from('contact-attachments').download(path);
                          if (data) { const url = URL.createObjectURL(data); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url); }
                        }}><FileDown className="h-3 w-3" /></Button>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Conversation Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {addMode === 'email' ? 'Send Email' : addMode === 'call' ? 'Log Call' : addMode === 'portal' ? 'Send Portal Message' : 'Add Internal Note'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select value={newLog.type} onValueChange={v => setNewLog(p => ({ ...p, type: v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent className="z-[9999]">
                  {COMM_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                  {logTypes.filter(t => !COMM_TYPES.includes(t)).map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
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
                <PopoverContent className="w-auto p-0 z-[9999]" align="start"><EnhancedCalendar mode="single" selected={addAsOfDateObj} onSelect={d => { setNewLog(p => ({ ...p, asOfDate: d ? d.toISOString() : '' })); setAddAsOfOpen(false); }} onClear={() => { setNewLog(p => ({ ...p, asOfDate: '' })); setAddAsOfOpen(false); }} onToday={() => { setNewLog(p => ({ ...p, asOfDate: new Date().toISOString() })); setAddAsOfOpen(false); }} initialFocus /></PopoverContent>
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
