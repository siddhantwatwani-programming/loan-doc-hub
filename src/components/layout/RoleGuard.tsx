import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth, AppRole } from '@/contexts/AuthContext';

interface RoleGuardProps {
  requiredRoles?: AppRole[];
  blockExternalUsers?: boolean;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ requiredRoles, blockExternalUsers = false }) => {
  const { role, isExternalUser } = useAuth();

  if (blockExternalUsers && isExternalUser) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = role && requiredRoles.includes(role);
    if (!hasRequiredRole) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
};
