import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, AlertTriangle, BarChart3, Briefcase, PieChart } from 'lucide-react';
import { differenceInDays, parseISO, differenceInMonths } from 'date-fns';
import type { ContactRecord } from '@/hooks/useContactsCrud';

interface Props { contact: ContactRecord; }

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-sm text-foreground">{value || '-'}</span>
  </div>
);

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

const fmtPct = (v: number) => (isNaN(v) ? '0.00%' : `${v.toFixed(2)}%`);

interface PortfolioMetrics {
  totalLoans: number;
  activeLoans: number;
  closedLoans: number;
  defaultLoans: number;
  totalInvested: number;
  totalOutstanding: number;
  avgOwnership: number;
  avgNoteRate: number;
  delinquentLoans: number;
  delinquencyRate: number;
  estimatedYield: number;
  totalPaymentsReceived: number;
  avgLoanSize: number;
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

async function fetchLenderMetrics(contactDbId: string): Promise<PortfolioMetrics> {
  const empty: PortfolioMetrics = {
    totalLoans: 0, activeLoans: 0, closedLoans: 0, defaultLoans: 0,
    totalInvested: 0, totalOutstanding: 0, avgOwnership: 0, avgNoteRate: 0,
    delinquentLoans: 0, delinquencyRate: 0, estimatedYield: 0,
    totalPaymentsReceived: 0, avgLoanSize: 0,
  };

  const { data: participants } = await supabase
    .from('deal_participants')
    .select('deal_id')
    .eq('contact_id', contactDbId)
    .eq('role', 'lender');

  if (!participants || participants.length === 0) return empty;

  const dealIds = [...new Set(participants.map(p => p.deal_id))];

  const [{ data: deals }, { data: sections }] = await Promise.all([
    supabase.from('deals').select('id, deal_number, loan_amount, status').in('id', dealIds),
    supabase.from('deal_section_values').select('deal_id, field_values').in('deal_id', dealIds).eq('section', 'loan_terms'),
  ]);

  const ltMap = new Map<string, Record<string, any>>();
  (sections || []).forEach(s => ltMap.set(s.deal_id, s.field_values as Record<string, any>));

  let totalInvested = 0;
  let totalOutstanding = 0;
  let ownershipSum = 0;
  let rateSum = 0;
  let rateCount = 0;
  let activeLoans = 0;
  let closedLoans = 0;
  let defaultLoans = 0;
  let delinquentLoans = 0;

  (deals || []).forEach(deal => {
    const lt = ltMap.get(deal.id) || {};
    const fundingRecords = parseFundingRecords(lt);

    const fundingRec = fundingRecords.length > 0 ? fundingRecords[0] : null;
    const fundingAmount = fundingRec ? Number(fundingRec.originalAmount || 0) : 0;
    const pctOwned = fundingRec ? Number(fundingRec.pctOwned || 0) : 0;
    const lenderRate = fundingRec ? Number(fundingRec.lenderRate || 0) : 0;
    const totalLoan = Number(deal.loan_amount || 0);
    const principalBalance = totalLoan * (pctOwned / 100) || fundingAmount;

    totalInvested += fundingAmount;
    totalOutstanding += principalBalance;
    ownershipSum += pctOwned > 0 ? pctOwned : (totalLoan > 0 ? (fundingAmount / totalLoan) * 100 : 0);

    if (lenderRate > 0) { rateSum += lenderRate; rateCount++; }

    // Status
    const lsRaw = lt['loan_status'] || '';
    const statusStr = typeof lsRaw === 'string' ? lsRaw.toLowerCase() : '';
    if (statusStr.includes('paid') || statusStr.includes('closed')) {
      closedLoans++;
    } else if (statusStr.includes('default')) {
      defaultLoans++;
    } else {
      activeLoans++;
    }

    // Delinquency check via next payment date
    const nextPayRaw = lt['next_payment_date'] || '';
    if (typeof nextPayRaw === 'string' && nextPayRaw) {
      try {
        const daysLate = differenceInDays(new Date(), parseISO(nextPayRaw));
        if (daysLate > 30) delinquentLoans++;
      } catch { /* ignore */ }
    }
  });

  const totalLoans = deals?.length || 0;
  const avgOwnership = totalLoans > 0 ? ownershipSum / totalLoans : 0;
  const avgNoteRate = rateCount > 0 ? rateSum / rateCount : 0;
  const delinquencyRate = activeLoans > 0 ? (delinquentLoans / activeLoans) * 100 : 0;
  const estimatedYield = totalInvested > 0 ? (avgNoteRate * totalOutstanding) / totalInvested : avgNoteRate;
  const avgLoanSize = totalLoans > 0 ? totalInvested / totalLoans : 0;

  return {
    totalLoans, activeLoans, closedLoans, defaultLoans,
    totalInvested, totalOutstanding, avgOwnership, avgNoteRate,
    delinquentLoans, delinquencyRate, estimatedYield,
    totalPaymentsReceived: 0, avgLoanSize,
  };
}

const MetricCard = ({ icon: Icon, label, value, subValue, variant }: {
  icon: React.ElementType; label: string; value: string; subValue?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}) => {
  const colorMap = {
    default: 'text-primary',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400',
  };
  const iconColor = colorMap[variant || 'default'];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg bg-muted ${iconColor}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className="text-lg font-bold text-foreground">{value}</p>
            {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const LenderDashboard: React.FC<Props> = ({ contact }) => {
  const data = (contact.contact_data || {}) as Record<string, string>;

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['lender-dashboard-metrics', contact.id],
    queryFn: () => fetchLenderMetrics(contact.id),
    enabled: !!contact.id,
  });

  const m = metrics || {
    totalLoans: 0, activeLoans: 0, closedLoans: 0, defaultLoans: 0,
    totalInvested: 0, totalOutstanding: 0, avgOwnership: 0, avgNoteRate: 0,
    delinquentLoans: 0, delinquencyRate: 0, estimatedYield: 0,
    totalPaymentsReceived: 0, avgLoanSize: 0,
  };

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold text-foreground">Dashboard</h4>

      <div className="flex gap-2 flex-wrap">
        {data.frozen === 'true' && <Badge variant="destructive">Frozen</Badge>}
        {data.tin_verified === 'true' && <Badge variant="secondary">Verified</Badge>}
        {data.ach === 'true' && <Badge variant="outline">ACH</Badge>}
        {data.agreement_on_file === 'true' && <Badge variant="outline">Agreement on File</Badge>}
        {data.send_1099 === 'true' && <Badge variant="outline">1099</Badge>}
      </div>

      {/* Portfolio Summary Metrics */}
      <div>
        <h5 className="text-sm font-semibold text-foreground mb-3">Portfolio Overview</h5>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading portfolio metrics...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <MetricCard icon={Briefcase} label="Total Loans" value={String(m.totalLoans)} subValue={`${m.activeLoans} active · ${m.closedLoans} closed`} />
            <MetricCard icon={DollarSign} label="Total Invested" value={fmtCurrency(m.totalInvested)} subValue={`Avg: ${fmtCurrency(m.avgLoanSize)}`} />
            <MetricCard icon={DollarSign} label="Total Outstanding" value={fmtCurrency(m.totalOutstanding)} variant="default" />
            <MetricCard icon={PieChart} label="Avg Ownership" value={fmtPct(m.avgOwnership)} />
            <MetricCard icon={TrendingUp} label="Avg Lender Rate" value={fmtPct(m.avgNoteRate)} variant="success" />
            <MetricCard icon={TrendingUp} label="Estimated Yield" value={fmtPct(m.estimatedYield)} variant="success" />
            <MetricCard
              icon={AlertTriangle}
              label="Delinquency Rate"
              value={fmtPct(m.delinquencyRate)}
              subValue={`${m.delinquentLoans} delinquent loans`}
              variant={m.delinquencyRate > 10 ? 'danger' : m.delinquencyRate > 5 ? 'warning' : 'success'}
            />
            <MetricCard
              icon={BarChart3}
              label="Default Loans"
              value={String(m.defaultLoans)}
              variant={m.defaultLoans > 0 ? 'danger' : 'success'}
            />
          </div>
        )}
      </div>

      {/* Contact Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Basic Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Field label="Lender ID" value={contact.contact_id} />
            <Field label="Type" value={data.type || ''} />
            <Field label="Full Name" value={contact.full_name || ''} />
            <Field label="First Name" value={contact.first_name || ''} />
            <Field label="Last Name" value={contact.last_name || ''} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Contact Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Field label="Email" value={contact.email || ''} />
            <Field label="Cell Phone" value={data['phone.cell'] || ''} />
            <Field label="Home Phone" value={data['phone.home'] || ''} />
            <Field label="Work Phone" value={data['phone.work'] || ''} />
            <Field label="Fax" value={data['phone.fax'] || ''} />
            <Field label="Preferred" value={data.preferred_phone || ''} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Primary Address</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Field label="Street" value={data['primary_address.street'] || ''} />
            <Field label="City" value={contact.city || ''} />
            <Field label="State" value={contact.state || ''} />
            <Field label="ZIP" value={data['primary_address.zip'] || ''} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Financial / Compliance</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Field label="TIN" value={data.tin || ''} />
            <Field label="ACH" value={data.ach === 'true' ? 'Yes' : 'No'} />
            <Field label="Send 1099" value={data.send_1099 === 'true' ? 'Yes' : 'No'} />
            <Field label="Agreement" value={data.agreement_on_file === 'true' ? 'Yes' : 'No'} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LenderDashboard;
