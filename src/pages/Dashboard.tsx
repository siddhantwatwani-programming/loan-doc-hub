import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  FolderOpen, 
  FileText, 
  Users, 
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  className?: string;
  loading?: boolean;
}

interface DealSummary {
  id: string;
  deal_number: string;
  borrower_name: string | null;
  status: 'draft' | 'ready' | 'generated';
  updated_at: string;
}

interface DashboardStats {
  totalDeals: number;
  draftDeals: number;
  readyDeals: number;
  generatedDeals: number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, trend, className, loading }) => (
  <div className={cn('stats-card', className)}>
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </div>
    <div className="flex items-end gap-2">
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : (
        <span className="text-3xl font-bold text-foreground">{value}</span>
      )}
      {trend && !loading && (
        <span className="text-sm text-success flex items-center gap-1 mb-1">
          <TrendingUp className="h-3 w-3" />
          {trend}
        </span>
      )}
    </div>
  </div>
);

const CSRDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({ totalDeals: 0, draftDeals: 0, readyDeals: 0, generatedDeals: 0 });
  const [recentDeals, setRecentDeals] = useState<DealSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all deals for stats
      const { data: deals, error } = await supabase
        .from('deals')
        .select('id, deal_number, borrower_name, status, updated_at')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const allDeals = deals || [];
      
      setStats({
        totalDeals: allDeals.length,
        draftDeals: allDeals.filter(d => d.status === 'draft').length,
        readyDeals: allDeals.filter(d => d.status === 'ready').length,
        generatedDeals: allDeals.filter(d => d.status === 'generated').length,
      });

      // Get recent 5 deals
      setRecentDeals(allDeals.slice(0, 5) as DealSummary[]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'draft': return { label: 'Draft', color: 'text-muted-foreground' };
      case 'ready': return { label: 'Ready', color: 'text-primary' };
      case 'generated': return { label: 'Generated', color: 'text-success' };
      default: return { label: status, color: 'text-muted-foreground' };
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Deals" value={stats.totalDeals} icon={FolderOpen} loading={loading} />
        <StatCard label="Draft" value={stats.draftDeals} icon={Clock} loading={loading} />
        <StatCard label="Ready" value={stats.readyDeals} icon={CheckCircle2} loading={loading} />
        <StatCard label="Generated" value={stats.generatedDeals} icon={FileText} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="section-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Deals</h3>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recentDeals.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No deals yet</p>
          ) : (
            <div className="space-y-3">
              {recentDeals.map((deal) => {
                const statusDisplay = getStatusDisplay(deal.status);
                return (
                  <div 
                    key={deal.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => navigate(`/deals/${deal.id}`)}
                  >
                    <div>
                      <p className="font-medium text-foreground">{deal.deal_number}</p>
                      <p className="text-sm text-muted-foreground">{deal.borrower_name || 'No borrower'}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn('text-sm font-medium', statusDisplay.color)}>
                        {statusDisplay.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(deal.updated_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="section-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => navigate('/deals/new')}
              className="p-4 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-left group"
            >
              <FolderOpen className="h-6 w-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-foreground">New Deal</p>
              <p className="text-sm text-muted-foreground">Start a new loan application</p>
            </button>
            <button 
              onClick={() => navigate('/users')}
              className="p-4 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-left group"
            >
              <Users className="h-6 w-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-foreground">View Users</p>
              <p className="text-sm text-muted-foreground">Manage user directory</p>
            </button>
            <button 
              onClick={() => navigate('/documents')}
              className="p-4 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-left group"
            >
              <FileText className="h-6 w-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-foreground">Documents</p>
              <p className="text-sm text-muted-foreground">Download generated docs</p>
            </button>
            <button 
              onClick={() => navigate('/deals')}
              className="p-4 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-left group"
            >
              <Clock className="h-6 w-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-medium text-foreground">All Deals</p>
              <p className="text-sm text-muted-foreground">View all deals</p>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const AdminDashboard: React.FC = () => {
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        if (!error && count !== null) {
          setUserCount(count);
        }
      } catch (error) {
        console.error('Error fetching user count:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserCount();
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Users" value={userCount} icon={Users} loading={loading} />
        <StatCard label="Active CSRs" value={userCount} icon={Users} loading={loading} />
        <StatCard label="Pending Configurations" value={0} icon={AlertCircle} loading={loading} />
      </div>

      <div className="section-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">System Overview</h3>
        <p className="text-muted-foreground">
          Welcome to the Admin Dashboard. Use the navigation menu to access system configuration and user management.
        </p>
      </div>
    </>
  );
};

export const Dashboard: React.FC = () => {
  const { role, user } = useAuth();

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}
        </h1>
        <p className="text-muted-foreground mt-1">
          {role === 'admin' 
            ? 'Manage system configuration and users'
            : 'Here\'s what\'s happening with your deals today'
          }
        </p>
      </div>

      {role === 'admin' ? <AdminDashboard /> : <CSRDashboard />}
    </div>
  );
};

export default Dashboard;