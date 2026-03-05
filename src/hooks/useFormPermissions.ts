import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FormPermission {
  form_key: string;
  access_mode: 'editable' | 'view_only';
  screen_visible: boolean;
}

export function useFormPermissions() {
  const { role, user } = useAuth();
  const [permissions, setPermissions] = useState<FormPermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!role || !user) {
      setPermissions([]);
      setLoading(false);
      return;
    }
    fetchPermissions();
  }, [role, user]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('form_permissions' as any)
        .select('form_key, access_mode, screen_visible')
        .eq('role', role);

      if (error) throw error;
      setPermissions((data || []) as unknown as FormPermission[]);
    } catch (err) {
      console.error('Error fetching form permissions:', err);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const isFormViewOnly = (formKey: string): boolean => {
    const perm = permissions.find(p => p.form_key === formKey);
    return perm?.access_mode === 'view_only';
  };

  const isFormEditable = (formKey: string): boolean => {
    const perm = permissions.find(p => p.form_key === formKey);
    // Default to editable if no permission record found
    return !perm || perm.access_mode === 'editable';
  };

  return { permissions, loading, isFormViewOnly, isFormEditable, refetch: fetchPermissions };
}

// Hook for admin to manage all permissions
export function useFormPermissionsAdmin() {
  const [allPermissions, setAllPermissions] = useState<Array<FormPermission & { id: string; role: string }>>([]);
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

  return { allPermissions, loading, updatePermission, refetch: fetchAll };
}
