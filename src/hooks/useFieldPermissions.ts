import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FieldPermission, 
  fetchFieldPermissions, 
  canViewField, 
  canEditField,
  isInternalRole 
} from '@/lib/accessControl';

export const useFieldPermissions = () => {
  const { role, user } = useAuth();
  const [permissions, setPermissions] = useState<Map<string, FieldPermission>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      if (!user || !role) {
        setPermissions(new Map());
        setLoading(false);
        return;
      }

      // Internal users don't need to fetch permissions
      if (isInternalRole(role)) {
        setPermissions(new Map());
        setLoading(false);
        return;
      }

      setLoading(true);
      const perms = await fetchFieldPermissions(role);
      setPermissions(perms);
      setLoading(false);
    };

    loadPermissions();
  }, [user, role]);

  const checkCanView = (fieldKey: string): boolean => {
    return canViewField(role, fieldKey, permissions);
  };

  const checkCanEdit = (fieldKey: string): boolean => {
    return canEditField(role, fieldKey, permissions);
  };

  const hasFullAccess = isInternalRole(role);

  return {
    permissions,
    loading,
    checkCanView,
    checkCanEdit,
    hasFullAccess,
  };
};
