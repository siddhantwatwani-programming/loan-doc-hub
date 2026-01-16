import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  FolderOpen,
  Loader2,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Deal {
  id: string;
  deal_number: string;
  state: string;
  product_type: string;
  mode: 'doc_prep' | 'servicing_only';
  status: 'draft' | 'ready' | 'generated';
  borrower_name: string | null;
  property_address: string | null;
  loan_amount: number | null;
  created_at: string;
  packet?: { name: string } | null;
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const PRODUCT_TYPES = [
  'Conventional', 'FHA', 'VA', 'USDA', 'Jumbo', 'Reverse Mortgage', 'HELOC', 'Construction'
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'ready', label: 'Ready' },
  { value: 'generated', label: 'Generated' },
];

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  ready: 'bg-primary/10 text-primary',
  generated: 'bg-success/10 text-success',
};

const modeLabels: Record<string, string> = {
  doc_prep: 'Doc Prep',
  servicing_only: 'Servicing Only',
};

export const DealsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterState, setFilterState] = useState<string>('');
  const [filterProduct, setFilterProduct] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchDeals();

    // Real-time subscription
    const channel = supabase
      .channel('deals-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deals' },
        () => fetchDeals()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDeals = async () => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select('*, packets(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDeals(
        (data || []).map((d: any) => ({
          ...d,
          packet: d.packets,
        }))
      );
    } catch (error) {
      console.error('Error fetching deals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load deals',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (deal: Deal) => {
    if (!confirm(`Delete deal ${deal.deal_number}?`)) return;

    try {
      const { error } = await supabase.from('deals').delete().eq('id', deal.id);
      if (error) throw error;
      toast({ title: 'Deal deleted' });
      fetchDeals();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete deal',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredDeals = deals.filter((deal) => {
    const matchesSearch =
      deal.deal_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.borrower_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.property_address?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !filterStatus || deal.status === filterStatus;
    const matchesState = !filterState || deal.state === filterState;
    const matchesProduct = !filterProduct || deal.product_type === filterProduct;
    return matchesSearch && matchesStatus && matchesState && matchesProduct;
  });

  const clearFilters = () => {
    setFilterStatus('');
    setFilterState('');
    setFilterProduct('');
  };

  const hasActiveFilters = filterStatus || filterState || filterProduct;

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Deals</h1>
          <p className="text-muted-foreground mt-1">
            {filteredDeals.length} {filteredDeals.length === 1 ? 'deal' : 'deals'}
            {hasActiveFilters && ' (filtered)'}
          </p>
        </div>
        <Button onClick={() => navigate('/deals/new')} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Deal
        </Button>
      </div>

      <div className="section-card mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by deal #, borrower, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {[filterStatus, filterState, filterProduct].filter(Boolean).length}
                </span>
              )}
            </Button>
          </div>

          {showFilters && (
            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-border">
              <Select value={filterStatus || "all"} onValueChange={(v) => setFilterStatus(v === "all" ? "" : v)}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterState || "all"} onValueChange={(v) => setFilterState(v === "all" ? "" : v)}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {US_STATES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterProduct || "all"} onValueChange={(v) => setFilterProduct(v === "all" ? "" : v)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Product Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {PRODUCT_TYPES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {filteredDeals.length === 0 ? (
        <div className="section-card text-center py-12">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No deals found</h3>
          <p className="text-muted-foreground mb-4">
            {hasActiveFilters || searchQuery
              ? 'Try adjusting your filters or search'
              : 'Create your first deal to get started'}
          </p>
          {!hasActiveFilters && !searchQuery && (
            <Button onClick={() => navigate('/deals/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Deal
            </Button>
          )}
        </div>
      ) : (
        <div className="section-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Deal #</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Borrower</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">State</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Product</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Mode</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Created</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals.map((deal) => (
                  <tr
                    key={deal.id}
                    className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/deals/${deal.id}`)}
                  >
                    <td className="py-4 px-4">
                      <span className="font-medium text-foreground">{deal.deal_number}</span>
                    </td>
                    <td className="py-4 px-4 text-foreground">
                      {deal.borrower_name || <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="py-4 px-4 text-foreground">{deal.state}</td>
                    <td className="py-4 px-4 text-foreground text-sm">{deal.product_type}</td>
                    <td className="py-4 px-4">
                      <span className="text-xs text-muted-foreground">
                        {modeLabels[deal.mode]}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-medium text-foreground">
                      {formatCurrency(deal.loan_amount)}
                    </td>
                    <td className="py-4 px-4">
                      <span className={cn(
                        'inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize',
                        statusColors[deal.status]
                      )}>
                        {deal.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">
                      {new Date(deal.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/deals/${deal.id}`);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/deals/${deal.id}/edit`);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Enter Data
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(deal);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealsPage;
