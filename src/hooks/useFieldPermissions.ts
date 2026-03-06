import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  FieldVisibility,
  fetchFieldVisibility,
  canViewFieldWithVisibility,
  canEditFieldWithVisibility,
  isInternalRole
} from '@/lib/accessControl';
import { useFieldDictionaryCacheOptional } from '@/hooks/useFieldDictionaryCache';

export const useFieldPermissions = () => {
  const { role, user } = useAuth();
  const userId = user?.id ?? null;
  const cache = useFieldDictionaryCacheOptional();
  const [visibility, setVisibility] = useState<Map<string, FieldVisibility>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !role) {
      setVisibility(new Map());
      setLoading(false);
      return;
    }

    // Use cache if available
    if (cache && !cache.loading) {
      setVisibility(cache.visibilityMap);
      setLoading(false);
      return;
    }

    // Fallback: fetch independently (e.g. outside provider)
    const loadVisibility = async () => {
      setLoading(true);
      const vis = await fetchFieldVisibility();
      setVisibility(vis);
      setLoading(false);
    };

    void loadVisibility();
  }, [userId, role, cache]);

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
