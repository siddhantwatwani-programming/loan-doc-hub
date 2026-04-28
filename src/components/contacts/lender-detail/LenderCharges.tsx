import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { logContactEvent } from '@/hooks/useContactEventJournal';
import { sanitizeInterestInput, normalizeInterestOnBlur } from '@/lib/interestValidation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Filter, Download, Settings2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SortableTableHead from '@/components/deal/SortableTableHead';
import { type SortDirection } from '@/hooks/useGridSortFilter';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { History, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EnhancedCalendar } from '@/components/ui/enhanced-calendar';
import { format } from 'date-fns';

// Predefined Charge Types (no free text allowed)
const CHARGE_TYPE_OPTIONS = [
  'Late Fee',
  'NSF Fee',
  'Inspection Fee',
  'Legal Fee',
  'Servicing Fee',
  'Modification Fee',
  'Demand / Reinstatement Fee',
  'Recording Fee',
  'Wire Fee',
  'Other',
];

interface ChargeAdjustment {
  id: string;
  amount: number; // positive or negative
  remarks: string;
  user: string;
  timestamp: string;
}

interface ChargeHistoryEntry {
  id: string;
  chargeId: string;
  action: 'created' | 'updated' | 'adjusted' | 'deleted';
  field?: string;
  oldValue?: string;
  newValue?: string;
  user: string;
  timestamp: string;
}

interface ChargeRow {
  id: string;
  date: string;
  description: string;
  charge_type?: string;
  interest_rate: string;
  interest_from: string;
  deferred: string;
  loan_account: string;
  owed_to_accounts: string;
  unpaid_balance: string;
  accrued_interest: string;
  total_due_to_you: string;
  total_owed_by_you: string;
  original_amount?: string; // Snapshot of unpaid_balance at creation; never overwritten
  adjustments?: ChargeAdjustment[];
}

const ALL_COLUMNS = [
  { id: 'date', label: 'Date' },
  { id: 'description', label: 'Description' },
  { id: 'interest_rate', label: 'Interest Rate' },
  { id: 'interest_from', label: 'Interest From' },
  { id: 'deferred', label: 'Deferred' },
  { id: 'loan_account', label: 'Loan Account' },
  { id: 'owed_to_accounts', label: 'Owed To Accounts' },
  { id: 'unpaid_balance', label: 'Unpaid Balance' },
  { id: 'accrued_interest', label: 'Accrued Interest' },
  { id: 'total_due_to_you', label: 'Total Due To You' },
  { id: 'total_owed_by_you', label: 'Total Owed By You' },
];

const EMPTY_CHARGE: Omit<ChargeRow, 'id'> = {
  date: '',
  description: '',
  charge_type: '',
  interest_rate: '',
  interest_from: '',
  deferred: '',
  loan_account: '',
  owed_to_accounts: '',
  unpaid_balance: '',
  accrued_interest: '',
  total_due_to_you: '',
  total_owed_by_you: '',
  original_amount: '',
  adjustments: [],
};

const parseMoney = (v: string | number | undefined): number => {
  if (v === undefined || v === null || v === '') return 0;
  const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? 0 : n;
};

const sumAdjustments = (adjs?: ChargeAdjustment[]): number =>
  (adjs || []).reduce((s, a) => s + (Number(a.amount) || 0), 0);

const computeFinal = (row: ChargeRow): number => {
  const original = parseMoney(row.original_amount || row.unpaid_balance);
  return original + sumAdjustments(row.adjustments);
};

interface LenderChargesProps {
  lenderId: string;
  contactDbId: string;
  disabled?: boolean;
}

const LenderCharges: React.FC<LenderChargesProps> = ({ contactDbId, disabled }) => {
  const [rows, setRows] = useState<ChargeRow[]>([]);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(ALL_COLUMNS.map(c => c.id))
  );
  const [filterOpen, setFilterOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newCharge, setNewCharge] = useState<Omit<ChargeRow, 'id'>>(EMPTY_CHARGE);
  const [isSaving, setIsSaving] = useState(false);

  // Adjustment + History state (no UI structure changes to existing grid)
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeChargeId, setActiveChargeId] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustRemarks, setAdjustRemarks] = useState<string>('');
  const [history, setHistory] = useState<ChargeHistoryEntry[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('Unknown');

  // Resolve current user once for audit trail
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserEmail(data.user?.email || data.user?.id || 'Unknown');
    });
  }, []);

  // Load charges + history from contact_data on mount
  useEffect(() => {
    const loadCharges = async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('contact_data')
        .eq('id', contactDbId)
        .single();
      if (!error && data?.contact_data) {
        const cd = data.contact_data as Record<string, any>;
        if (Array.isArray(cd._charges)) {
          // Backfill original_amount + adjustments for legacy rows
          const normalized = cd._charges.map((r: any) => ({
            ...r,
            original_amount: r.original_amount !== undefined ? r.original_amount : (r.unpaid_balance || ''),
            adjustments: Array.isArray(r.adjustments) ? r.adjustments : [],
          })) as ChargeRow[];
          setRows(normalized);
        }
        if (Array.isArray(cd._charges_history)) {
          setHistory(cd._charges_history as ChargeHistoryEntry[]);
        }
      }
    };
    if (contactDbId) loadCharges();
  }, [contactDbId]);

  const persistCharges = useCallback(async (updatedRows: ChargeRow[], updatedHistory?: ChargeHistoryEntry[]) => {
    setIsSaving(true);
    try {
      // Fetch current contact_data first to merge
      const { data: current, error: fetchErr } = await supabase
        .from('contacts')
        .select('contact_data')
        .eq('id', contactDbId)
        .single();
      if (fetchErr) throw fetchErr;

      const existingData = (current?.contact_data as Record<string, any>) || {};
      const merged: any = { ...existingData, _charges: updatedRows };
      if (updatedHistory) merged._charges_history = updatedHistory;

      const { error } = await supabase
        .from('contacts')
        .update({ contact_data: merged as any, updated_at: new Date().toISOString() })
        .eq('id', contactDbId);
      if (error) throw error;
    } catch (err: any) {
      console.error('Failed to save charges:', err);
      toast.error('Failed to save charge');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [contactDbId]);

  const handleAddCharge = useCallback(async () => {
    if (disabled) return;
    const chargeId = crypto.randomUUID();
    const chargeWithId: ChargeRow = {
      ...newCharge,
      id: chargeId,
      // Snapshot original amount so adjustments never overwrite it
      original_amount: newCharge.unpaid_balance || newCharge.original_amount || '',
      adjustments: [],
    };
    const updatedRows = [...rows, chargeWithId];
    const newHistoryEntry: ChargeHistoryEntry = {
      id: crypto.randomUUID(),
      chargeId,
      action: 'created',
      newValue: `${chargeWithId.charge_type || chargeWithId.description || 'Charge'} | $${chargeWithId.original_amount || '0'}`,
      user: currentUserEmail,
      timestamp: new Date().toISOString(),
    };
    const updatedHistory = [...history, newHistoryEntry];
    try {
      await persistCharges(updatedRows, updatedHistory);
      setRows(updatedRows);
      setHistory(updatedHistory);
      setNewCharge(EMPTY_CHARGE);
      setAddDialogOpen(false);
      toast.success('Charge added');
      logContactEvent(contactDbId, 'Charges', [{ fieldLabel: 'Charge Added', oldValue: '', newValue: chargeWithId.charge_type || chargeWithId.description || 'New charge' }]);
    } catch {
      // error already toasted
    }
  }, [newCharge, rows, history, currentUserEmail, persistCharges, contactDbId, disabled]);

  const handleDeleteSelected = useCallback(async () => {
    if (disabled || selectedRows.size === 0) return;
    const updatedRows = rows.filter(r => !selectedRows.has(r.id));
    const deletionEntries: ChargeHistoryEntry[] = Array.from(selectedRows).map(cid => ({
      id: crypto.randomUUID(),
      chargeId: cid,
      action: 'deleted',
      oldValue: rows.find(r => r.id === cid)?.charge_type || rows.find(r => r.id === cid)?.description || '',
      user: currentUserEmail,
      timestamp: new Date().toISOString(),
    }));
    const updatedHistory = [...history, ...deletionEntries];
    try {
      await persistCharges(updatedRows, updatedHistory);
      setRows(updatedRows);
      setHistory(updatedHistory);
      setSelectedRows(new Set());
      toast.success(`${selectedRows.size} charge(s) deleted`);
      logContactEvent(contactDbId, 'Charges', [{ fieldLabel: 'Charges Deleted', oldValue: `${selectedRows.size} charge(s)`, newValue: '(deleted)' }]);
    } catch {
      // error already toasted
    }
  }, [rows, selectedRows, history, currentUserEmail, persistCharges, contactDbId, disabled]);

  // Apply adjustment (does NOT overwrite original_amount; appends to adjustments[])
  const handleApplyAdjustment = useCallback(async () => {
    if (disabled || !activeChargeId) return;
    const amt = parseFloat(adjustAmount);
    if (isNaN(amt) || amt === 0) {
      toast.error('Enter a non-zero adjustment amount');
      return;
    }
    const target = rows.find(r => r.id === activeChargeId);
    if (!target) return;
    const newAdjustment: ChargeAdjustment = {
      id: crypto.randomUUID(),
      amount: amt,
      remarks: adjustRemarks.trim(),
      user: currentUserEmail,
      timestamp: new Date().toISOString(),
    };
    const previousFinal = computeFinal(target);
    const updatedTarget: ChargeRow = {
      ...target,
      adjustments: [...(target.adjustments || []), newAdjustment],
    };
    const newFinal = computeFinal(updatedTarget);
    const updatedRows = rows.map(r => r.id === activeChargeId ? updatedTarget : r);
    const histEntry: ChargeHistoryEntry = {
      id: crypto.randomUUID(),
      chargeId: activeChargeId,
      action: 'adjusted',
      field: 'final_amount',
      oldValue: `$${previousFinal.toFixed(2)}`,
      newValue: `$${newFinal.toFixed(2)} (adj ${amt >= 0 ? '+' : ''}${amt.toFixed(2)}${newAdjustment.remarks ? ` — ${newAdjustment.remarks}` : ''})`,
      user: currentUserEmail,
      timestamp: new Date().toISOString(),
    };
    const updatedHistory = [...history, histEntry];
    try {
      await persistCharges(updatedRows, updatedHistory);
      setRows(updatedRows);
      setHistory(updatedHistory);
      setAdjustAmount('');
      setAdjustRemarks('');
      setAdjustOpen(false);
      toast.success('Adjustment applied');
      logContactEvent(contactDbId, 'Charges', [{ fieldLabel: 'Charge Adjusted', oldValue: histEntry.oldValue || '', newValue: histEntry.newValue || '' }]);
    } catch {
      // error already toasted
    }
  }, [activeChargeId, adjustAmount, adjustRemarks, rows, history, currentUserEmail, persistCharges, contactDbId, disabled]);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : sortDir === 'desc' ? null : 'asc');
      if (sortDir === 'desc') setSortCol(null);
    } else { setSortCol(col); setSortDir('asc'); }
  };

  const activeColumns = useMemo(
    () => ALL_COLUMNS.filter(c => visibleColumns.has(c.id)),
    [visibleColumns]
  );

  const filtered = useMemo(() => {
    let result = rows;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)));
    }
    if (sortCol && sortDir) {
      result = [...result].sort((a, b) => {
        const av = (a as any)[sortCol] || '';
        const bv = (b as any)[sortCol] || '';
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return result;
  }, [rows, search, sortCol, sortDir]);

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

  const toggleColumn = (colId: string) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(colId)) next.delete(colId); else next.add(colId);
      return next;
    });
  };

  const handleExport = () => {
    const headers = activeColumns.map(c => c.label).join(',');
    const csvRows = filtered.map(r =>
      activeColumns.map(c => (r as any)[c.id] || '').join(',')
    );
    const csv = [headers, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lender_charges.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-foreground">Charges</h4>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1 h-8 text-xs">
                <Settings2 className="h-3.5 w-3.5" /> Columns
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="end">
              <div className="space-y-2">
                <span className="text-sm font-medium">Toggle Columns</span>
                {ALL_COLUMNS.map(c => (
                  <div key={c.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`col-${c.id}`}
                      checked={visibleColumns.has(c.id)}
                      onCheckedChange={() => toggleColumn(c.id)}
                    />
                    <label htmlFor={`col-${c.id}`} className="text-xs cursor-pointer">{c.label}</label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          {!disabled && selectedRows.size > 0 && (
            <Button size="sm" variant="destructive" className="gap-1 h-8 text-xs" onClick={handleDeleteSelected}>
              Delete ({selectedRows.size})
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="gap-1 h-8 text-xs"
            onClick={() => { setActiveChargeId(null); setHistoryOpen(true); }}
          >
            <History className="h-3.5 w-3.5" /> History
          </Button>
          {!disabled && (
            <Button size="sm" variant="outline" className="gap-1 h-8 text-xs" onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Add Charge
            </Button>
          )}
        </div>
      </div>

      {/* Toolbar row */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-8 w-[180px] text-xs" />
        </div>
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1 h-8 text-xs">
              <Filter className="h-3.5 w-3.5" /> Filters
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3" align="start">
            <p className="text-xs text-muted-foreground">No filters configured yet.</p>
          </PopoverContent>
        </Popover>
        <Button size="sm" variant="outline" className="gap-1 h-8 text-xs" onClick={handleExport}>
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {!disabled && (
                <TableHead className="w-10 px-2">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedRows.size === filtered.length}
                    onChange={toggleAll}
                    className="rounded border-input"
                  />
                </TableHead>
              )}
              {activeColumns.map(c => (
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
                <TableCell colSpan={activeColumns.length + (disabled ? 0 : 1)} className="text-center py-8 text-muted-foreground text-sm">
                  No charge records found.
                </TableCell>
              </TableRow>
            ) : filtered.map(r => (
              <TableRow key={r.id} className={selectedRows.has(r.id) ? 'bg-primary/5' : ''}>
                {!disabled && (
                  <TableCell className="w-10 px-2">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(r.id)}
                      onChange={() => toggleRow(r.id)}
                      className="rounded border-input"
                    />
                  </TableCell>
                )}
                {activeColumns.map(c => {
                  const val = (r as any)[c.id] || '';
                  let display = val || '-';
                  if (val && (c.id === 'unpaid_balance' || c.id === 'accrued_interest' || c.id === 'total_due_to_you')) {
                    display = `$ ${val}`;
                  } else if (val && c.id === 'interest_rate') {
                    display = `${val} %`;
                  }
                  return (
                    <TableCell key={c.id} className="whitespace-nowrap text-xs">
                      {display}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add Charge Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Charge</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {ALL_COLUMNS.map(col => (
              <div key={col.id} className={`space-y-1 ${col.id === 'total_owed_by_you' ? 'col-span-1' : ''}`}>
                <Label className="text-xs">{col.label}</Label>
                {col.id === 'date' ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full h-8 text-xs justify-start font-normal">
                        {(newCharge as any).date ? (newCharge as any).date : <span className="text-muted-foreground">Date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 !z-[9999]" align="start">
                      <EnhancedCalendar
                        mode="single"
                        selected={(newCharge as any).date ? new Date((newCharge as any).date) : undefined}
                        onSelect={(date) => {
                          setNewCharge(prev => ({ ...prev, date: date ? format(date, 'MM/dd/yyyy') : '' }));
                        }}
                        onClear={() => setNewCharge(prev => ({ ...prev, date: '' }))}
                        onToday={() => setNewCharge(prev => ({ ...prev, date: format(new Date(), 'MM/dd/yyyy') }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                ) : (col.id === 'unpaid_balance' || col.id === 'accrued_interest' || col.id === 'total_due_to_you') ? (
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                    <Input
                      className="h-8 text-xs pl-6"
                      value={(newCharge as any)[col.id] || ''}
                      onChange={e => setNewCharge(prev => ({ ...prev, [col.id]: e.target.value }))}
                      placeholder="0.00"
                      inputMode="decimal"
                    />
                  </div>
                ) : col.id === 'interest_rate' ? (
                  <div className="flex items-center gap-1">
                    <Input
                      className="h-8 text-xs"
                      value={(newCharge as any)[col.id] || ''}
                      onChange={e => setNewCharge(prev => ({ ...prev, [col.id]: sanitizeInterestInput(e.target.value) }))}
                      onBlur={() => { const v = normalizeInterestOnBlur((newCharge as any)[col.id] || '', 2); if (v !== ((newCharge as any)[col.id] || '')) setNewCharge(prev => ({ ...prev, [col.id]: v })); }}
                      placeholder="0.00"
                      inputMode="decimal"
                    />
                    <span className="text-muted-foreground text-xs">%</span>
                  </div>
                ) : (
                  <Input
                    className="h-8 text-xs"
                    value={(newCharge as any)[col.id] || ''}
                    onChange={e => setNewCharge(prev => ({ ...prev, [col.id]: e.target.value }))}
                    placeholder={col.label}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAddCharge} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Add Charge'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LenderCharges;
