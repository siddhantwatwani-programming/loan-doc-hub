import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FieldVisibility,
  fetchFieldVisibility,
  canViewFieldWithVisibility,
  canEditFieldWithVisibility,
  isInternalRole 
} from '@/lib/accessControl';

export const useFieldPermissions = () => {
  const { role, user } = useAuth();
  const [visibility, setVisibility] = useState<Map<string, FieldVisibility>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVisibility = async () => {
      if (!user || !role) {
        setVisibility(new Map());
        setLoading(false);
        return;
      }

      setLoading(true);
      const vis = await fetchFieldVisibility();
      setVisibility(vis);
      setLoading(false);
    };

    loadVisibility();
  }, [user, role]);

  const checkCanView = useCallback((fieldKey: string): boolean => {
    return canViewFieldWithVisibility(role, fieldKey, visibility);
  }, [role, visibility]);

  const checkCanEdit = useCallback((fieldKey: string): boolean => {
    return canEditFieldWithVisibility(role, fieldKey, visibility);
  }, [role, visibility]);

  const getFieldVisibility = useCallback((fieldKey: string): FieldVisibility | undefined => {
    return visibility.get(fieldKey);
  }, [visibility]);

  const hasFullAccess = isInternalRole(role);
  const isReadOnlyUser = role === 'admin'; // Admin can view all but only edit config

  return {
    visibility,
    loading,
    checkCanView,
    checkCanEdit,
    getFieldVisibility,
    hasFullAccess,
    isReadOnlyUser,
  };
};
