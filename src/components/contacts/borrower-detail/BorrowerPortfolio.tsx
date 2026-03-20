import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Download, Settings2, Filter } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SortableTableHead from '@/components/deal/SortableTableHead';
import { type SortDirection } from '@/hooks/useGridSortFilter';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface PortfolioLoan {
  id: string;
  dealId: string;
  loanNumber: string;
  loanAmount: string;
  capacity: string;
  status: string;
  nextPaymentDate: string;
  principalBalance: string;
  interestRate: string;
  maturityDate: string;
}

const ALL_COLUMNS = [
  { id: 'loanNumber', label: 'Loan Number' },
  { id: 'loanAmount', label: 'Loan Amount' },
  { id: 'capacity', label: 'Capacity' },
  { id: 'status', label: 'Status' },
  { id: 'nextPaymentDate', label: 'Next Payment Date' },
  { id: 'principalBalance', label: 'Principal Balance' },
  { id: 'interestRate', label: 'Interest Rate' },
  { id: 'maturityDate', label: 'Maturity Date' },
];

const ROLE_FILTER_OPTIONS = ['Borrower (Primary)', 'Co-Borrower', 'Additional Guarantor', 'Trustee', 'Co-Trustee', 'Managing Member', 'Authorized Signer'];
const STATUS_FILTER_OPTIONS = ['Active', 'Closed', 'Default'];

// Map capacity values from deal_section_values to display roles
const CAPACITY_TO_ROLE: Record<string, string> = {
  'borrower_primary': 'Borrower (Primary)',
  'co_borrower': 'Co-Borrower',
  'additional_guarantor': 'Additional Guarantor',
  'trustee': 'Trustee',
  'co_trustee': 'Co-Trustee',
  'managing_member': 'Managing Member',
  'authorized_signer': 'Authorized Signer',
};

const VALID_CAPACITIES = new Set(Object.keys(CAPACITY_TO_ROLE));

interface Props { borrowerId: string; contactDbId: string; }

const BorrowerPortfolio: React.FC<Props> = ({ contactDbId }) => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<PortfolioLoan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(ALL_COLUMNS.map(c => c.id)));
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch portfolio data from deal_participants + deals
  useEffect(() => {
    if (!contactDbId) return;
    const load = async () => {
      setIsLoading(true);
      try {
        // 1. Get all deal_participants for this contact with borrower role
        const { data: participants, error: pErr } = await supabase
          .from('deal_participants')
          .select('deal_id, role, name')
          .eq('contact_id', contactDbId)
          .eq('role', 'borrower');

        if (pErr) throw pErr;
        if (!participants || participants.length === 0) {
          setRows([]);
          setIsLoading(false);
          return;
        }

        // 2. Get unique deal IDs
        const dealIds = [...new Set(participants.map(p => p.deal_id))];

        // 3. Fetch deals
        const { data: deals, error: dErr } = await supabase
          .from('deals')
          .select('id, deal_number, loan_amount, status')
          .in('id', dealIds);

        if (dErr) throw dErr;

        // 4. Fetch deal_section_values for loan_terms to get interest rate, maturity, etc.
        const { data: sectionValues } = await supabase
          .from('deal_section_values')
          .select('deal_id, field_values')
          .in('deal_id', dealIds)
          .eq('section', 'loan_terms');

        const sectionMap = new Map<string, Record<string, any>>();
        (sectionValues || []).forEach(sv => {
          sectionMap.set(sv.deal_id, sv.field_values as Record<string, any>);
        });

        // 5. Fetch participant section values for capacity info
        const { data: participantSections } = await supabase
          .from('deal_section_values')
          .select('deal_id, field_values')
          .in('deal_id', dealIds)
          .eq('section', 'participants');

        const participantCapacityMap = new Map<string, string>();
        (participantSections || []).forEach(ps => {
          const fv = ps.field_values as Record<string, any>;
          // Look for capacity associated with this contact
          if (fv) {
            // Check indexed entries (e.g., borrower_0_capacity, borrower_1_capacity)
            Object.entries(fv).forEach(([key, val]) => {
              if (key.includes('capacity') && typeof val === 'string') {
                const contactKey = key.replace('capacity', 'contact_id');
                if (fv[contactKey] === contactDbId) {
                  participantCapacityMap.set(ps.deal_id, val);
                }
              }
            });
          }
        });

        const dealsMap = new Map((deals || []).map(d => [d.id, d]));

        // 6. Build rows - one per unique deal
        const seenDeals = new Set<string>();
        const portfolioRows: PortfolioLoan[] = [];

        for (const p of participants) {
          if (seenDeals.has(p.deal_id)) continue;
          seenDeals.add(p.deal_id);

          const deal = dealsMap.get(p.deal_id);
          if (!deal) continue;

          const loanTerms = sectionMap.get(p.deal_id) || {};
          const capacity = participantCapacityMap.get(p.deal_id) || '';
          const displayRole = CAPACITY_TO_ROLE[capacity] || 'Borrower (Primary)';

          // Map deal status to portfolio status
          let displayStatus = 'Active';
          if (deal.status === 'generated') displayStatus = 'Active';
          else if (deal.status === 'draft') displayStatus = 'Active';
          else if (deal.status === 'ready') displayStatus = 'Active';

          // Check loan terms for status override
          const loanStatus = loanTerms['loan_status'] || loanTerms['status'] || '';
          if (typeof loanStatus === 'string' && loanStatus.toLowerCase().includes('closed')) displayStatus = 'Closed';
          if (typeof loanStatus === 'string' && loanStatus.toLowerCase().includes('default')) displayStatus = 'Default';

          const formatCurrency = (val: any) => {
            if (!val) return '-';
            const num = typeof val === 'number' ? val : parseFloat(String(val));
            if (isNaN(num)) return '-';
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
          };

          const formatDate = (val: any) => {
            if (!val) return '-';
            try {
              return new Date(String(val)).toLocaleDateString('en-US');
            } catch { return '-'; }
          };

          const formatPercent = (val: any) => {
            if (!val) return '-';
            const num = typeof val === 'number' ? val : parseFloat(String(val));
            if (isNaN(num)) return '-';
            return `${num}%`;
          };

          portfolioRows.push({
            id: `${p.deal_id}`,
            dealId: p.deal_id,
            loanNumber: deal.deal_number || '-',
            loanAmount: formatCurrency(deal.loan_amount),
            capacity: displayRole,
            status: displayStatus,
            nextPaymentDate: formatDate(loanTerms['next_payment_date'] || loanTerms['nextPaymentDate']),
            principalBalance: formatCurrency(loanTerms['principal_balance'] || loanTerms['principalBalance'] || deal.loan_amount),
            interestRate: formatPercent(loanTerms['interest_rate'] || loanTerms['interestRate']),
            maturityDate: formatDate(loanTerms['maturity_date'] || loanTerms['maturityDate']),
          });
        }

        setRows(portfolioRows);
      } catch (err) {
        console.error('Failed to load portfolio:', err);
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [contactDbId]);

  // Summary calculations
  const summary = useMemo(() => {
    const parseCurrency = (val: string) => {
      const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
      return isNaN(num) ? 0 : num;
    };
    const totalLoans = rows.length;
    const activeLoans = rows.filter(r => r.status === 'Active').length;
    const totalAmount = rows.reduce((sum, r) => sum + parseCurrency(r.loanAmount), 0);
    const totalBalance = rows.reduce((sum, r) => sum + parseCurrency(r.principalBalance), 0);
    return { totalLoans, activeLoans, totalAmount, totalBalance };
  }, [rows]);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : sortDir === 'desc' ? null : 'asc');
      if (sortDir === 'desc') setSortCol(null);
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const activeColumns = useMemo(() => ALL_COLUMNS.filter(c => visibleColumns.has(c.id)), [visibleColumns]);

  const filtered = useMemo(() => {
    let result = rows;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r => r.loanNumber.toLowerCase().includes(q));
    }
    if (roleFilter !== 'all') {
      result = result.filter(r => r.capacity === roleFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter);
    }
    if (sortCol && sortDir) {
      result = [...result].sort((a, b) => {
        const av = (a as any)[sortCol] || '';
        const bv = (b as any)[sortCol] || '';
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return result;
  }, [rows, search, sortCol, sortDir, roleFilter, statusFilter]);

  const toggleColumn = (colId: string) => setVisibleColumns(prev => {
    const n = new Set(prev);
    n.has(colId) ? n.delete(colId) : n.add(colId);
    return n;
  });

  const handleExport = () => {
    const headers = activeColumns.map(c => c.label).join(',');
    const csvRows = filtered.map(r => activeColumns.map(c => `"${String((r as any)[c.id] || '').replace(/"/g, '""')}"`).join(','));
    const csv = [headers, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'borrower_portfolio.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRowClick = (row: PortfolioLoan) => {
    navigate(`/deals/${row.dealId}`);
  };

  const formatSummaryCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

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
          <p className="text-xs text-muted-foreground">Total Loan Amount (Exposure)</p>
          <p className="text-xl font-semibold text-foreground">{formatSummaryCurrency(summary.totalAmount)}</p>
        </div>
        <div className="border border-border rounded-lg p-3 bg-muted/30">
          <p className="text-xs text-muted-foreground">Total Outstanding Balance</p>
          <p className="text-xl font-semibold text-foreground">{formatSummaryCurrency(summary.totalBalance)}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by Loan Number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-7 h-8 w-[200px] text-xs"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="h-8 w-[180px] text-xs">
            <SelectValue placeholder="Filter by Capacity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Capacities</SelectItem>
            {ROLE_FILTER_OPTIONS.map(r => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_FILTER_OPTIONS.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <Button size="sm" variant="outline" className="gap-1 h-8 text-xs" onClick={handleExport}>
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-x-auto">
        <Table>
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
                  No loans found for this borrower
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(r => (
                <TableRow
                  key={r.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(r)}
                >
                  {activeColumns.map(c => (
                    <TableCell key={c.id} className="whitespace-nowrap text-xs">
                      {c.id === 'status' ? (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          r.status === 'Closed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {r.status}
                        </span>
                      ) : (
                        (r as any)[c.id] || '-'
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default BorrowerPortfolio;
