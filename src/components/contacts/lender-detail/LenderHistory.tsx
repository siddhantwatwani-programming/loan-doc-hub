import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Download, Settings2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import SortableTableHead from '@/components/deal/SortableTableHead';
import { type SortDirection } from '@/hooks/useGridSortFilter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';

interface HistoryRow {
  id: string;
  dealId: string;
  date: string;
  dateRaw: string;
  account: string;
  reference: string;
  principal: string;
  principalNum: number;
  interest: string;
  interestNum: number;
  defaultInterest: string;
  defaultInterestNum: number;
  lateFee: string;
  lateFeeNum: number;
  prepaymentPenalty: string;
  prepaymentPenaltyNum: number;
  servicingFees: string;
  servicingFeesNum: number;
  charges: string;
  chargesNum: number;
  chargesInterest: string;
  chargesInterestNum: number;
  chargesReference: string;
  toTrust: string;
  toTrustNum: number;
  fromTrust: string;
  fromTrustNum: number;
}

const ALL_COLUMNS = [
  { id: 'date', label: 'Date' },
  { id: 'account', label: 'Account' },
  { id: 'reference', label: 'Reference' },
  { id: 'principal', label: 'Principal' },
  { id: 'interest', label: 'Interest' },
  { id: 'defaultInterest', label: 'Default Interest' },
  { id: 'lateFee', label: 'Late Fee' },
  { id: 'prepaymentPenalty', label: 'Prepay Penalty' },
  { id: 'servicingFees', label: 'Servicing Fees' },
  { id: 'charges', label: 'Charges' },
  { id: 'chargesInterest', label: 'Charges Interest' },
  { id: 'chargesReference', label: 'Charges Ref' },
  { id: 'toTrust', label: 'To Trust' },
  { id: 'fromTrust', label: 'From Trust' },
];

const formatCurrency = (val: any) => {
  if (val == null || val === '' || val === 0) return '-';
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  if (isNaN(num) || num === 0) return '-';
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

const parseNum = (val: any): number => {
  if (val == null || val === '') return 0;
  const n = typeof val === 'number' ? val : parseFloat(String(val));
  return isNaN(n) ? 0 : n;
};

const resolveField = (fv: any, ...keyFragments: string[]): any => {
  if (!fv || typeof fv !== 'object') return null;
  for (const [key, val] of Object.entries(fv)) {
    for (const frag of keyFragments) {
      if (key.toLowerCase().includes(frag.toLowerCase())) {
        if (typeof val === 'object' && val !== null) {
          return (val as any).value_number ?? (val as any).value_text ?? (val as any).value_date ?? val;
        }
        return val;
      }
    }
  }
  return null;
};

interface Props {
  lenderId: string;
  contactDbId?: string;
}

const LenderHistory: React.FC<Props> = ({ lenderId, contactDbId }) => {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortCol, setSortCol] = useState<string | null>('date');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(ALL_COLUMNS.map(c => c.id))
  );

  useEffect(() => {
    const lookupId = contactDbId || lenderId;
    if (!lookupId) return;

    const load = async () => {
      setIsLoading(true);
      try {
        // 1. Find deal_participants for this lender
        const { data: participants, error: pErr } = await supabase
          .from('deal_participants')
          .select('deal_id')
          .eq('contact_id', contactDbId || '')
          .eq('role', 'lender');

        let allParticipants = participants || [];

        // Fallback: search deal_section_values lender section for lender_id match
        if (allParticipants.length === 0 && lenderId) {
          const { data: lenderSections } = await supabase
            .from('deal_section_values')
            .select('deal_id, field_values')
            .eq('section', 'lender');

          const matchedDealIds: string[] = [];
          (lenderSections || []).forEach(ls => {
            const fv = ls.field_values as Record<string, any>;
            if (fv) {
              for (const v of Object.values(fv)) {
                if (typeof v === 'object' && v !== null) {
                  if ((v as any).value_text === lenderId) {
                    matchedDealIds.push(ls.deal_id);
                    break;
                  }
                }
                if (typeof v === 'string' && v === lenderId) {
                  matchedDealIds.push(ls.deal_id);
                  break;
                }
              }
            }
          });

          if (matchedDealIds.length > 0) {
            allParticipants = matchedDealIds.map(did => ({ deal_id: did }));
          }
        }

        if (pErr) throw pErr;
        if (allParticipants.length === 0) {
          setRows([]);
          setIsLoading(false);
          return;
        }

        const dealIds = [...new Set(allParticipants.map(p => p.deal_id))];

        // 2. Fetch deals
        const { data: deals, error: dErr } = await supabase
          .from('deals')
          .select('id, deal_number, created_at, status')
          .in('id', dealIds);

        if (dErr) throw dErr;
        if (!deals || deals.length === 0) {
          setRows([]);
          setIsLoading(false);
          return;
        }

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

        // 4. Fetch charges section values
        const { data: chargesSections } = await supabase
          .from('deal_section_values')
          .select('deal_id, field_values')
          .in('deal_id', dealIds)
          .eq('section', 'charges');

        const chargesMap = new Map<string, Record<string, any>>();
        (chargesSections || []).forEach(sv => {
          chargesMap.set(sv.deal_id, sv.field_values as Record<string, any>);
        });

        const dealsMap = new Map(deals.map(d => [d.id, d]));

        const historyRows: HistoryRow[] = [];
        const seenDeals = new Set<string>();

        for (const p of allParticipants) {
          if (seenDeals.has(p.deal_id)) continue;
          seenDeals.add(p.deal_id);

          const deal = dealsMap.get(p.deal_id);
          if (!deal) continue;

          const lt = loanTermsMap.get(p.deal_id) || {};
          const ch = chargesMap.get(p.deal_id) || {};

          const principalVal = parseNum(resolveField(lt, 'principal', 'principal_balance', 'current_balance'));
          const interestVal = parseNum(resolveField(lt, 'interest_amount', 'interest_paid', 'accrued_interest'));
          const defaultInterestVal = parseNum(resolveField(lt, 'default_interest', 'penalty_interest'));
          const lateFeeVal = parseNum(resolveField(lt, 'late_fee', 'late_charge') ?? resolveField(ch, 'late_fee', 'late_charge'));
          const prepayVal = parseNum(resolveField(lt, 'prepay', 'prepayment_penalty') ?? resolveField(ch, 'prepay'));
          const servicingVal = parseNum(resolveField(lt, 'servicing_fee', 'servicing') ?? resolveField(ch, 'servicing'));
          const chargesVal = parseNum(resolveField(ch, 'other_charges', 'other_fees', 'misc'));
          const chargesInterestVal = parseNum(resolveField(ch, 'charges_interest', 'interest_on_charges'));
          const toTrustVal = parseNum(resolveField(lt, 'to_trust', 'trust_deposit') ?? resolveField(ch, 'to_trust'));
          const fromTrustVal = parseNum(resolveField(lt, 'from_trust', 'trust_withdrawal') ?? resolveField(ch, 'from_trust'));

          const txDate = resolveField(lt, 'origination_date', 'funding_date', 'closing_date') || deal.created_at;
          const refVal = resolveField(lt, 'reference', 'transaction_id', 'payment_reference') || deal.deal_number;
          const chargesRefVal = resolveField(ch, 'reference', 'charges_reference') || '-';

          historyRows.push({
            id: deal.id,
            dealId: deal.id,
            date: formatDate(txDate),
            dateRaw: txDate ? String(txDate) : '',
            account: deal.deal_number || '-',
            reference: String(refVal || '-'),
            principal: formatCurrency(principalVal),
            principalNum: principalVal,
            interest: formatCurrency(interestVal),
            interestNum: interestVal,
            defaultInterest: formatCurrency(defaultInterestVal),
            defaultInterestNum: defaultInterestVal,
            lateFee: formatCurrency(lateFeeVal),
            lateFeeNum: lateFeeVal,
            prepaymentPenalty: formatCurrency(prepayVal),
            prepaymentPenaltyNum: prepayVal,
            servicingFees: formatCurrency(servicingVal),
            servicingFeesNum: servicingVal,
            charges: formatCurrency(chargesVal),
            chargesNum: chargesVal,
            chargesInterest: formatCurrency(chargesInterestVal),
            chargesInterestNum: chargesInterestVal,
            chargesReference: String(chargesRefVal || '-'),
            toTrust: formatCurrency(toTrustVal),
            toTrustNum: toTrustVal,
            fromTrust: formatCurrency(fromTrustVal),
            fromTrustNum: fromTrustVal,
          });
        }

        setRows(historyRows);
      } catch (err) {
        console.error('Failed to load lender history:', err);
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [contactDbId, lenderId]);

  const handleSort = useCallback((col: string) => {
    if (sortCol === col) {
      setSortDir(prev => prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc');
      if (sortDir === 'desc') setSortCol(null);
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  }, [sortCol, sortDir]);

  const activeColumns = useMemo(
    () => ALL_COLUMNS.filter(c => visibleColumns.has(c.id)),
    [visibleColumns]
  );

  const filtered = useMemo(() => {
    let result = rows;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        r.account.toLowerCase().includes(q) ||
        r.reference.toLowerCase().includes(q)
      );
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      result = result.filter(r => {
        if (!r.dateRaw) return false;
        const d = new Date(r.dateRaw);
        if (isNaN(d.getTime())) return false;
        switch (dateFilter) {
          case 'mtd': {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            return d >= start && d <= now;
          }
          case 'last_month': {
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const end = new Date(now.getFullYear(), now.getMonth(), 0);
            return d >= start && d <= end;
          }
          case 'qtd': {
            const qMonth = Math.floor(now.getMonth() / 3) * 3;
            const start = new Date(now.getFullYear(), qMonth, 1);
            return d >= start && d <= now;
          }
          case 'ytd': {
            const start = new Date(now.getFullYear(), 0, 1);
            return d >= start && d <= now;
          }
          case 'last_year': {
            const start = new Date(now.getFullYear() - 1, 0, 1);
            const end = new Date(now.getFullYear() - 1, 11, 31);
            return d >= start && d <= end;
          }
          default: return true;
        }
      });
    }

    if (sortCol && sortDir) {
      const numCols: Record<string, string> = {
        principal: 'principalNum', interest: 'interestNum', defaultInterest: 'defaultInterestNum',
        lateFee: 'lateFeeNum', prepaymentPenalty: 'prepaymentPenaltyNum', servicingFees: 'servicingFeesNum',
        charges: 'chargesNum', chargesInterest: 'chargesInterestNum',
        toTrust: 'toTrustNum', fromTrust: 'fromTrustNum',
      };
      result = [...result].sort((a, b) => {
        let av: any, bv: any;
        if (sortCol === 'date') { av = a.dateRaw; bv = b.dateRaw; }
        else if (numCols[sortCol]) { av = (a as any)[numCols[sortCol]]; bv = (b as any)[numCols[sortCol]]; }
        else { av = (a as any)[sortCol] || ''; bv = (b as any)[sortCol] || ''; }

        if (typeof av === 'number' && typeof bv === 'number') {
          return sortDir === 'asc' ? av - bv : bv - av;
        }
        return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
    }

    return result;
  }, [rows, search, dateFilter, sortCol, sortDir]);

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
      activeColumns.map(c => `"${String((r as any)[c.id] || '').replace(/"/g, '""')}"`).join(',')
    );
    const csv = [headers, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lender_history.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-foreground">History</h4>
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
                    id={`lh-col-${c.id}`}
                    checked={visibleColumns.has(c.id)}
                    onCheckedChange={() => toggleColumn(c.id)}
                  />
                  <label htmlFor={`lh-col-${c.id}`} className="text-xs cursor-pointer">{c.label}</label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search Account / Reference..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-7 h-8 w-[220px] text-xs"
          />
        </div>

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="h-8 w-[160px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dates</SelectItem>
            <SelectItem value="mtd">Month to Date</SelectItem>
            <SelectItem value="last_month">Last Month</SelectItem>
            <SelectItem value="qtd">Quarter to Date</SelectItem>
            <SelectItem value="ytd">Year to Date</SelectItem>
            <SelectItem value="last_year">Last Year</SelectItem>
          </SelectContent>
        </Select>

        <Button size="sm" variant="outline" className="gap-1 h-8 text-xs" onClick={handleExport}>
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
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
                <TableCell colSpan={activeColumns.length} className="text-center py-8 text-muted-foreground text-sm">
                  Loading history...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={activeColumns.length} className="text-center py-8 text-muted-foreground text-sm">
                  No history records found.
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

export default LenderHistory;
