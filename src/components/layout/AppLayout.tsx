import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { AppSidebar } from './AppSidebar';
import { Loader2 } from 'lucide-react';
import { isExternalRole } from '@/lib/accessControl';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  requiredRoles?: AppRole[];
  blockExternalUsers?: boolean;
}

const LayoutContent: React.FC<AppLayoutProps> = ({ requiredRoles, blockExternalUsers = false }) => {
  const { user, role, loading, isExternalUser } = useAuth();
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

  // Block external users from admin routes
  if (blockExternalUsers && isExternalUser) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check if user has required role
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.includes(role);
    if (!hasRequiredRole) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className={cn(
        "min-h-screen transition-all duration-300",
        isCollapsed ? "pl-16" : "pl-64"
      )}>
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export const AppLayout: React.FC<AppLayoutProps> = (props) => {
  return (
    <SidebarProvider>
      <LayoutContent {...props} />
    </SidebarProvider>
  );
};
