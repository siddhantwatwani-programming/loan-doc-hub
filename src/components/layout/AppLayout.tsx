import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const AppLayout: React.FC = () => {
  const { user, role, loading } = useAuth();
  const { isCollapsed } = useSidebar();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="auth-card text-center animate-slide-up">
          <h2 className="text-xl font-semibold text-foreground mb-2">No Role Assigned</h2>
          <p className="text-muted-foreground mb-4">
            Your account has been created, but you don't have a role assigned yet.
            Please contact an administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <AppHeader />
      <main className={cn(
        "min-h-screen pt-12 transition-all duration-300",
        isCollapsed ? "pl-16" : "pl-64"
      )}>
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
