import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Download, Settings2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SortableTableHead from '@/components/deal/SortableTableHead';
import { type SortDirection } from '@/hooks/useGridSortFilter';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface PortfolioRow {
  id: string;
  dealId: string;
  loanAccount: string;
  borrowerName: string;
  loanStatus: string;
  loanAmount: number;
  fundedAmount: number;
  brokerFee: number;
  commissionPct: number;
  paymentStatus: string;
  revenueEarned: number;
  dealStage: string;
  lenderAssigned: string;
  noteRate: string;
  regularPayment: string;
  principalBalance: string;
  nextPaymentDate: string;
  maturityDate: string;
}

const ALL_COLUMNS = [
  { id: 'loanAccount', label: 'Account Number' },
  { id: 'borrowerName', label: 'Borrower Name' },
  { id: 'loanStatus', label: 'Loan Status' },
  { id: 'loanAmount', label: 'Loan Amount' },
  { id: 'fundedAmount', label: 'Funded Amount' },
  { id: 'brokerFee', label: 'Broker Fee / Commission' },
  { id: 'commissionPct', label: 'Commission %' },
  { id: 'paymentStatus', label: 'Payment Status' },
  { id: 'revenueEarned', label: 'Revenue Earned' },
  { id: 'dealStage', label: 'Deal Stage' },
  { id: 'lenderAssigned', label: 'Lender Assigned' },
  { id: 'noteRate', label: 'Note Rate' },
  { id: 'regularPayment', label: 'Regular Payment' },
  { id: 'principalBalance', label: 'Principal Balance' },
  { id: 'nextPaymentDate', label: 'Next Payment Date' },
  { id: 'maturityDate', label: 'Maturity Date' },
];

const STATUS_OPTIONS = ['Active', 'Delinquent', 'Closed', 'Default', 'Draft'];
const STAGE_OPTIONS = ['Pipeline', 'Funded', 'Closed', 'Cancelled'];
const PAYMENT_STATUS_OPTIONS = ['Paid', 'Pending', 'Partial'];

interface BrokerPortfolioProps {
  brokerId: string;
  contactDbId: string;
}

const FIELD_IDS = {
  loanAmount: '163cd0b4-7cc0-4975-bcfb-43aa4be9c5c8',
  noteRate: '969b2029-d56f-4789-8d77-1f9aecc88f2b',
  principalBalance: '27c1bee2-05d4-46e5-a16b-e10c1e38cafd',
  maturityDate: '33fadfcb-b70c-4425-944e-23044f21a06b',
  nextPaymentDate: '384a8113-5d6d-47fd-9146-b3b1e9f65037',
  fundingRecords: 'fe607d1f-3d27-4e37-8d10-326ac34d7a3f',
};

function extractFieldValue(fv: Record<string, any>, fieldId: string, key: string): any {
  const entry = fv[fieldId];
  if (!entry) return null;
  if (typeof entry === 'object' && entry !== null) return entry[key] ?? null;
  return entry;
}

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v);
const fmtCurrencyShort = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
const fmtPct = (v: number) => (v != null && !isNaN(v) && v > 0 ? `${v.toFixed(2)}%` : '-');

const fmtDate = (v: any) => {
  if (!v) return '-';
  try {
    const d = new Date(String(v));
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-US');
  } catch { return '-'; }
};

const resolveFieldByFragment = (fv: any, ...keyFragments: string[]): string => {
  if (!fv || typeof fv !== 'object') return '';
  for (const [key, val] of Object.entries(fv)) {
    const valStr = String(val || '');
    for (const frag of keyFragments) {
      if (key.toLowerCase().includes(frag.toLowerCase())) return valStr;
    }
  }
  return '';
};

const parseNum = (v: string) => { const n = Number(v.replace(/[^0-9.-]/g, '')); return isNaN(n) ? 0 : n; };

async function fetchBrokerPortfolio(contactDbId: string, brokerId?: string): Promise<PortfolioRow[]> {
  const { data: participants, error: pErr } = await supabase
    .from('deal_participants')
    .select('deal_id, name')
    .eq('contact_id', contactDbId)
    .eq('role', 'broker');

  if (pErr) throw pErr;

  let allParticipants = participants || [];

  // Fallback: search deal_section_values broker section for broker_id match
  // (mirrors BrokerHistory so saved deals populate even when no participant row exists)
  if (allParticipants.length === 0 && brokerId) {
    const { data: brokerSections } = await supabase
      .from('deal_section_values')
      .select('deal_id, field_values')
      .eq('section', 'broker');

    const matchedDealIds: string[] = [];
    (brokerSections || []).forEach(bs => {
      const fv = bs.field_values as Record<string, any>;
      if (!fv) return;
      for (const v of Object.values(fv)) {
        if (typeof v === 'object' && v !== null && (v as any).value_text === brokerId) {
          matchedDealIds.push(bs.deal_id);
          break;
        }
        if (typeof v === 'string' && v === brokerId) {
          matchedDealIds.push(bs.deal_id);
          break;
        }
      }
    });

    if (matchedDealIds.length > 0) {
      allParticipants = matchedDealIds.map(did => ({ deal_id: did, name: '' }));
    }
  }

  if (allParticipants.length === 0) return [];

  const dealIds = [...new Set(allParticipants.map(p => p.deal_id))];

  const { data: deals, error: dErr } = await supabase
    .from('deals')
    .select('id, deal_number, borrower_name, loan_amount, status')
    .in('id', dealIds);

  if (dErr) throw dErr;
  if (!deals) return [];

  const { data: sections, error: sErr } = await supabase
    .from('deal_section_values')
    .select('deal_id, section, field_values')
    .in('deal_id', dealIds)
    .in('section', ['loan_terms', 'borrower', 'broker', 'origination_fees', 'lender', 'charges']);

  if (sErr) throw sErr;

  const sectionMap: Record<string, Record<string, any>> = {};
  (sections || []).forEach(s => {
    if (!sectionMap[s.deal_id]) sectionMap[s.deal_id] = {};
    sectionMap[s.deal_id][s.section] = s.field_values;
  });

  // Also get lender participants for "Lender Assigned"
  const { data: lenderParticipants } = await supabase
    .from('deal_participants')
    .select('deal_id, name')
    .in('deal_id', dealIds)
    .eq('role', 'lender');

  const lenderMap = new Map<string, string>();
  (lenderParticipants || []).forEach(lp => {
    if (lp.name && !lenderMap.has(lp.deal_id)) {
      lenderMap.set(lp.deal_id, lp.name);
    }
  });

  return deals.map(deal => {
    const loanTerms = sectionMap[deal.id]?.['loan_terms'] || {};
    const brokerData = sectionMap[deal.id]?.['broker'] || {};
    const origFees = sectionMap[deal.id]?.['origination_fees'] || {};
    const borrowerData = sectionMap[deal.id]?.['borrower'] || {};

    // Extract using field dictionary UUIDs first, fall back to fragment matching
    const loanAmountVal = extractFieldValue(loanTerms, FIELD_IDS.loanAmount, 'value_number');
    const noteRateVal = extractFieldValue(loanTerms, FIELD_IDS.noteRate, 'value_number');
    const principalBalanceVal = extractFieldValue(loanTerms, FIELD_IDS.principalBalance, 'value_number');
    const maturityDateVal = extractFieldValue(loanTerms, FIELD_IDS.maturityDate, 'value_date')
                         || extractFieldValue(loanTerms, FIELD_IDS.maturityDate, 'value_text');
    const nextPaymentDateVal = extractFieldValue(loanTerms, FIELD_IDS.nextPaymentDate, 'value_date')
                            || extractFieldValue(loanTerms, FIELD_IDS.nextPaymentDate, 'value_text');

    const borrowerFromSection = resolveFieldByFragment(borrowerData, 'full_name', 'borrower_name', 'name');
    const borrowerName = borrowerFromSection || deal.borrower_name || '';

    const displayLoanAmount = Number(loanAmountVal ?? deal.loan_amount ?? 0);
    const displayNoteRate = Number(noteRateVal ?? 0);
    const displayPrincipalBalance = Number(principalBalanceVal ?? loanAmountVal ?? deal.loan_amount ?? 0);

    // Broker fee / commission - use fragment matching on broker/origFees sections
    const brokerFeeRaw = resolveFieldByFragment(brokerData, 'broker_fee', 'commission', 'fee_amount') ||
      resolveFieldByFragment(origFees, 'broker_fee', 'broker_commission', 'origination_fee');
    const brokerFee = parseNum(brokerFeeRaw);

    // Commission percentage
    const commissionPctRaw = resolveFieldByFragment(brokerData, 'commission_pct', 'fee_pct', 'broker_pct') ||
      resolveFieldByFragment(origFees, 'broker_pct', 'commission_rate');
    let commissionPct = parseNum(commissionPctRaw);
    if (commissionPct === 0 && brokerFee > 0 && displayLoanAmount > 0) {
      commissionPct = (brokerFee / displayLoanAmount) * 100;
    }

    // Funded amount
    const fundedAmountRaw = resolveFieldByFragment(loanTerms, 'funded_amount', 'total_funded', 'disbursed');
    const fundedAmount = parseNum(fundedAmountRaw) || displayLoanAmount;

    // Payment status for broker fee
    const paymentStatusRaw = resolveFieldByFragment(brokerData, 'payment_status', 'fee_status', 'commission_status');
    let paymentStatus = 'Pending';
    if (paymentStatusRaw.toLowerCase().includes('paid')) paymentStatus = 'Paid';
    else if (paymentStatusRaw.toLowerCase().includes('partial')) paymentStatus = 'Partial';

    // Revenue earned
    const revenueEarned = brokerFee > 0 ? brokerFee : (commissionPct > 0 && fundedAmount > 0 ? fundedAmount * (commissionPct / 100) : 0);

    // Deal stage
    let dealStage = 'Pipeline';
    if (deal.status === 'generated') dealStage = 'Funded';
    if (deal.status === 'draft') dealStage = 'Pipeline';
    const stageRaw = resolveFieldByFragment(brokerData, 'deal_stage', 'stage');
    if (stageRaw.toLowerCase().includes('closed')) dealStage = 'Closed';
    if (stageRaw.toLowerCase().includes('cancel')) dealStage = 'Cancelled';

    // Lender assigned
    const lenderAssigned = lenderMap.get(deal.id) || resolveFieldByFragment(loanTerms, 'lender_name', 'lender') || '-';

    // Loan status
    let loanStatus = 'Active';
    if (deal.status === 'generated') loanStatus = 'Active';
    if (deal.status === 'draft') loanStatus = 'Draft';
    const lsRaw = resolveFieldByFragment(loanTerms, 'loan_status', 'status');
    if (lsRaw.toLowerCase().includes('delinquent')) loanStatus = 'Delinquent';
    if (lsRaw.toLowerCase().includes('default')) loanStatus = 'Default';
    if (lsRaw.toLowerCase().includes('closed') || lsRaw.toLowerCase().includes('paid')) loanStatus = 'Closed';

    return {
      id: deal.id,
      dealId: deal.id,
      loanAccount: deal.deal_number,
      borrowerName,
      loanStatus,
      loanAmount: displayLoanAmount,
      fundedAmount,
      brokerFee,
      commissionPct,
      paymentStatus,
      revenueEarned,
      dealStage,
      lenderAssigned,
      noteRate: displayNoteRate > 0 ? `${displayNoteRate}%` : '-',
      regularPayment: displayPrincipalBalance > 0 ? fmtCurrency(displayPrincipalBalance) : '-',
      principalBalance: displayPrincipalBalance > 0 ? fmtCurrency(displayPrincipalBalance) : (deal.loan_amount ? fmtCurrency(deal.loan_amount) : '-'),
      nextPaymentDate: fmtDate(nextPaymentDateVal),
      maturityDate: fmtDate(maturityDateVal),
    };
  });
}
const BrokerPortfolio: React.FC<BrokerPortfolioProps> = ({ brokerId, contactDbId }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(ALL_COLUMNS.map(c => c.id))
  );
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');


  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['broker-portfolio', contactDbId, brokerId],
    queryFn: () => fetchBrokerPortfolio(contactDbId, brokerId),
    enabled: !!contactDbId,
  });

  // Summary metrics
  const summary = useMemo(() => {
    const totalDeals = rows.length;
    const totalLoanVolume = rows.reduce((sum, r) => sum + r.loanAmount, 0);
    const activeDeals = rows.filter(r => r.loanStatus === 'Active').length;
    const closedDeals = rows.filter(r => r.loanStatus === 'Closed').length;
    const totalRevenue = rows.reduce((sum, r) => sum + r.revenueEarned, 0);
    const pendingRevenue = rows.filter(r => r.paymentStatus !== 'Paid').reduce((sum, r) => sum + r.revenueEarned, 0);
    const paidRevenue = rows.filter(r => r.paymentStatus === 'Paid').reduce((sum, r) => sum + r.revenueEarned, 0);
    const delinquentDeals = rows.filter(r => r.loanStatus === 'Delinquent' || r.loanStatus === 'Default').length;
    return { totalDeals, totalLoanVolume, activeDeals, closedDeals, totalRevenue, pendingRevenue, paidRevenue, delinquentDeals };
  }, [rows]);

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
    if (filterStatus !== 'all') result = result.filter(r => r.loanStatus === filterStatus);
    if (filterStage !== 'all') result = result.filter(r => r.dealStage === filterStage);
    if (filterPayment !== 'all') result = result.filter(r => r.paymentStatus === filterPayment);
    if (sortCol && sortDir) {
      result = [...result].sort((a, b) => {
        const av = (a as any)[sortCol];
        const bv = (b as any)[sortCol];
        if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
        return sortDir === 'asc' ? String(av || '').localeCompare(String(bv || '')) : String(bv || '').localeCompare(String(av || ''));
      });
    }
    return result;
  }, [rows, search, sortCol, sortDir, filterStatus, filterStage, filterPayment]);

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
        const val = formatCellValue(c.id, r);
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
    navigate(`/deals/${row.dealId}/data`);
  }, [navigate]);

  const clearFilters = () => {
    setFilterStatus('all');
    setFilterStage('all');
    setFilterPayment('all');
  };

  const activeFilterCount = [filterStatus, filterStage, filterPayment].filter(f => f !== 'all').length;

  const formatCellValue = (colId: string, row: PortfolioRow): string => {
    switch (colId) {
      case 'loanAmount': return fmtCurrency(row.loanAmount);
      case 'fundedAmount': return fmtCurrency(row.fundedAmount);
      case 'brokerFee': return fmtCurrency(row.brokerFee);
      case 'commissionPct': return fmtPct(row.commissionPct);
      case 'revenueEarned': return fmtCurrency(row.revenueEarned);
      default: return String((row as any)[colId] || '-');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delinquent':
      case 'Default':
        return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{status}</Badge>;
      case 'Closed':
        return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{status}</Badge>;
      case 'Active':
        return <Badge className="text-[10px] px-1.5 py-0 bg-emerald-600 hover:bg-emerald-700">{status}</Badge>;
      case 'Draft':
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0">{status}</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return <Badge className="text-[10px] px-1.5 py-0 bg-emerald-600 hover:bg-emerald-700">{status}</Badge>;
      case 'Pending':
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500 text-amber-600">{status}</Badge>;
      case 'Partial':
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-500 text-blue-600">{status}</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0">{status}</Badge>;
    }
  };

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'Funded':
        return <Badge className="text-[10px] px-1.5 py-0 bg-emerald-600 hover:bg-emerald-700">{stage}</Badge>;
      case 'Pipeline':
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-500 text-blue-600">{stage}</Badge>;
      case 'Closed':
        return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{stage}</Badge>;
      case 'Cancelled':
        return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{stage}</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0">{stage}</Badge>;
    }
  };

  const getRowClassName = (row: PortfolioRow) => {
    if (row.loanStatus === 'Delinquent' || row.loanStatus === 'Default') {
      return 'cursor-pointer hover:bg-muted/50 bg-destructive/5 border-l-2 border-l-destructive';
    }
    return 'cursor-pointer hover:bg-muted/50';
  };

  return (
    <div className="space-y-3">
      {/* Summary Metrics */}
      <div className="grid grid-cols-4 gap-3">
        <Card><CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Total Deals</p>
          <p className="text-lg font-bold text-foreground">{summary.totalDeals}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Total Loan Volume</p>
          <p className="text-lg font-bold text-foreground">{fmtCurrencyShort(summary.totalLoanVolume)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Active Deals</p>
          <p className="text-lg font-bold text-foreground">{summary.activeDeals}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Closed Deals</p>
          <p className="text-lg font-bold text-foreground">{summary.closedDeals}</p>
        </CardContent></Card>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <Card><CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Total Revenue</p>
          <p className="text-lg font-bold text-foreground">{fmtCurrencyShort(summary.totalRevenue)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Paid Revenue</p>
          <p className="text-lg font-bold text-emerald-600">{fmtCurrencyShort(summary.paidRevenue)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Pending Revenue</p>
          <p className="text-lg font-bold text-amber-600">{fmtCurrencyShort(summary.pendingRevenue)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <p className="text-xs text-muted-foreground">Delinquent</p>
          <p className={`text-lg font-bold ${summary.delinquentDeals > 0 ? 'text-destructive' : 'text-foreground'}`}>{summary.delinquentDeals}</p>
        </CardContent></Card>
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-foreground">Portfolio</h4>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1 h-8 text-xs"><Settings2 className="h-3.5 w-3.5" /> Columns</Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="end">
              <div className="space-y-2">
                <span className="text-sm font-medium">Toggle Columns</span>
                {ALL_COLUMNS.map(c => (
                  <div key={c.id} className="flex items-center gap-2">
                    <Checkbox id={`bp-col-${c.id}`} checked={visibleColumns.has(c.id)} onCheckedChange={() => toggleColumn(c.id)} />
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
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Deal Stage</Label>
                <Select value={filterStage} onValueChange={setFilterStage}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {STAGE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Payment Status</Label>
                <Select value={filterPayment} onValueChange={setFilterPayment}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {PAYMENT_STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs w-full" onClick={clearFilters}>Clear Filters</Button>
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
        <Table className="min-w-[1800px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              {activeColumns.map(c => (
                <SortableTableHead key={c.id} columnId={c.id} label={c.label} sortColumnId={sortCol} sortDirection={sortDir} onSort={handleSort} className="whitespace-nowrap text-xs" />
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={activeColumns.length} className="text-center py-8 text-muted-foreground text-sm">Loading portfolio...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={activeColumns.length} className="text-center py-8 text-muted-foreground text-sm">No portfolio records found. Broker has no associated deals.</TableCell>
              </TableRow>
            ) : filtered.map(r => (
              <TableRow key={r.id} className={getRowClassName(r)} onClick={() => handleRowClick(r)}>
                {activeColumns.map(c => (
                  <TableCell key={c.id} className="whitespace-nowrap text-xs">
                    {c.id === 'loanStatus' ? getStatusBadge(r.loanStatus) :
                     c.id === 'paymentStatus' ? getPaymentBadge(r.paymentStatus) :
                     c.id === 'dealStage' ? getStageBadge(r.dealStage) :
                     formatCellValue(c.id, r)}
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
