import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FormPermission {
  form_key: string;
  access_mode: 'editable' | 'view_only';
  screen_visible: boolean;
}

export function useFormPermissions() {
  const { role, user } = useAuth();
  const userId = user?.id ?? null;
  const [permissions, setPermissions] = useState<FormPermission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async (currentRole: typeof role, currentUserId: string | null) => {
    if (!currentRole || !currentUserId) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      if (currentRole === 'csr') {
        // Get user's permission level
        const { data: levelData } = await supabase
          .from('user_permission_levels')
          .select('permission_level')
          .eq('user_id', currentUserId)
          .single();

        const permLevel = (levelData as any)?.permission_level || 'full';

        // For "full" level, treat everything as editable (default behavior)
        if (permLevel === 'full') {
          setPermissions([]);
          setLoading(false);
          return;
        }

        // For "view_only" level, all forms are view-only
        if (permLevel === 'view_only') {
          const { data, error } = await supabase
            .from('form_permissions' as any)
            .select('form_key, access_mode, screen_visible')
            .eq('role', 'csr');

          if (error) throw error;
          // Override all to view_only
          const allViewOnly = (data || []).map((d: any) => ({
            ...d,
            access_mode: 'view_only',
          }));
          setPermissions(allViewOnly as unknown as FormPermission[]);
          setLoading(false);
          return;
        }

        // For "limited" level, check level-specific permissions
        const { data, error } = await supabase
          .from('form_permissions' as any)
          .select('form_key, access_mode, screen_visible')
          .eq('role', 'csr')
          .eq('permission_level', 'limited');

        if (error) throw error;
        setPermissions((data || []) as unknown as FormPermission[]);
      } else {
        const { data, error } = await supabase
          .from('form_permissions' as any)
          .select('form_key, access_mode, screen_visible')
          .eq('role', currentRole);

        if (error) throw error;
        setPermissions((data || []) as unknown as FormPermission[]);
      }
    } catch (err) {
      console.error('Error fetching form permissions:', err);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPermissions(role, userId);
  }, [role, userId, fetchPermissions]);

  const isFormViewOnly = (formKey: string): boolean => {
    const perm = permissions.find(p => p.form_key === formKey);
    return perm?.access_mode === 'view_only';
  };

  const isFormEditable = (formKey: string): boolean => {
    const perm = permissions.find(p => p.form_key === formKey);
    // Default to editable if no permission record found
    return !perm || perm.access_mode === 'editable';
  };

  return { permissions, loading, isFormViewOnly, isFormEditable, refetch: () => fetchPermissions(role, userId) };
}

// Hook for admin to manage all permissions
export function useFormPermissionsAdmin() {
  const [allPermissions, setAllPermissions] = useState<Array<FormPermission & { id: string; role: string; permission_level?: string | null }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('form_permissions' as any)
        .select('*')
        .order('role')
        .order('form_key');

      if (error) throw error;
      setAllPermissions((data || []) as any);
    } catch (err) {
      console.error('Error fetching all form permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = async (id: string, accessMode: 'editable' | 'view_only') => {
    const { error } = await supabase
      .from('form_permissions' as any)
      .update({ access_mode: accessMode, updated_at: new Date().toISOString() } as any)
      .eq('id', id);

    if (error) throw error;
    await fetchAll();
  };

  // Ensure CSR permission level rows exist for a given level
  const ensureLevelPermissions = async (level: string) => {
    // Get existing CSR base permissions (no permission_level)
    const basePerms = allPermissions.filter(p => p.role === 'csr' && !p.permission_level);
    const levelPerms = allPermissions.filter(p => p.role === 'csr' && p.permission_level === level);

    if (basePerms.length > 0 && levelPerms.length === 0) {
      // Seed level-specific rows from base CSR permissions
      const inserts = basePerms.map(bp => ({
        form_key: bp.form_key,
        role: 'csr' as const,
        access_mode: level === 'view_only' ? 'view_only' : bp.access_mode,
        screen_visible: bp.screen_visible,
        permission_level: level,
      }));

      const { error } = await supabase
        .from('form_permissions' as any)
        .insert(inserts as any);

      if (error) {
        console.error('Error seeding level permissions:', error);
      } else {
        await fetchAll();
      }
    }
  };

  return { allPermissions, loading, updatePermission, ensureLevelPermissions, refetch: fetchAll };
}
