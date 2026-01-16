import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FolderOpen, 
  FileText, 
  Users, 
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, trend, className }) => (
  <div className={cn('stats-card', className)}>
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </div>
    <div className="flex items-end gap-2">
      <span className="text-3xl font-bold text-foreground">{value}</span>
      {trend && (
        <span className="text-sm text-success flex items-center gap-1 mb-1">
          <TrendingUp className="h-3 w-3" />
          {trend}
        </span>
      )}
    </div>
  </div>
);

const CSRDashboard: React.FC = () => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard label="Active Deals" value={12} icon={FolderOpen} trend="+2 this week" />
      <StatCard label="Pending Documents" value={8} icon={FileText} />
      <StatCard label="Borrowers" value={24} icon={Users} trend="+5 this month" />
      <StatCard label="Awaiting Review" value={3} icon={AlertCircle} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="section-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Deals</h3>
        <div className="space-y-3">
          {[
            { id: 'DL-2024-001', borrower: 'John Smith', status: 'In Progress', date: 'Jan 15, 2026' },
            { id: 'DL-2024-002', borrower: 'Jane Doe', status: 'Pending Review', date: 'Jan 14, 2026' },
            { id: 'DL-2024-003', borrower: 'Robert Johnson', status: 'Completed', date: 'Jan 13, 2026' },
          ].map((deal) => (
            <div 
              key={deal.id} 
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
            >
              <div>
                <p className="font-medium text-foreground">{deal.id}</p>
                <p className="text-sm text-muted-foreground">{deal.borrower}</p>
              </div>
              <div className="text-right">
                <p className={cn(
                  'text-sm font-medium',
                  deal.status === 'Completed' ? 'text-success' : 
                  deal.status === 'Pending Review' ? 'text-warning' : 'text-primary'
                )}>
                  {deal.status}
                </p>
                <p className="text-xs text-muted-foreground">{deal.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <button className="p-4 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-left group">
            <FolderOpen className="h-6 w-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-foreground">New Deal</p>
            <p className="text-sm text-muted-foreground">Start a new loan application</p>
          </button>
          <button className="p-4 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-left group">
            <Users className="h-6 w-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-foreground">Add Borrower</p>
            <p className="text-sm text-muted-foreground">Register new borrower</p>
          </button>
          <button className="p-4 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-left group">
            <FileText className="h-6 w-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-foreground">Upload Document</p>
            <p className="text-sm text-muted-foreground">Add supporting docs</p>
          </button>
          <button className="p-4 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-left group">
            <Clock className="h-6 w-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-foreground">View History</p>
            <p className="text-sm text-muted-foreground">Recent activities</p>
          </button>
        </div>
      </div>
    </div>
  </>
);

const AdminDashboard: React.FC = () => (
  <>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      <StatCard label="Total Users" value={15} icon={Users} />
      <StatCard label="Active CSRs" value={12} icon={Users} />
      <StatCard label="Pending Configurations" value={2} icon={AlertCircle} />
    </div>

    <div className="section-card">
      <h3 className="text-lg font-semibold text-foreground mb-4">System Overview</h3>
      <p className="text-muted-foreground">
        Welcome to the Admin Dashboard. Use the navigation menu to access system configuration and user management.
      </p>
    </div>
  </>
);

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
