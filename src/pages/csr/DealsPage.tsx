import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Deal {
  id: string;
  borrowerName: string;
  loanAmount: number;
  status: 'draft' | 'in_progress' | 'pending_review' | 'completed';
  createdAt: string;
  propertyAddress: string;
}

const mockDeals: Deal[] = [
  { 
    id: 'DL-2024-001', 
    borrowerName: 'John Smith', 
    loanAmount: 450000,
    status: 'in_progress',
    createdAt: '2026-01-15',
    propertyAddress: '123 Main St, Los Angeles, CA'
  },
  { 
    id: 'DL-2024-002', 
    borrowerName: 'Jane Doe', 
    loanAmount: 320000,
    status: 'pending_review',
    createdAt: '2026-01-14',
    propertyAddress: '456 Oak Ave, San Diego, CA'
  },
  { 
    id: 'DL-2024-003', 
    borrowerName: 'Robert Johnson', 
    loanAmount: 580000,
    status: 'completed',
    createdAt: '2026-01-13',
    propertyAddress: '789 Pine Rd, San Francisco, CA'
  },
  { 
    id: 'DL-2024-004', 
    borrowerName: 'Sarah Williams', 
    loanAmount: 275000,
    status: 'draft',
    createdAt: '2026-01-12',
    propertyAddress: '321 Elm Blvd, Sacramento, CA'
  },
];

const statusLabels: Record<Deal['status'], string> = {
  draft: 'Draft',
  in_progress: 'In Progress',
  pending_review: 'Pending Review',
  completed: 'Completed',
};

const statusColors: Record<Deal['status'], string> = {
  draft: 'bg-muted text-muted-foreground',
  in_progress: 'bg-primary/10 text-primary',
  pending_review: 'bg-warning/10 text-warning',
  completed: 'bg-success/10 text-success',
};

export const DealsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDeals = mockDeals.filter(
    (deal) =>
      deal.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Deals</h1>
          <p className="text-muted-foreground mt-1">Manage your loan applications</p>
        </div>
        <Button onClick={() => navigate('/deals/new')} className="gap-2">
          <Plus className="h-4 w-4" />
          New Deal
        </Button>
      </div>

      <div className="section-card mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by borrower name or deal ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      <div className="section-card">
        {filteredDeals.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No deals found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try adjusting your search criteria' : 'Get started by creating your first deal'}
            </p>
            <Button onClick={() => navigate('/deals/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Deal
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Deal ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Borrower</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Property</th>
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
                      <span className="font-medium text-foreground">{deal.id}</span>
                    </td>
                    <td className="py-4 px-4 text-foreground">{deal.borrowerName}</td>
                    <td className="py-4 px-4 text-muted-foreground text-sm max-w-[200px] truncate">
                      {deal.propertyAddress}
                    </td>
                    <td className="py-4 px-4 font-medium text-foreground">
                      {formatCurrency(deal.loanAmount)}
                    </td>
                    <td className="py-4 px-4">
                      <span className={cn(
                        'inline-flex px-2.5 py-1 rounded-full text-xs font-medium',
                        statusColors[deal.status]
                      )}>
                        {statusLabels[deal.status]}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground text-sm">
                      {new Date(deal.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DealsPage;
