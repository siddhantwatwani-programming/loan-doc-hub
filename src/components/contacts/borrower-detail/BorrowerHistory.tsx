import React, { useState, useMemo, useEffect, useCallback } from 'react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Download, Filter } from 'lucide-react';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import SortableTableHead from '@/components/deal/SortableTableHead';
import { type SortDirection } from '@/hooks/useGridSortFilter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { US_STATES } from '@/lib/usStates';

interface HistoryLoan {
  id: string;
  dealId: string;
  loanAccount: string;
  borrowerName: string;
  propertyAddress: string;
  loanAmount: number;
  loanAmountDisplay: string;
  noteRate: string;
  originationDate: string;
  originationDateRaw: string;
  maturityDate: string;
  currentBalance: string;
  currentBalanceNum: number;
  loanStatus: string;
  nextPaymentDate: string;
  productType: string;
  state: string;
  csrOwner: string;
}

const ALL_COLUMNS = [
  { id: 'loanAccount', label: 'Loan Account' },
  { id: 'borrowerName', label: 'Borrower Name' },
  { id: 'propertyAddress', label: 'Property Address' },
  { id: 'loanAmountDisplay', label: 'Loan Amount' },
  { id: 'noteRate', label: 'Note Rate' },
  { id: 'originationDate', label: 'Origination Date' },
  { id: 'maturityDate', label: 'Maturity Date' },
  { id: 'currentBalance', label: 'Current Balance' },
  { id: 'loanStatus', label: 'Loan Status' },
  { id: 'nextPaymentDate', label: 'Next Payment Date' },
  { id: 'productType', label: 'Product Type' },
  { id: 'state', label: 'State' },
  { id: 'csrOwner', label: 'CSR Owner' },
];

const STATUS_OPTIONS = ['Active', 'Paid Off', 'Default', 'Closed'];

const FIELD_IDS = {
  loanAmount: '163cd0b4-7cc0-4975-bcfb-43aa4be9c5c8',
  noteRate: '969b2029-d56f-4789-8d77-1f9aecc88f2b',
  principalBalance: '27c1bee2-05d4-46e5-a16b-e10c1e38cafd',
  maturityDate: '33fadfcb-b70c-4425-944e-23044f21a06b',
  nextPaymentDate: '384a8113-5d6d-47fd-9146-b3b1e9f65037',
  nextPayment: '18cff33e-9553-4860-becf-e6c4b54f2a20',
};

const formatCurrency = (val: any) => {
  if (val == null || val === '') return '-';
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
};

const formatDate = (val: any) => {
  if (!val) return '-';
  try {
    const d = new Date(String(val));
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-US');
  } catch { return '-'; }
};

const formatPercent = (val: any) => {
  if (val == null || val === '') return '-';
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  if (isNaN(num)) return '-';
  return `${num}%`;
};

const extractFieldValue = (fieldValues: Record<string, any>, fieldId: string, valueKey: string): any => {
  const entry = fieldValues[fieldId];
  if (!entry) return null;
  if (typeof entry === 'object' && entry !== null) return entry[valueKey] ?? null;
  return entry;
};

const formatSummaryCurrency = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

interface Props { borrowerId: string; contactDbId?: string; }

const BorrowerHistory: React.FC<Props> = ({ borrowerId, contactDbId }) => {
  
  const [rows, setRows] = useState<HistoryLoan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string | null>('originationDate');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [productTypeFilter, setProductTypeFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  useEffect(() => {
    const lookupId = contactDbId || borrowerId;
    if (!lookupId) return;
    const load = async () => {
      setIsLoading(true);
      try {
        // 1. Find all deal_participants for this contact as borrower
        const { data: participants, error: pErr } = await supabase
          .from('deal_participants')
          .select('deal_id, name')
          .eq('contact_id', contactDbId || '')
          .eq('role', 'borrower');

        // Also try by borrower contact_id string if contactDbId didn't match
        let allParticipants = participants || [];
        if ((!participants || participants.length === 0) && borrowerId) {
          // Search via deal_section_values borrower section for borrower_id match
          const { data: borrowerSections } = await supabase
            .from('deal_section_values')
            .select('deal_id, field_values')
            .eq('section', 'borrower');

          const matchedDealIds: string[] = [];
          (borrowerSections || []).forEach(bs => {
            const fv = bs.field_values as Record<string, any>;
            if (fv) {
              const vals = Object.values(fv);
              for (const v of vals) {
                if (typeof v === 'object' && v !== null) {
                  if (v.value_text === borrowerId) {
                    matchedDealIds.push(bs.deal_id);
                    break;
                  }
                }
                if (typeof v === 'string' && v === borrowerId) {
                  matchedDealIds.push(bs.deal_id);
                  break;
                }
              }
            }
          });

          if (matchedDealIds.length > 0) {
            allParticipants = matchedDealIds.map(did => ({ deal_id: did, name: null }));
          }
        }

        if (allParticipants.length === 0) {
          setRows([]);
          setIsLoading(false);
          return;
        }

        const dealIds = [...new Set(allParticipants.map(p => p.deal_id))];

        // 2. Fetch deals
        const { data: deals, error: dErr } = await supabase
          .from('deals')
          .select('id, deal_number, loan_amount, status, borrower_name, property_address, product_type, state, created_by')
          .in('id', dealIds);

        if (dErr) throw dErr;

        // 3. Fetch loan_terms section values
        const { data: loanTermsSections } = await supabase
          .from('deal_section_values')
          .select('deal_id, field_values')
          .in('deal_id', dealIds)
          .eq('section', 'loan_terms');

        const loanTermsMap = new Map<string, Record<string, any>>();
        (loanTermsSections || []).forEach(sv => {
          loanTermsMap.set(sv.deal_id, sv.field_values as Record<string, any>);
        });

        // 4. Fetch borrower section values for origination date
        const { data: borrowerSections } = await supabase
          .from('deal_section_values')
          .select('deal_id, field_values')
          .in('deal_id', dealIds)
          .eq('section', 'borrower');

        const borrowerMap = new Map<string, Record<string, any>>();
        (borrowerSections || []).forEach(sv => {
          borrowerMap.set(sv.deal_id, sv.field_values as Record<string, any>);
        });

        // 5. Fetch CSR owner profiles
        const creatorIds = [...new Set((deals || []).map(d => d.created_by).filter(Boolean))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', creatorIds);

        const profileMap = new Map<string, string>();
        (profiles || []).forEach(p => { profileMap.set(p.user_id, p.full_name || ''); });

        const dealsMap = new Map((deals || []).map(d => [d.id, d]));

        // Build rows
        const seenDeals = new Set<string>();
        const historyRows: HistoryLoan[] = [];

        for (const p of allParticipants) {
          if (seenDeals.has(p.deal_id)) continue;
          seenDeals.add(p.deal_id);

          const deal = dealsMap.get(p.deal_id);
          if (!deal) continue;

          const loanTerms = loanTermsMap.get(p.deal_id) || {};
          const borrowerData = borrowerMap.get(p.deal_id) || {};

          // Extract field values
          const loanAmountVal = extractFieldValue(loanTerms, FIELD_IDS.loanAmount, 'value_number');
          const noteRateVal = extractFieldValue(loanTerms, FIELD_IDS.noteRate, 'value_number');
          const principalBalanceVal = extractFieldValue(loanTerms, FIELD_IDS.principalBalance, 'value_number');
          const maturityDateVal = extractFieldValue(loanTerms, FIELD_IDS.maturityDate, 'value_date')
                               || extractFieldValue(loanTerms, FIELD_IDS.maturityDate, 'value_text');
          const nextPaymentDateVal = extractFieldValue(loanTerms, FIELD_IDS.nextPaymentDate, 'value_date')
                                   || extractFieldValue(loanTerms, FIELD_IDS.nextPaymentDate, 'value_text')
                                   || extractFieldValue(loanTerms, FIELD_IDS.nextPayment, 'value_date')
                                   || extractFieldValue(loanTerms, FIELD_IDS.nextPayment, 'value_text');

          // Try to find origination date from loan_terms or borrower section
          let originationDateVal: any = null;
          // Check common origination date keys in loan terms
          for (const [, val] of Object.entries(loanTerms)) {
            if (typeof val === 'object' && val !== null && val.label) {
              const label = String(val.label).toLowerCase();
              if (label.includes('origination') && label.includes('date')) {
                originationDateVal = val.value_date || val.value_text;
                break;
              }
            }
          }
          // Fallback to deal created_at
          if (!originationDateVal) {
            originationDateVal = deal.created_by ? null : null;
          }

          // Determine loan status
          let loanStatus = 'Active';
          const storedStatus = loanTerms['loan_status'] || loanTerms['status'];
          if (typeof storedStatus === 'string') {
            const lower = storedStatus.toLowerCase();
            if (lower.includes('closed') || lower.includes('paid')) loanStatus = lower.includes('paid') ? 'Paid Off' : 'Closed';
            if (lower.includes('default')) loanStatus = 'Default';
          }
          if (deal.status === 'generated') loanStatus = loanStatus; // keep derived

          const displayLoanAmount = loanAmountVal ?? deal.loan_amount;
          const displayBalance = principalBalanceVal ?? loanAmountVal ?? deal.loan_amount;
          const loanAmountNum = typeof displayLoanAmount === 'number' ? displayLoanAmount : parseFloat(String(displayLoanAmount || '0')) || 0;
          const balanceNum = typeof displayBalance === 'number' ? displayBalance : parseFloat(String(displayBalance || '0')) || 0;

          historyRows.push({
            id: p.deal_id,
            dealId: p.deal_id,
            loanAccount: deal.deal_number || '-',
            borrowerName: deal.borrower_name || p.name || '-',
            propertyAddress: deal.property_address || '-',
            loanAmount: loanAmountNum,
            loanAmountDisplay: formatCurrency(displayLoanAmount),
            noteRate: formatPercent(noteRateVal),
            originationDate: formatDate(originationDateVal),
            originationDateRaw: originationDateVal ? String(originationDateVal) : '',
            maturityDate: formatDate(maturityDateVal),
            currentBalance: formatCurrency(displayBalance),
            currentBalanceNum: balanceNum,
            loanStatus,
            nextPaymentDate: formatDate(nextPaymentDateVal),
            productType: deal.product_type || '-',
            state: deal.state || '-',
            csrOwner: profileMap.get(deal.created_by) || '-',
          });
        }

        setRows(historyRows);
      } catch (err) {
        console.error('Failed to load borrower history:', err);
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [contactDbId, borrowerId]);

  // Summary metrics
  const summary = useMemo(() => {
    const totalLoans = rows.length;
    const activeLoans = rows.filter(r => r.loanStatus === 'Active').length;
    const closedLoans = rows.filter(r => r.loanStatus === 'Closed' || r.loanStatus === 'Paid Off').length;
    const totalVolume = rows.reduce((s, r) => s + r.loanAmount, 0);
    const avgSize = totalLoans > 0 ? totalVolume / totalLoans : 0;
    return { totalLoans, activeLoans, closedLoans, totalVolume, avgSize };
  }, [rows]);

  // Product types from data
  const productTypes = useMemo(() => {
    const set = new Set(rows.map(r => r.productType).filter(p => p && p !== '-'));
    return Array.from(set).sort();
  }, [rows]);

  // States from data
  const statesInData = useMemo(() => {
    const set = new Set(rows.map(r => r.state).filter(s => s && s !== '-'));
    return Array.from(set).sort();
  }, [rows]);

  const handleSort = useCallback((col: string) => {
    if (sortCol === col) {
      setSortDir(prev => prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc');
      if (sortDir === 'desc') setSortCol(null);
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  }, [sortCol, sortDir]);

  const filtered = useMemo(() => {
    let result = rows;

    // Global search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        r.loanAccount.toLowerCase().includes(q) ||
        r.borrowerName.toLowerCase().includes(q) ||
        r.propertyAddress.toLowerCase().includes(q) ||
        r.productType.toLowerCase().includes(q) ||
        r.state.toLowerCase().includes(q)
      );
    }

    // Filters
    if (statusFilter !== 'all') {
      result = result.filter(r => r.loanStatus === statusFilter);
    }
    if (stateFilter !== 'all') {
      result = result.filter(r => r.state === stateFilter);
    }
    if (productTypeFilter !== 'all') {
      result = result.filter(r => r.productType === productTypeFilter);
    }
    if (minAmount) {
      const min = parseFloat(minAmount);
      if (!isNaN(min)) result = result.filter(r => r.loanAmount >= min);
    }
    if (maxAmount) {
      const max = parseFloat(maxAmount);
      if (!isNaN(max)) result = result.filter(r => r.loanAmount <= max);
    }

    // Sort
    if (sortCol && sortDir) {
      result = [...result].sort((a, b) => {
        let av: any, bv: any;
        if (sortCol === 'loanAmountDisplay') { av = a.loanAmount; bv = b.loanAmount; }
        else if (sortCol === 'currentBalance') { av = a.currentBalanceNum; bv = b.currentBalanceNum; }
        else if (sortCol === 'originationDate') { av = a.originationDateRaw; bv = b.originationDateRaw; }
        else { av = (a as any)[sortCol] || ''; bv = (b as any)[sortCol] || ''; }

        if (typeof av === 'number' && typeof bv === 'number') {
          return sortDir === 'asc' ? av - bv : bv - av;
        }
        return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
    }

    return result;
  }, [rows, search, statusFilter, stateFilter, productTypeFilter, minAmount, maxAmount, sortCol, sortDir]);

  const handleRowClick = (row: HistoryLoan) => {
    navigate(`/deals/${row.dealId}`);
  };

  const handleExport = () => {
    const headers = ALL_COLUMNS.map(c => c.label).join(',');
    const csvRows = filtered.map(r =>
      ALL_COLUMNS.map(c => `"${String((r as any)[c.id] || '').replace(/"/g, '""')}"`).join(',')
    );
    const csv = [headers, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'borrower_history.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeFilterCount = [statusFilter, stateFilter, productTypeFilter].filter(f => f !== 'all').length
    + (minAmount ? 1 : 0) + (maxAmount ? 1 : 0);

  const clearFilters = () => {
    setStatusFilter('all');
    setStateFilter('all');
    setProductTypeFilter('all');
    setMinAmount('');
    setMaxAmount('');
  };

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-foreground">History</h4>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="border border-border rounded-lg p-3 bg-muted/30">
          <p className="text-xs text-muted-foreground">Total Loans</p>
          <p className="text-xl font-semibold text-foreground">{summary.totalLoans}</p>
        </div>
        <div className="border border-border rounded-lg p-3 bg-muted/30">
          <p className="text-xs text-muted-foreground">Total Loan Volume</p>
          <p className="text-xl font-semibold text-foreground">{formatSummaryCurrency(summary.totalVolume)}</p>
        </div>
        <div className="border border-border rounded-lg p-3 bg-muted/30">
          <p className="text-xs text-muted-foreground">Active Loans</p>
          <p className="text-xl font-semibold text-foreground">{summary.activeLoans}</p>
        </div>
        <div className="border border-border rounded-lg p-3 bg-muted/30">
          <p className="text-xs text-muted-foreground">Closed Loans</p>
          <p className="text-xl font-semibold text-foreground">{summary.closedLoans}</p>
        </div>
        <div className="border border-border rounded-lg p-3 bg-muted/30">
          <p className="text-xs text-muted-foreground">Average Loan Size</p>
          <p className="text-xl font-semibold text-foreground">{formatSummaryCurrency(summary.avgSize)}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 space-y-3" align="start">
              <div className="space-y-1">
                <Label className="text-xs">Loan Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">State</Label>
                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {statesInData.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Product Type</Label>
                <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {productTypes.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Loan Amount Range</Label>
                <div className="flex gap-2">
                  <Input placeholder="Min" value={minAmount} onChange={e => setMinAmount(e.target.value)} className="h-8" type="number" min="0" />
                  <Input placeholder="Max" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} className="h-8" type="number" min="0" />
                </div>
              </div>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full text-xs">
                  Clear All Filters
                </Button>
              )}
            </PopoverContent>
          </Popover>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search loans..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 w-[220px]" />
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-1">
          <Download className="h-4 w-4" /> Export
        </Button>
      </div>

      {/* Data Grid */}
      <div className="border border-border rounded-lg overflow-x-auto">
        <Table className="min-w-[1800px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              {ALL_COLUMNS.map(c => (
                <SortableTableHead
                  key={c.id}
                  columnId={c.id}
                  label={c.label}
                  sortColumnId={sortCol}
                  sortDirection={sortDir}
                  onSort={handleSort}
                />
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={ALL_COLUMNS.length} className="text-center py-8 text-muted-foreground">
                  Loading history...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={ALL_COLUMNS.length} className="text-center py-8 text-muted-foreground">
                  No loan history found for this borrower.
                </TableCell>
              </TableRow>
            ) : filtered.map(r => (
              <TableRow key={r.id}>
                {ALL_COLUMNS.map(c => (
                  <TableCell key={c.id} className="whitespace-nowrap">
                    {c.id === 'loanStatus' ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.loanStatus === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        r.loanStatus === 'Default' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {r.loanStatus}
                      </span>
                    ) : (
                      (r as any)[c.id] || '-'
                    )}
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

export default BorrowerHistory;
