import React, { useState, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Download, Settings2 } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Card, CardContent } from '@/components/ui/card';

interface PortfolioRow {
  id: string;
  dealId: string;
  loanAccount: string;
  borrowerName: string;
  noteRate: string;
  lenderRate: string;
  regularPayment: string;
  principalBalance: string;
  nextPaymentDate: string;
  maturityDate: string;
  loanStatus: string;
}

const ALL_COLUMNS = [
  { id: 'loanAccount', label: 'Loan Account' },
  { id: 'borrowerName', label: 'Borrower Name' },
  { id: 'noteRate', label: 'Note Rate' },
  { id: 'lenderRate', label: 'Lender Rate' },
  { id: 'regularPayment', label: 'Regular Payment' },
  { id: 'principalBalance', label: 'Principal Balance' },
  { id: 'nextPaymentDate', label: 'Next Payment Date' },
  { id: 'maturityDate', label: 'Maturity Date' },
  { id: 'loanStatus', label: 'Loan Status' },
];

interface BrokerPortfolioProps {
  brokerId: string;
  contactDbId: string;
}

async function fetchBrokerPortfolio(contactDbId: string): Promise<PortfolioRow[]> {
  // 1. Get all deal_participants where this contact is a broker
  const { data: participants, error: pErr } = await supabase
    .from('deal_participants')
    .select('deal_id, name')
    .eq('contact_id', contactDbId)
    .eq('role', 'broker');

  if (pErr) throw pErr;
  if (!participants || participants.length === 0) return [];

  const dealIds = [...new Set(participants.map(p => p.deal_id))];

  // 2. Fetch deals
  const { data: deals, error: dErr } = await supabase
    .from('deals')
    .select('id, deal_number, borrower_name, loan_amount, status')
    .in('id', dealIds);

  if (dErr) throw dErr;
  if (!deals) return [];

  // 3. Fetch deal_section_values for loan_terms + borrower
  const { data: sections, error: sErr } = await supabase
    .from('deal_section_values')
    .select('deal_id, section, field_values')
    .in('deal_id', dealIds)
    .in('section', ['loan_terms', 'borrower']);

  if (sErr) throw sErr;

  // Build lookup maps
  const sectionMap: Record<string, Record<string, any>> = {};
  (sections || []).forEach(s => {
    if (!sectionMap[s.deal_id]) sectionMap[s.deal_id] = {};
    sectionMap[s.deal_id][s.section] = s.field_values;
  });

  const fmt = (v: any) => v ? String(v) : '';
  const fmtCurrency = (v: any) => {
    const n = Number(v);
    if (isNaN(n) || !v) return '';
    return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
  };
  const fmtPct = (v: any) => {
    if (!v) return '';
    const n = Number(v);
    if (isNaN(n)) return String(v);
    return `${n}%`;
  };

  // Helper to resolve a field value from section JSONB by searching for matching keys
  const resolveField = (fv: any, ...keyFragments: string[]): string => {
    if (!fv || typeof fv !== 'object') return '';
    // field_values is keyed by UUID or composite keys like "borrower1::{uuid}"
    for (const [key, val] of Object.entries(fv)) {
      const valStr = String(val || '');
      for (const frag of keyFragments) {
        if (key.toLowerCase().includes(frag.toLowerCase())) return valStr;
      }
    }
    return '';
  };

  return deals.map(deal => {
    const loanTerms = sectionMap[deal.id]?.['loan_terms'] || {};
    const borrowerData = sectionMap[deal.id]?.['borrower'] || {};

    // Try to get borrower name from section data, fall back to deal.borrower_name
    const borrowerFromSection = resolveField(borrowerData, 'full_name', 'borrower_name', 'name');
    const borrowerName = borrowerFromSection || deal.borrower_name || '';

    const noteRate = resolveField(loanTerms, 'note_rate', 'interest_rate', 'rate');
    const lenderRate = resolveField(loanTerms, 'lender_rate', 'investor_rate');
    const regularPayment = resolveField(loanTerms, 'regular_payment', 'payment_amount', 'monthly_payment');
    const principalBalance = resolveField(loanTerms, 'principal_balance', 'current_balance', 'outstanding_balance');
    const nextPaymentDate = resolveField(loanTerms, 'next_payment', 'next_due');
    const maturityDate = resolveField(loanTerms, 'maturity_date', 'maturity');

    // Derive loan status
    let loanStatus = 'Active';
    if (deal.status === 'generated') loanStatus = 'Active';
    if (deal.status === 'draft') loanStatus = 'Draft';

    return {
      id: deal.id,
      dealId: deal.id,
      loanAccount: deal.deal_number,
      borrowerName,
      noteRate: fmtPct(noteRate),
      lenderRate: fmtPct(lenderRate),
      regularPayment: fmtCurrency(regularPayment),
      principalBalance: fmtCurrency(principalBalance || deal.loan_amount),
      nextPaymentDate: fmt(nextPaymentDate),
      maturityDate: fmt(maturityDate),
      loanStatus,
    };
  });
}

const BrokerPortfolio: React.FC<BrokerPortfolioProps> = ({ brokerId, contactDbId }) => {
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(ALL_COLUMNS.map(c => c.id))
  );
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  let workspace: any = null;
  try {
    workspace = useWorkspace();
  } catch {
    // workspace context not available
  }

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['broker-portfolio', contactDbId],
    queryFn: () => fetchBrokerPortfolio(contactDbId),
    enabled: !!contactDbId,
  });

  // Summary metrics
  const totalDeals = rows.length;
  const totalLoanVolume = rows.reduce((sum, r) => {
    const n = Number(r.principalBalance.replace(/[^0-9.-]/g, ''));
    return sum + (isNaN(n) ? 0 : n);
  }, 0);
  const activeDeals = rows.filter(r => r.loanStatus === 'Active').length;
  const closedDeals = rows.filter(r => r.loanStatus !== 'Active' && r.loanStatus !== 'Draft').length;

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
    if (filterStatus && filterStatus !== 'all') {
      result = result.filter(r => r.loanStatus === filterStatus);
    }
    if (sortCol && sortDir) {
      result = [...result].sort((a, b) => {
        const av = (a as any)[sortCol] || '';
        const bv = (b as any)[sortCol] || '';
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return result;
  }, [rows, search, sortCol, sortDir, filterStatus]);

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
    a.download = 'broker_portfolio.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRowClick = useCallback((row: PortfolioRow) => {
    if (workspace?.openFile) {
      workspace.openFile({
        id: row.dealId,
        type: 'deal',
        label: row.loanAccount,
      });
    }
  }, [workspace]);

  const clearFilters = () => {
    setFilterStatus('all');
  };

  const activeFilterCount = (filterStatus && filterStatus !== 'all') ? 1 : 0;

  return (
    <div className="space-y-3">
      {/* Summary Metrics */}
      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Total Deals</p>
            <p className="text-lg font-bold text-foreground">{totalDeals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Total Loan Volume</p>
            <p className="text-lg font-bold text-foreground">
              {totalLoanVolume.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Active Deals</p>
            <p className="text-lg font-bold text-foreground">{activeDeals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Closed Deals</p>
            <p className="text-lg font-bold text-foreground">{closedDeals}</p>
          </CardContent>
        </Card>
      </div>

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
                      id={`bp-col-${c.id}`}
                      checked={visibleColumns.has(c.id)}
                      onCheckedChange={() => toggleColumn(c.id)}
                    />
                    <label htmlFor={`bp-col-${c.id}`} className="text-xs cursor-pointer">{c.label}</label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
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
                <Label className="text-xs">Loan Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
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
        <Table className="min-w-[1200px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={activeColumns.length} className="text-center py-8 text-muted-foreground text-sm">
                  Loading portfolio...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={activeColumns.length} className="text-center py-8 text-muted-foreground text-sm">
                  No portfolio records found. Broker has no associated deals.
                </TableCell>
              </TableRow>
            ) : filtered.map(r => (
              <TableRow
                key={r.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(r)}
              >
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
    </div>
  );
};

export default BrokerPortfolio;
