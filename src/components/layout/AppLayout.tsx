import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from './AppSidebar';
import { Loader2 } from 'lucide-react';

interface AppLayoutProps {
  requiredRoles?: ('admin' | 'csr')[];
}

export const AppLayout: React.FC<AppLayoutProps> = ({ requiredRoles }) => {
  const { user, role, loading } = useAuth();

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

  if (requiredRoles && !requiredRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="pl-64 min-h-screen">
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
