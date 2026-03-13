import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { logContactEvent } from '@/hooks/useContactEventJournal';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PortfolioRow {
  id: string;
  loanAccount: string;
  borrowerName: string;
  noteRate: string;
  lenderRate: string;
  regularPayment: string;
  principalBalance: string;
  nextPayment: string;
  maturityDate: string;
  termLeft: string;
  daysLate: string;
  percentOwned: string;
  propertyDescription: string;
}

const ALL_COLUMNS = [
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

const EMPTY_PORTFOLIO: Omit<PortfolioRow, 'id'> = {
  loanAccount: '',
  borrowerName: '',
  noteRate: '',
  lenderRate: '',
  regularPayment: '',
  principalBalance: '',
  nextPayment: '',
  maturityDate: '',
  termLeft: '',
  daysLate: '',
  percentOwned: '',
  propertyDescription: '',
};

interface LenderPortfolioProps {
  lenderId: string;
  contactDbId: string;
}

const LenderPortfolio: React.FC<LenderPortfolioProps> = ({ contactDbId }) => {
  const [rows, setRows] = useState<PortfolioRow[]>([]);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(ALL_COLUMNS.map(c => c.id))
  );
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterDaysLate, setFilterDaysLate] = useState<string>('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newRecord, setNewRecord] = useState<Omit<PortfolioRow, 'id'>>(EMPTY_PORTFOLIO);
  const [isSaving, setIsSaving] = useState(false);

  // Load portfolio from contact_data on mount
  useEffect(() => {
    const loadPortfolio = async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('contact_data')
        .eq('id', contactDbId)
        .single();
      if (!error && data?.contact_data) {
        const cd = data.contact_data as Record<string, any>;
        if (Array.isArray(cd._portfolio)) {
          setRows(cd._portfolio);
        }
      }
    };
    if (contactDbId) loadPortfolio();
  }, [contactDbId]);

  const persistPortfolio = useCallback(async (updatedRows: PortfolioRow[]) => {
    setIsSaving(true);
    try {
      const { data: current, error: fetchErr } = await supabase
        .from('contacts')
        .select('contact_data')
        .eq('id', contactDbId)
        .single();
      if (fetchErr) throw fetchErr;

      const existingData = (current?.contact_data as Record<string, any>) || {};
      const merged = { ...existingData, _portfolio: updatedRows } as any;

      const { error } = await supabase
        .from('contacts')
        .update({ contact_data: merged as any, updated_at: new Date().toISOString() })
        .eq('id', contactDbId);
      if (error) throw error;
    } catch (err: any) {
      console.error('Failed to save portfolio:', err);
      toast.error('Failed to save portfolio record');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [contactDbId]);

  const handleAddRecord = useCallback(async () => {
    const recordWithId: PortfolioRow = {
      ...newRecord,
      id: crypto.randomUUID(),
    };
    const updatedRows = [...rows, recordWithId];
    try {
      await persistPortfolio(updatedRows);
      setRows(updatedRows);
      setNewRecord(EMPTY_PORTFOLIO);
      setAddDialogOpen(false);
      toast.success('Portfolio record added');
      logContactEvent(contactDbId, 'Portfolio', [{ fieldLabel: 'Portfolio Added', oldValue: '', newValue: recordWithId.loanAccount || 'New record' }]);
    } catch {
      // error already toasted
    }
  }, [newRecord, rows, persistPortfolio, contactDbId]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedRows.size === 0) return;
    const updatedRows = rows.filter(r => !selectedRows.has(r.id));
    try {
      await persistPortfolio(updatedRows);
      setRows(updatedRows);
      setSelectedRows(new Set());
      toast.success(`${selectedRows.size} record(s) deleted`);
      logContactEvent(contactDbId, 'Portfolio', [{ fieldLabel: 'Portfolio Deleted', oldValue: `${selectedRows.size} record(s)`, newValue: '(deleted)' }]);
    } catch {
      // error already toasted
    }
  }, [rows, selectedRows, persistPortfolio, contactDbId]);

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
    if (filterDaysLate) {
      const threshold = parseInt(filterDaysLate, 10);
      if (!isNaN(threshold)) {
        result = result.filter(r => parseInt(r.daysLate || '0', 10) >= threshold);
      }
    }
    if (sortCol && sortDir) {
      result = [...result].sort((a, b) => {
        const av = (a as any)[sortCol] || '';
        const bv = (b as any)[sortCol] || '';
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return result;
  }, [rows, search, sortCol, sortDir, filterDaysLate]);

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
      activeColumns.map(c => {
        const val = (r as any)[c.id] || '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    );
    const csv = [headers, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lender_portfolio.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilterDaysLate('');
  };

  const activeFilterCount = filterDaysLate ? 1 : 0;

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-foreground">Portfolio</h4>
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
                      id={`lp-col-${c.id}`}
                      checked={visibleColumns.has(c.id)}
                      onCheckedChange={() => toggleColumn(c.id)}
                    />
                    <label htmlFor={`lp-col-${c.id}`} className="text-xs cursor-pointer">{c.label}</label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          {selectedRows.size > 0 && (
            <Button size="sm" variant="destructive" className="gap-1 h-8 text-xs" onClick={handleDeleteSelected}>
              Delete ({selectedRows.size})
            </Button>
          )}
          <Button size="sm" variant="outline" className="gap-1 h-8 text-xs" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Portfolio
          </Button>
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
              <Filter className="h-3.5 w-3.5" /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <div className="space-y-3">
              <span className="text-sm font-medium">Filter Portfolio</span>
              <div className="space-y-1">
                <Label className="text-xs">Min Days Late</Label>
                <Input
                  type="number"
                  placeholder="e.g. 30"
                  value={filterDaysLate}
                  onChange={e => setFilterDaysLate(e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs w-full" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
        <Button size="sm" variant="outline" className="gap-1 h-8 text-xs" onClick={handleExport}>
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-x-auto">
        <Table className="min-w-[1400px]">
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
                <TableCell colSpan={activeColumns.length + 1} className="text-center py-8 text-muted-foreground text-sm">
                  No portfolio records found. Click "Add Portfolio" to add one.
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
                {activeColumns.map(c => (
                  <TableCell key={c.id} className="whitespace-nowrap text-xs">
                    {(r as any)[c.id] || '-'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add Portfolio Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Portfolio Record</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {ALL_COLUMNS.map(col => (
              <div key={col.id} className="space-y-1">
                <Label className="text-xs">{col.label}</Label>
                <Input
                  className="h-8 text-xs"
                  value={(newRecord as any)[col.id] || ''}
                  onChange={e => setNewRecord(prev => ({ ...prev, [col.id]: e.target.value }))}
                  placeholder={col.label}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAddRecord} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Add Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LenderPortfolio;
