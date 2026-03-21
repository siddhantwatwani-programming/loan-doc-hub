import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Download, Settings2, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SortableTableHead from '@/components/deal/SortableTableHead';
import { type SortDirection } from '@/hooks/useGridSortFilter';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, differenceInMonths, parseISO, format } from 'date-fns';

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

// Field dictionary UUIDs for loan_terms fields
const FIELD_IDS = {
  loanAmount: '163cd0b4-7cc0-4975-bcfb-43aa4be9c5c8',
  noteRate: '969b2029-d56f-4789-8d77-1f9aecc88f2b',
  principalBalance: '27c1bee2-05d4-46e5-a16b-e10c1e38cafd',
  maturityDate: '33fadfcb-b70c-4425-944e-23044f21a06b',
  nextPaymentDate: '384a8113-5d6d-47fd-9146-b3b1e9f65037',
};

interface LenderPortfolioProps {
  lenderId: string;
  contactDbId: string;
}

/** Extract value from the field_values JSONB structure */
function extractFieldValue(fieldValues: Record<string, any>, fieldId: string, valueKey: string): any {
  const entry = fieldValues[fieldId];
  if (!entry) return null;
  if (typeof entry === 'object' && entry !== null) return entry[valueKey] ?? null;
  return entry;
}

/** Parse funding records from deal_section_values */
function parseFundingRecords(fieldValues: Record<string, any>): any[] {
  const raw = fieldValues['loan_terms.funding_records'];
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

function formatCurrency(val: number | null | undefined): string {
  if (val == null || isNaN(val)) return '-';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val);
}

function formatPercent(val: number | null | undefined): string {
  if (val == null || isNaN(val)) return '-';
  return `${val.toFixed(3)}%`;
}

function calcTermLeft(maturityDateStr: string | null): string {
  if (!maturityDateStr) return '-';
  try {
    const maturity = parseISO(maturityDateStr);
    const now = new Date();
    const months = differenceInMonths(maturity, now);
    if (months <= 0) return 'Matured';
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return years > 0 ? `${years}y ${rem}m` : `${rem}m`;
  } catch { return '-'; }
}

function calcDaysLate(nextPaymentStr: string | null): string {
  if (!nextPaymentStr) return '-';
  try {
    const nextPay = parseISO(nextPaymentStr);
    const now = new Date();
    const days = differenceInDays(now, nextPay);
    return days > 0 ? String(days) : '0';
  } catch { return '-'; }
}

const LenderPortfolio: React.FC<LenderPortfolioProps> = ({ lenderId, contactDbId }) => {
  const [rows, setRows] = useState<PortfolioRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(ALL_COLUMNS.map(c => c.id))
  );
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterDaysLate, setFilterDaysLate] = useState<string>('');

  const loadPortfolio = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Find all deals where this lender is a participant
      const { data: participants } = await supabase
        .from('deal_participants')
        .select('deal_id')
        .eq('contact_id', contactDbId)
        .eq('role', 'lender');

      const participantDealIds = (participants || []).map(p => p.deal_id);

      // 2. Fetch ALL loan_terms sections to scan funding_records for this lender
      const { data: allSections } = await supabase
        .from('deal_section_values')
        .select('deal_id, field_values')
        .eq('section', 'loan_terms');

      // Find deals where this lender appears in funding_records
      const fundingDealMap = new Map<string, { fundingRecord: any; fieldValues: Record<string, any> }>();

      (allSections || []).forEach(sv => {
        const fv = sv.field_values as Record<string, any>;
        if (!fv) return;
        const records = parseFundingRecords(fv);
        for (const rec of records) {
          if (rec.lenderAccount === lenderId || rec.lenderName === lenderId) {
            fundingDealMap.set(sv.deal_id, { fundingRecord: rec, fieldValues: fv });
            break;
          }
        }
      });

      // Merge deal IDs from both sources
      const allDealIds = Array.from(new Set([...participantDealIds, ...Array.from(fundingDealMap.keys())]));

      if (allDealIds.length === 0) {
        setRows([]);
        setIsLoading(false);
        return;
      }

      // 3. Fetch deals info
      const { data: deals } = await supabase
        .from('deals')
        .select('id, deal_number, borrower_name, property_address, loan_amount')
        .in('id', allDealIds);

      const dealsMap = new Map((deals || []).map(d => [d.id, d]));

      // 4. Fetch loan_terms section values for all deals (if not already in fundingDealMap)
      const missingDealIds = allDealIds.filter(id => !fundingDealMap.has(id));
      if (missingDealIds.length > 0) {
        const { data: missingSections } = await supabase
          .from('deal_section_values')
          .select('deal_id, field_values')
          .in('deal_id', missingDealIds)
          .eq('section', 'loan_terms');

        (missingSections || []).forEach(sv => {
          const fv = sv.field_values as Record<string, any>;
          if (!fv) return;
          const records = parseFundingRecords(fv);
          for (const rec of records) {
            if (rec.lenderAccount === lenderId || rec.lenderName === lenderId) {
              fundingDealMap.set(sv.deal_id, { fundingRecord: rec, fieldValues: fv });
              break;
            }
          }
          // Even if no matching funding record, store the field values
          if (!fundingDealMap.has(sv.deal_id)) {
            fundingDealMap.set(sv.deal_id, { fundingRecord: null, fieldValues: fv });
          }
        });
      }

      // 5. Build portfolio rows
      const portfolioRows: PortfolioRow[] = [];

      for (const dealId of allDealIds) {
        const deal = dealsMap.get(dealId);
        if (!deal) continue;

        const entry = fundingDealMap.get(dealId);
        const fundingRec = entry?.fundingRecord;
        const loanTerms = entry?.fieldValues || {};

        // Extract loan-level values
        const totalLoanAmount = Number(
          extractFieldValue(loanTerms, FIELD_IDS.loanAmount, 'value_number') || deal.loan_amount || 0
        );
        const noteRateVal = Number(
          extractFieldValue(loanTerms, FIELD_IDS.noteRate, 'value_number') || 0
        );
        const principalBalanceFull = Number(
          extractFieldValue(loanTerms, FIELD_IDS.principalBalance, 'value_number') || totalLoanAmount
        );
        const maturityDateVal =
          extractFieldValue(loanTerms, FIELD_IDS.maturityDate, 'value_date') ||
          extractFieldValue(loanTerms, FIELD_IDS.maturityDate, 'value_text') || '';
        const nextPaymentVal =
          extractFieldValue(loanTerms, FIELD_IDS.nextPaymentDate, 'value_date') ||
          extractFieldValue(loanTerms, FIELD_IDS.nextPaymentDate, 'value_text') || '';

        // Lender-specific values from funding record
        const pctOwned = fundingRec ? Number(fundingRec.pctOwned || 0) : 0;
        const lenderRate = fundingRec ? Number(fundingRec.lenderRate || 0) : 0;
        const regularPayment = fundingRec ? Number(fundingRec.regularPayment || 0) : 0;
        const lenderPrincipalBalance = pctOwned > 0
          ? principalBalanceFull * (pctOwned / 100)
          : (fundingRec ? Number(fundingRec.principalBalance || 0) : 0);

        portfolioRows.push({
          id: `${dealId}-${lenderId}`,
          loanAccount: deal.deal_number || '',
          borrowerName: deal.borrower_name || '',
          noteRate: formatPercent(noteRateVal),
          lenderRate: formatPercent(lenderRate),
          regularPayment: formatCurrency(regularPayment),
          principalBalance: formatCurrency(lenderPrincipalBalance),
          nextPayment: nextPaymentVal ? format(parseISO(nextPaymentVal), 'MM/dd/yyyy') : '-',
          maturityDate: maturityDateVal ? format(parseISO(maturityDateVal), 'MM/dd/yyyy') : '-',
          termLeft: calcTermLeft(maturityDateVal),
          daysLate: calcDaysLate(nextPaymentVal),
          percentOwned: pctOwned > 0 ? `${pctOwned.toFixed(2)}%` : '-',
          propertyDescription: deal.property_address || '-',
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
              <TableRow key={r.id}>
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

export default LenderPortfolio;
