import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FormPermission {
  form_key: string;
  access_mode: 'editable' | 'view_only';
  screen_visible: boolean;
}

const FORM_KEYS = [
  'borrower',
  'co_borrower',
  'property',
  'loan_terms',
  'lender',
  'broker',
  'charges',
  'notes',
  'insurance',
  'liens',
  'origination',
  'trust_ledger',
  'participants',
];

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
        // Per-user permissions from user_form_permissions
        const { data, error } = await supabase
          .from('user_form_permissions')
          .select('form_key, access_mode')
          .eq('user_id', currentUserId);

        if (error) throw error;

        const userPerms = (data || []).map((d: any) => ({
          form_key: d.form_key,
          access_mode: d.access_mode as 'editable' | 'view_only',
          screen_visible: true,
        }));

        setPermissions(userPerms);
      } else if (currentRole === 'admin') {
        // Admin has full access - no restrictions
        setPermissions([]);
      } else {
        // External roles use form_permissions table
        const { data, error } = await supabase
          .from('form_permissions')
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
    // For CSR: default to view_only if no record exists
    const perm = permissions.find(p => p.form_key === formKey);
    if (!perm) return true; // Default: Read Only
    return perm.access_mode === 'view_only';
  };

  const isFormEditable = (formKey: string): boolean => {
    const perm = permissions.find(p => p.form_key === formKey);
    // Default to view_only (not editable) if no permission record found
    if (!perm) return false;
    return perm.access_mode === 'editable';
  };

  return { permissions, loading, isFormViewOnly, isFormEditable, refetch: () => fetchPermissions(role, userId) };
}

// Hook for admin to manage per-user form permissions
export function useFormPermissionsAdmin() {
  const [csrUsers, setCsrUsers] = useState<Array<{ user_id: string; full_name: string | null; email: string | null }>>([]);
  const [userPermissions, setUserPermissions] = useState<Array<{ id: string; form_key: string; access_mode: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [permLoading, setPermLoading] = useState(false);

  // Fetch all CSR users
  useEffect(() => {
    const fetchCsrUsers = async () => {
      try {
        setLoading(true);
        const { data: roles, error: rolesErr } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'csr');

        if (rolesErr) throw rolesErr;

        const userIds = (roles || []).map((r: any) => r.user_id);
        if (userIds.length === 0) {
          setCsrUsers([]);
          setLoading(false);
          return;
        }

        const { data: profiles, error: profErr } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', userIds);

        if (profErr) throw profErr;

        setCsrUsers((profiles || []).map((p: any) => ({
          user_id: p.user_id,
          full_name: p.full_name,
          email: p.email,
        })));
      } catch (err) {
        console.error('Error fetching CSR users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCsrUsers();
  }, []);

  // Fetch permissions for a specific user, auto-seed if none exist
  const fetchUserPermissions = async (userId: string) => {
    try {
      setPermLoading(true);
      const { data, error } = await supabase
        .from('user_form_permissions')
        .select('id, form_key, access_mode')
        .eq('user_id', userId)
        .order('form_key');

      if (error) throw error;

      if (!data || data.length === 0) {
        // Auto-seed all forms as view_only
        const inserts = FORM_KEYS.map(fk => ({
          user_id: userId,
          form_key: fk,
          access_mode: 'view_only',
        }));

        const { error: insertErr } = await supabase
          .from('user_form_permissions')
          .insert(inserts);

        if (insertErr) throw insertErr;

        // Re-fetch after seeding
        const { data: seeded, error: seedErr } = await supabase
          .from('user_form_permissions')
          .select('id, form_key, access_mode')
          .eq('user_id', userId)
          .order('form_key');

        if (seedErr) throw seedErr;
        setUserPermissions((seeded || []) as any);
      } else {
        // Check for missing form keys and insert them
        const existingKeys = new Set(data.map((d: any) => d.form_key));
        const missingKeys = FORM_KEYS.filter(fk => !existingKeys.has(fk));

        if (missingKeys.length > 0) {
          const inserts = missingKeys.map(fk => ({
            user_id: userId,
            form_key: fk,
            access_mode: 'view_only',
          }));

          await supabase.from('user_form_permissions').insert(inserts);

          // Re-fetch after adding missing keys
          const { data: updated, error: updErr } = await supabase
            .from('user_form_permissions')
            .select('id, form_key, access_mode')
            .eq('user_id', userId)
            .order('form_key');

          if (updErr) throw updErr;
          setUserPermissions((updated || []) as any);
        } else {
          setUserPermissions(data as any);
        }
      }
    } catch (err) {
      console.error('Error fetching user permissions:', err);
    } finally {
      setPermLoading(false);
    }
  };

  // Update a single permission
  const updatePermission = async (id: string, accessMode: 'editable' | 'view_only') => {
    const { error } = await supabase
      .from('user_form_permissions')
      .update({ access_mode: accessMode, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  };

  // Keep legacy exports for backward compat
  const allPermissions: any[] = [];
  const ensureLevelPermissions = async (_level: string) => {};

  return {
    csrUsers,
    userPermissions,
    loading,
    permLoading,
    fetchUserPermissions,
    updatePermission,
    // Legacy compat
    allPermissions,
    ensureLevelPermissions,
    refetch: () => {},
  };
}
