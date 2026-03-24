import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, Briefcase, BarChart3, FileText, Clock } from 'lucide-react';
import type { ContactBroker } from '@/pages/contacts/ContactBrokersPage';

interface Props { broker: ContactBroker; onUpdate: (b: ContactBroker) => void; }

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-sm text-foreground">{value || '-'}</span>
  </div>
);

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

interface BrokerMetrics {
  totalDeals: number;
  activeDeals: number;
  closedDeals: number;
  draftDeals: number;
  totalLoanVolume: number;
  totalFunded: number;
  avgLoanSize: number;
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
  avgCommissionRate: number;
}

async function fetchBrokerMetrics(contactDbId: string): Promise<BrokerMetrics> {
  const empty: BrokerMetrics = {
    totalDeals: 0, activeDeals: 0, closedDeals: 0, draftDeals: 0,
    totalLoanVolume: 0, totalFunded: 0, avgLoanSize: 0,
    totalCommission: 0, pendingCommission: 0, paidCommission: 0, avgCommissionRate: 0,
  };

  const { data: participants } = await supabase
    .from('deal_participants')
    .select('deal_id')
    .eq('contact_id', contactDbId)
    .eq('role', 'broker');

  if (!participants || participants.length === 0) return empty;

  const dealIds = [...new Set(participants.map(p => p.deal_id))];

  const [{ data: deals }, { data: sections }] = await Promise.all([
    supabase.from('deals').select('id, loan_amount, status').in('id', dealIds),
    supabase.from('deal_section_values').select('deal_id, field_values').in('deal_id', dealIds).eq('section', 'loan_terms'),
  ]);

  const ltMap = new Map<string, Record<string, any>>();
  (sections || []).forEach(s => ltMap.set(s.deal_id, s.field_values as Record<string, any>));

  let totalLoanVolume = 0;
  let totalFunded = 0;
  let activeDeals = 0;
  let closedDeals = 0;
  let draftDeals = 0;
  let totalCommission = 0;
  let commissionCount = 0;

  (deals || []).forEach(deal => {
    const loanAmt = Number(deal.loan_amount || 0);
    totalLoanVolume += loanAmt;

    const lt = ltMap.get(deal.id) || {};

    // Try to extract broker fee/commission from loan_terms
    const brokerFeeRaw = lt['broker.broker_fee'] || lt['broker_fee'] || lt['broker.commission'] || '';
    const brokerFee = Number(typeof brokerFeeRaw === 'string' ? brokerFeeRaw.replace(/[^0-9.-]/g, '') : brokerFeeRaw) || 0;
    totalCommission += brokerFee;
    if (brokerFee > 0) commissionCount++;

    // Funded amount
    const fundedRaw = lt['loan_terms.funded_amount'] || lt['funded_amount'] || '';
    const funded = Number(typeof fundedRaw === 'string' ? fundedRaw.replace(/[^0-9.-]/g, '') : fundedRaw) || 0;
    totalFunded += funded > 0 ? funded : loanAmt;

    // Status
    if (deal.status === 'draft') draftDeals++;
    else if (deal.status === 'generated') activeDeals++;
    else closedDeals++;
  });

  const totalDeals = deals?.length || 0;
  const avgLoanSize = totalDeals > 0 ? totalLoanVolume / totalDeals : 0;
  const avgCommissionRate = totalLoanVolume > 0 ? (totalCommission / totalLoanVolume) * 100 : 0;

  return {
    totalDeals, activeDeals, closedDeals, draftDeals,
    totalLoanVolume, totalFunded, avgLoanSize,
    totalCommission, pendingCommission: 0, paidCommission: totalCommission,
    avgCommissionRate,
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

const BrokerDashboard: React.FC<Props> = ({ broker }) => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['broker-dashboard-metrics', broker.id],
    queryFn: () => fetchBrokerMetrics(broker.id),
    enabled: !!broker.id,
  });

  const m = metrics || {
    totalDeals: 0, activeDeals: 0, closedDeals: 0, draftDeals: 0,
    totalLoanVolume: 0, totalFunded: 0, avgLoanSize: 0,
    totalCommission: 0, pendingCommission: 0, paidCommission: 0, avgCommissionRate: 0,
  };

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold text-foreground">Dashboard</h4>

      <div className="flex gap-2 flex-wrap">
        {broker.hold && <Badge variant="destructive">On Hold</Badge>}
        {broker.verified && <Badge variant="secondary">Verified</Badge>}
        {broker.ach && <Badge variant="outline">ACH</Badge>}
        {broker.agreement && <Badge variant="outline">Agreement on File</Badge>}
        {broker.send1099 && <Badge variant="outline">1099</Badge>}
      </div>

      {/* Portfolio Summary Metrics */}
      <div>
        <h5 className="text-sm font-semibold text-foreground mb-3">Portfolio Overview</h5>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading portfolio metrics...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <MetricCard icon={Briefcase} label="Total Deals" value={String(m.totalDeals)} subValue={`${m.activeDeals} active · ${m.draftDeals} pipeline`} />
            <MetricCard icon={DollarSign} label="Total Loan Volume" value={fmtCurrency(m.totalLoanVolume)} subValue={`Avg: ${fmtCurrency(m.avgLoanSize)}`} />
            <MetricCard icon={DollarSign} label="Total Funded" value={fmtCurrency(m.totalFunded)} />
            <MetricCard icon={TrendingUp} label="Total Commission" value={fmtCurrency(m.totalCommission)} variant="success" />
            <MetricCard icon={BarChart3} label="Avg Commission Rate" value={m.avgCommissionRate > 0 ? `${m.avgCommissionRate.toFixed(2)}%` : '-'} variant="default" />
            <MetricCard icon={FileText} label="Active Deals" value={String(m.activeDeals)} variant="success" />
            <MetricCard icon={Clock} label="Pipeline (Draft)" value={String(m.draftDeals)} variant="warning" />
            <MetricCard icon={Briefcase} label="Closed Deals" value={String(m.closedDeals)} />
          </div>
        )}
      </div>

      {/* Contact Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Basic Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Field label="Broker ID" value={broker.brokerId} />
            <Field label="Type" value={broker.type} />
            <Field label="Full Name" value={broker.fullName} />
            <Field label="First Name" value={broker.firstName} />
            <Field label="Last Name" value={broker.lastName} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Contact Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Field label="Email" value={broker.email} />
            <Field label="Cell Phone" value={broker.cellPhone} />
            <Field label="Home Phone" value={broker.homePhone} />
            <Field label="Work Phone" value={broker.workPhone} />
            <Field label="Fax" value={broker.fax} />
            <Field label="Preferred" value={broker.preferredPhone} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Primary Address</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Field label="Street" value={broker.street} />
            <Field label="City" value={broker.city} />
            <Field label="State" value={broker.state} />
            <Field label="ZIP" value={broker.zip} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Financial / Compliance</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Field label="TIN" value={broker.tin} />
            <Field label="ACH" value={broker.ach ? 'Yes' : 'No'} />
            <Field label="Send 1099" value={broker.send1099 ? 'Yes' : 'No'} />
            <Field label="Agreement" value={broker.agreement ? 'Yes' : 'No'} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BrokerDashboard;
