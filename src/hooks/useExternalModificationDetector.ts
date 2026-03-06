/**
 * External Modification Detector Hook
 * 
 * Detects when external users have modified deal fields.
 * Used by CSR to display warning banners before generating documents.
 * 
 * Optimized: Uses batch queries instead of N+1 loop.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useFieldDictionaryCacheOptional } from '@/hooks/useFieldDictionaryCache';

interface ExternalModification {
  field_dictionary_id: string;
  field_key: string;
  updated_by: string;
  updated_at: string;
  updater_role: string;
  updater_name: string | null;
}

interface UseExternalModificationDetectorReturn {
  hasExternalModifications: boolean;
  externalModifications: ExternalModification[];
  loading: boolean;
  lastReviewedAt: string | null;
  markAsReviewed: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

/**
 * Hook to detect if external users have modified deal fields since last CSR review
 * @param dealId - The deal to check
 * @param enabled - When false, skip fetching (for inactive workspace tabs)
 */
export function useExternalModificationDetector(
  dealId: string,
  enabled: boolean = true
): UseExternalModificationDetectorReturn {
  const [externalModifications, setExternalModifications] = useState<ExternalModification[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastReviewedAt, setLastReviewedAt] = useState<string | null>(null);
  const cache = useFieldDictionaryCacheOptional();
  const hasLoadedRef = useRef(false);
  const cacheRef = useRef(cache);
  cacheRef.current = cache;

  const fetchModifications = useCallback(async () => {
    if (!dealId || !enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get the current user (CSR)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get the user's role
      const { data: userRoleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      // Only relevant for CSR/Admin users
      if (!userRoleData || !['csr', 'admin'].includes(userRoleData.role)) {
        setLoading(false);
        return;
      }

      // Find the last time CSR reviewed this deal
      const { data: lastReviewActivity } = await supabase
        .from('activity_log')
        .select('created_at')
        .eq('deal_id', dealId)
        .eq('action_type', 'ExternalDataReviewed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const reviewedAt = lastReviewActivity?.created_at || null;
      setLastReviewedAt(reviewedAt);

      // Fetch deal_section_values
      const { data: sectionValues, error: svError } = await supabase
        .from('deal_section_values')
        .select('section, field_values')
        .eq('deal_id', dealId);

      if (svError) throw svError;

      // Use cache ref for field_key lookup if available, otherwise fetch
      const currentCache = cacheRef.current;
      let fieldDictMap: Map<string, string>;
      if (currentCache && !currentCache.loading) {
        fieldDictMap = new Map<string, string>();
        currentCache.entriesById.forEach((entry, id) => {
          fieldDictMap.set(id, entry.field_key);
        });
      } else {
        // Collect all field_dictionary_ids from JSONB keys
        const allFieldDictIds: string[] = [];
        ((sectionValues || []) as any[]).forEach((sv) => {
          Object.keys(sv.field_values || {}).forEach(id => {
            // Handle composite keys (prefix::id)
            const actualId = id.includes('::') ? id.split('::')[1] : id;
            if (!allFieldDictIds.includes(actualId)) allFieldDictIds.push(actualId);
          });
        });

        const { data: fieldDictEntries } = await supabase
          .from('field_dictionary')
          .select('id, field_key')
          .in('id', allFieldDictIds);

        fieldDictMap = new Map<string, string>();
        (fieldDictEntries || []).forEach((fd: any) => fieldDictMap.set(fd.id, fd.field_key));
      }

      // --- BATCH: Collect all unique updated_by user IDs ---
      const allUpdaterIds = new Set<string>();
      for (const sv of (sectionValues || []) as any[]) {
        for (const [, data] of Object.entries(sv.field_values || {}) as [string, any][]) {
          if (data?.updated_by) {
            allUpdaterIds.add(data.updated_by);
          }
        }
      }

      if (allUpdaterIds.size === 0) {
        setExternalModifications([]);
        setLoading(false);
        return;
      }

      // ONE batch query for all user roles
      const { data: allRoles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', Array.from(allUpdaterIds));

      const roleMap = new Map<string, string>();
      (allRoles || []).forEach((r: any) => roleMap.set(r.user_id, r.role));

      // Identify external user IDs
      const externalUserIds = Array.from(allUpdaterIds).filter(uid => {
        const role = roleMap.get(uid);
        return role && ['borrower', 'broker', 'lender'].includes(role);
      });

      // ONE batch query for external user profiles
      let profileMap = new Map<string, string | null>();
      if (externalUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', externalUserIds);

        (profiles || []).forEach((p: any) => profileMap.set(p.user_id, p.full_name));
      }

      // --- Process results in memory ---
      const modifications: ExternalModification[] = [];
      for (const sv of (sectionValues || []) as any[]) {
        for (const [storageKey, data] of Object.entries(sv.field_values || {}) as [string, any][]) {
          if (!data?.updated_by) continue;

          const updaterRole = roleMap.get(data.updated_by);
          const isExternal = updaterRole && ['borrower', 'broker', 'lender'].includes(updaterRole);

          if (isExternal) {
            if (!reviewedAt || new Date(data.updated_at) > new Date(reviewedAt)) {
              const actualId = storageKey.includes('::') ? storageKey.split('::')[1] : storageKey;
              const fieldKey = fieldDictMap.get(actualId) || actualId;
              modifications.push({
                field_dictionary_id: actualId,
                field_key: fieldKey,
                updated_by: data.updated_by,
                updated_at: data.updated_at,
                updater_role: updaterRole,
                updater_name: profileMap.get(data.updated_by) || null,
              });
            }
          }
        }
      }

      setExternalModifications(modifications);
    } catch (error) {
      console.error('Error fetching external modifications:', error);
    } finally {
      setLoading(false);
    }
  }, [dealId, enabled]);

  // Only fetch once per dealId, guarded by ref to prevent re-fetches on tab switch
  useEffect(() => {
    if (!dealId || !enabled) return;
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    fetchModifications();
  }, [dealId, enabled, fetchModifications]);

  const markAsReviewed = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('activity_log')
        .insert({
          deal_id: dealId,
          actor_user_id: user.id,
          action_type: 'ExternalDataReviewed',
          action_details: {
            fieldsReviewed: externalModifications.length,
            fieldKeys: externalModifications.map(m => m.field_key),
          },
        });

      if (error) throw error;

      setExternalModifications([]);
      setLastReviewedAt(new Date().toISOString());
      
      return true;
    } catch (error) {
      console.error('Error marking as reviewed:', error);
      return false;
    }
  };

  return {
    hasExternalModifications: externalModifications.length > 0,
    externalModifications,
    loading,
    lastReviewedAt,
    markAsReviewed,
    refresh: fetchModifications,
  };
}
