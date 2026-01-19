/**
 * External Modification Detector Hook
 * 
 * Detects when external users have modified deal fields.
 * Used by CSR to display warning banners before generating documents.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
 */
export function useExternalModificationDetector(dealId: string): UseExternalModificationDetectorReturn {
  const [externalModifications, setExternalModifications] = useState<ExternalModification[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastReviewedAt, setLastReviewedAt] = useState<string | null>(null);

  const fetchModifications = useCallback(async () => {
    if (!dealId) {
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

      // Find the last time CSR reviewed this deal (last CSR save activity)
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

      // Find field values updated by external users (borrower, broker, lender)
      // We need to join with user_roles to check the updater's role
      const { data: fieldValues, error } = await supabase
        .from('deal_field_values')
        .select(`
          field_dictionary_id,
          updated_by,
          updated_at,
          field_dictionary!fk_deal_field_values_field_dictionary(field_key)
        `)
        .eq('deal_id', dealId)
        .not('updated_by', 'is', null);

      if (error) throw error;

      // For each field value, check if the updater is an external user
      const modifications: ExternalModification[] = [];
      
      for (const fv of (fieldValues || []) as any[]) {
        if (!fv.updated_by) continue;

        // Get the updater's role
        const { data: updaterRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', fv.updated_by)
          .single();

        // Check if it's an external role
        const isExternal = updaterRole && ['borrower', 'broker', 'lender'].includes(updaterRole.role);
        
        if (isExternal) {
          // Check if this modification is after the last review
          if (!reviewedAt || new Date(fv.updated_at) > new Date(reviewedAt)) {
            // Get the updater's profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', fv.updated_by)
              .single();

            const fieldKey = fv.field_dictionary?.field_key || fv.field_dictionary_id;
            modifications.push({
              field_dictionary_id: fv.field_dictionary_id,
              field_key: fieldKey,
              updated_by: fv.updated_by,
              updated_at: fv.updated_at,
              updater_role: updaterRole.role,
              updater_name: profile?.full_name || null,
            });
          }
        }
      }

      setExternalModifications(modifications);
    } catch (error) {
      console.error('Error fetching external modifications:', error);
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    fetchModifications();
  }, [fetchModifications]);

  const markAsReviewed = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Log that CSR reviewed external data
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

      // Clear the modifications state
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
