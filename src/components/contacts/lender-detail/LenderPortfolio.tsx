import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Download, Settings2, Filter, Loader2 } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import SortableTableHead from '@/components/deal/SortableTableHead';
import { type SortDirection } from '@/hooks/useGridSortFilter';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, differenceInMonths, differenceInDays } from 'date-fns';

// Field dictionary UUIDs
const FIELD_IDS = {
  loanAmount: '163cd0b4-7cc0-4975-bcfb-43aa4be9c5c8',
  noteRate: '969b2029-d56f-4789-8d77-1f9aecc88f2b',
  principalBalance: '27c1bee2-05d4-46e5-a16b-e10c1e38cafd',
  maturityDate: '33fadfcb-b70c-4425-944e-23044f21a06b',
  nextPaymentDate: '384a8113-5d6d-47fd-9146-b3b1e9f65037',
  closingDate: 'a1b2c3d4-0000-0000-0000-000000000001', // placeholder – will fall back
};

interface PortfolioRow {
  id: string;
  dealId: string;
  dealNumber: string;
  borrowerName: string;
  propertyAddress: string;
  loanAmount: number;
  capacity: string;
  fundingAmount: number;
  ownershipPct: number;
  noteRate: number;
  lenderRate: number;
  originationDate: string;
  maturityDate: string;
  paymentFrequency: string;
  outstandingBalance: number;
  accruedInterest: number;
  lastPaymentDate: string;
  totalPaymentsReceived: number;
  loanStatus: string;
  nextPaymentDate: string;
  termLeft: string;
  daysLate: number;
  regularPayment: number;
}

const ALL_COLUMNS = [
  { id: 'dealNumber', label: 'Deal Number' },
  { id: 'borrowerName', label: 'Borrower Name' },
  { id: 'propertyAddress', label: 'Property Address' },
  { id: 'loanAmount', label: 'Loan Amount' },
  { id: 'capacity', label: 'Capacity' },
  { id: 'fundingAmount', label: 'Funding Amount' },
  { id: 'ownershipPct', label: '% Owned' },
  { id: 'noteRate', label: 'Note Rate' },
  { id: 'lenderRate', label: 'Lender Rate' },
  { id: 'regularPayment', label: 'Regular Payment' },
  { id: 'outstandingBalance', label: 'Outstanding Balance' },
  { id: 'maturityDate', label: 'Maturity Date' },
  { id: 'nextPaymentDate', label: 'Next Payment' },
  { id: 'termLeft', label: 'Term Left' },
  { id: 'daysLate', label: 'Days Late' },
  { id: 'loanStatus', label: 'Loan Status' },
];

const CAPACITY_OPTIONS = [
  'Primary Lender', 'Participant Lender', 'Syndicate Lender', 'Authorized Party',
];
const STATUS_OPTIONS = ['Active', 'Paid Off', 'Default'];

function extractFieldValue(fv: Record<string, any>, fieldId: string, key: string): any {
  const entry = fv[fieldId];
  if (!entry) return null;
  if (typeof entry === 'object' && entry !== null) return entry[key] ?? null;
  return entry;
}

function parseFundingRecords(fv: Record<string, any>): any[] {
  const raw = fv['loan_terms.funding_records'];
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (typeof parsed === 'object' && parsed !== null) {
      const val = parsed.value_json || parsed.value_text;
      const records = val ? (typeof val === 'string' ? JSON.parse(val) : val) : parsed;
      if (Array.isArray(records)) return records;
    }
  } catch { /* ignore */ }
  return [];
}

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v);

const fmtPct = (v: number) => (v != null && !isNaN(v) ? `${v.toFixed(2)}%` : '-');

const fmtDate = (v: string) => {
  if (!v) return '-';
  try { return format(parseISO(v), 'MM/dd/yyyy'); } catch { return '-'; }
};

function calcTermLeft(matStr: string): string {
  if (!matStr) return '-';
  try {
    const m = differenceInMonths(parseISO(matStr), new Date());
    if (m <= 0) return 'Matured';
    const y = Math.floor(m / 12);
    const r = m % 12;
    return y > 0 ? `${y}y ${r}m` : `${r}m`;
  } catch { return '-'; }
}

function calcDaysLate(nextStr: string): number {
  if (!nextStr) return 0;
  try {
    const d = differenceInDays(new Date(), parseISO(nextStr));
    return d > 0 ? d : 0;
  } catch { return 0; }
}

interface LenderPortfolioProps {
  lenderId: string;
  contactDbId: string;
}

const LenderPortfolio: React.FC<LenderPortfolioProps> = ({ lenderId, contactDbId }) => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<PortfolioRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(ALL_COLUMNS.map(c => c.id))
  );
  const [capacityFilter, setCapacityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadPortfolio = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Find deals where this contact is a lender participant
      const { data: participants, error: pErr } = await supabase
        .from('deal_participants')
        .select('deal_id, role, name')
        .eq('contact_id', contactDbId)
        .eq('role', 'lender');

      if (pErr) throw pErr;
      if (!participants || participants.length === 0) {
        setRows([]);
        setIsLoading(false);
        return;
      }

      const dealIds = [...new Set(participants.map(p => p.deal_id))];

      // 2. Fetch deals
      const { data: deals } = await supabase
        .from('deals')
        .select('id, deal_number, borrower_name, property_address, loan_amount, status')
        .in('id', dealIds);

      const dealsMap = new Map((deals || []).map(d => [d.id, d]));

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

      // 4. Fetch participants section for capacity info
      const { data: participantSections } = await supabase
        .from('deal_section_values')
        .select('deal_id, field_values')
        .in('deal_id', dealIds)
        .eq('section', 'participants');

      const capacityMap = new Map<string, string>();
      (participantSections || []).forEach(ps => {
        const fv = ps.field_values as Record<string, any>;
        if (!fv) return;
        // Scan for capacity keys associated with this contact
        Object.entries(fv).forEach(([key, val]) => {
          if (key.includes('capacity') && typeof val === 'string') {
            const contactKey = key.replace('capacity', 'contact_id');
            if (fv[contactKey] === contactDbId) {
              capacityMap.set(ps.deal_id, val);
            }
          }
        });
      });

      // 5. Build rows
      const portfolioRows: PortfolioRow[] = [];

      for (const dealId of dealIds) {
        const deal = dealsMap.get(dealId);
        if (!deal) continue;

        const lt = loanTermsMap.get(dealId) || {};
        const fundingRecords = parseFundingRecords(lt);

        // Find the funding record for this lender
        const fundingRec = fundingRecords.find(
          r => r.lenderAccount === lenderId || r.lenderName === lenderId
        ) || null;

        const totalLoanAmount = Number(
          extractFieldValue(lt, FIELD_IDS.loanAmount, 'value_number') || deal.loan_amount || 0
        );
        const noteRateVal = Number(
          extractFieldValue(lt, FIELD_IDS.noteRate, 'value_number') || 0
        );
        const principalBalanceFull = Number(
          extractFieldValue(lt, FIELD_IDS.principalBalance, 'value_number') || totalLoanAmount
        );
        const maturityDateVal =
          extractFieldValue(lt, FIELD_IDS.maturityDate, 'value_date') ||
          extractFieldValue(lt, FIELD_IDS.maturityDate, 'value_text') || '';
        const nextPaymentVal =
          extractFieldValue(lt, FIELD_IDS.nextPaymentDate, 'value_date') ||
          extractFieldValue(lt, FIELD_IDS.nextPaymentDate, 'value_text') || '';

        // Lender-specific from funding record
        const pctOwned = fundingRec ? Number(fundingRec.pctOwned || 0) : 0;
        const lenderRate = fundingRec ? Number(fundingRec.lenderRate || 0) : 0;
        const regularPayment = fundingRec ? Number(fundingRec.regularPayment || 0) : 0;
        const fundingAmount = fundingRec ? Number(fundingRec.originalAmount || 0) : 0;
        const lenderBalance = pctOwned > 0
          ? principalBalanceFull * (pctOwned / 100)
          : (fundingRec ? Number(fundingRec.principalBalance || 0) : 0);

        // Capacity from participant section or derive from role
        const rawCapacity = capacityMap.get(dealId) || '';
        const CAPACITY_MAP: Record<string, string> = {
          primary_lender: 'Primary Lender',
          participant_lender: 'Participant Lender',
          syndicate_lender: 'Syndicate Lender',
          authorized_party: 'Authorized Party',
        };
        const displayCapacity = CAPACITY_MAP[rawCapacity] || 'Primary Lender';

        // Ownership percentage
        const ownershipPct = totalLoanAmount > 0
          ? (fundingAmount / totalLoanAmount) * 100
          : pctOwned;

        // Loan status
        let loanStatus = 'Active';
        const lsRaw = lt['loan_status'] || lt['status'] || '';
        if (typeof lsRaw === 'string') {
          if (lsRaw.toLowerCase().includes('paid') || lsRaw.toLowerCase().includes('closed')) loanStatus = 'Paid Off';
          if (lsRaw.toLowerCase().includes('default')) loanStatus = 'Default';
        }
        if (deal.status === 'generated') loanStatus = 'Active';

        const daysLate = calcDaysLate(nextPaymentVal);

        portfolioRows.push({
          id: `${dealId}-${lenderId}`,
          dealId,
          dealNumber: deal.deal_number || '-',
          borrowerName: deal.borrower_name || '-',
          propertyAddress: deal.property_address || '-',
          loanAmount: totalLoanAmount,
          capacity: displayCapacity,
          fundingAmount,
          ownershipPct: ownershipPct > 0 ? ownershipPct : pctOwned,
          noteRate: noteRateVal,
          lenderRate,
          originationDate: '',
          maturityDate: maturityDateVal,
          paymentFrequency: 'Monthly',
          outstandingBalance: lenderBalance,
          accruedInterest: 0,
          lastPaymentDate: '',
          totalPaymentsReceived: 0,
          loanStatus,
          nextPaymentDate: nextPaymentVal,
          termLeft: calcTermLeft(maturityDateVal),
          daysLate,
          regularPayment,
        });
      }

      setRows(portfolioRows);
    } catch (err) {
      console.error('Failed to load lender portfolio:', err);
    } finally {
      setIsLoading(false);
    }
  }, [lenderId, contactDbId]);

  useEffect(() => {
    if (contactDbId) loadPortfolio();
  }, [contactDbId, loadPortfolio]);

  // Summary metrics
  const summary = useMemo(() => {
    const totalLoans = rows.length;
    const totalInvested = rows.reduce((s, r) => s + r.fundingAmount, 0);
    const totalOutstanding = rows.reduce((s, r) => s + r.outstandingBalance, 0);
    const activeLoans = rows.filter(r => r.loanStatus === 'Active').length;
    return { totalLoans, totalInvested, totalOutstanding, activeLoans };
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
      result = result.filter(r =>
        r.dealNumber.toLowerCase().includes(q) ||
        r.borrowerName.toLowerCase().includes(q) ||
        r.propertyAddress.toLowerCase().includes(q)
      );
    }
    if (capacityFilter !== 'all') {
      result = result.filter(r => r.capacity === capacityFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter(r => r.loanStatus === statusFilter);
    }
    if (sortCol && sortDir) {
      result = [...result].sort((a, b) => {
        const av = (a as any)[sortCol];
        const bv = (b as any)[sortCol];
        if (typeof av === 'number' && typeof bv === 'number') {
          return sortDir === 'asc' ? av - bv : bv - av;
        }
        return sortDir === 'asc'
          ? String(av || '').localeCompare(String(bv || ''))
          : String(bv || '').localeCompare(String(av || ''));
      });
    }
    return result;
  }, [rows, search, sortCol, sortDir, capacityFilter, statusFilter]);

  const toggleColumn = (colId: string) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      next.has(colId) ? next.delete(colId) : next.add(colId);
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
    a.download = 'lender_portfolio.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRowClick = (row: PortfolioRow) => {
    navigate(`/deals/${row.dealId}`);
  };

  const formatCellValue = (colId: string, row: PortfolioRow): string => {
    switch (colId) {
      case 'loanAmount': return fmtCurrency(row.loanAmount);
      case 'fundingAmount': return fmtCurrency(row.fundingAmount);
      case 'ownershipPct': return fmtPct(row.ownershipPct);
      case 'noteRate': return fmtPct(row.noteRate);
      case 'lenderRate': return fmtPct(row.lenderRate);
      case 'regularPayment': return fmtCurrency(row.regularPayment);
      case 'outstandingBalance': return fmtCurrency(row.outstandingBalance);
      case 'maturityDate': return fmtDate(row.maturityDate);
      case 'nextPaymentDate': return fmtDate(row.nextPaymentDate);
      case 'daysLate': return row.daysLate > 0 ? String(row.daysLate) : '0';
      default: return String((row as any)[colId] || '-');
    }
  };

  const fmtSumCurrency = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-foreground">Portfolio</h4>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border border-border rounded-lg p-3 bg-muted/30">
          <p className="text-xs text-muted-foreground">Total Loans</p>
          <p className="text-xl font-semibold text-foreground">{summary.totalLoans}</p>
        </div>
        <div className="border border-border rounded-lg p-3 bg-muted/30">
          <p className="text-xs text-muted-foreground">Active Loans</p>
          <p className="text-xl font-semibold text-foreground">{summary.activeLoans}</p>
        </div>
        <div className="border border-border rounded-lg p-3 bg-muted/30">
          <p className="text-xs text-muted-foreground">Total Invested</p>
          <p className="text-xl font-semibold text-foreground">{fmtSumCurrency(summary.totalInvested)}</p>
        </div>
        <div className="border border-border rounded-lg p-3 bg-muted/30">
          <p className="text-xs text-muted-foreground">Total Outstanding</p>
          <p className="text-xl font-semibold text-foreground">{fmtSumCurrency(summary.totalOutstanding)}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search deals..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-7 h-8 w-[200px] text-xs"
          />
        </div>
        <Select value={capacityFilter} onValueChange={setCapacityFilter}>
          <SelectTrigger className="h-8 w-[160px] text-xs">
            <SelectValue placeholder="Capacity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Capacities</SelectItem>
            {CAPACITY_OPTIONS.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_OPTIONS.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" className="gap-1 h-8 text-xs" onClick={handleExport}>
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
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
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-x-auto">
        <Table className="min-w-[1600px]">
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
                <TableCell colSpan={activeColumns.length} className="text-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={activeColumns.length} className="text-center py-8 text-muted-foreground text-sm">
                  No loans found for this lender. Portfolio will automatically populate when this lender is added to the Funding section of a loan.
                </TableCell>
              </TableRow>
            ) : filtered.map(r => (
              <TableRow
                key={r.id}
                className="cursor-pointer hover:bg-muted/60"
                onClick={() => handleRowClick(r)}
              >
                {activeColumns.map(c => (
                  <TableCell key={c.id} className="whitespace-nowrap text-xs">
                    {formatCellValue(c.id, r)}
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

export default LenderPortfolio;
