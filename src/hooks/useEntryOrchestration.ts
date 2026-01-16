/**
 * Entry Orchestration Hook
 * 
 * Manages parallel/sequential entry modes for deal participants.
 * - Parallel: All participants can edit their allowed fields anytime
 * - Sequential: Only participant with lowest incomplete sequence can edit
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getMagicLinkSession } from '@/lib/magicLink';
import type { Database } from '@/integrations/supabase/types';

type ParticipantStatus = Database['public']['Enums']['participant_status'];

export interface DealParticipant {
  id: string;
  deal_id: string;
  role: string;
  user_id: string | null;
  access_method: 'login' | 'magic_link';
  sequence_order: number | null;
  status: ParticipantStatus;
  invited_at: string;
  completed_at: string | null;
}

export interface OrchestrationState {
  /** The deal's entry mode */
  mode: 'parallel' | 'sequential';
  /** Whether the current user can edit fields */
  canEdit: boolean;
  /** Whether the current user is waiting for previous participants */
  isWaiting: boolean;
  /** Current participant's info (null if not a participant) */
  currentParticipant: DealParticipant | null;
  /** All participants for this deal */
  allParticipants: DealParticipant[];
  /** The participant who must complete before current user (if sequential) */
  blockingParticipant: DealParticipant | null;
  /** Whether current participant has completed */
  hasCompleted: boolean;
  /** Loading state */
  loading: boolean;
}

export interface UseEntryOrchestrationResult extends OrchestrationState {
  /** Complete the current participant's section */
  completeSection: () => Promise<boolean>;
  /** Refresh orchestration state */
  refresh: () => Promise<void>;
}

/**
 * Determines the entry mode for a deal based on participant sequence orders
 * If any participant has a non-null sequence_order, it's sequential mode
 */
function determineMode(participants: DealParticipant[]): 'parallel' | 'sequential' {
  return participants.some(p => p.sequence_order !== null) ? 'sequential' : 'parallel';
}

/**
 * Find the participant with lowest incomplete sequence order
 */
function findActiveParticipant(participants: DealParticipant[]): DealParticipant | null {
  const incompleteSequential = participants
    .filter(p => p.sequence_order !== null && p.status !== 'completed')
    .sort((a, b) => (a.sequence_order || 0) - (b.sequence_order || 0));
  
  return incompleteSequential[0] || null;
}

/**
 * Find who is blocking the current participant
 */
function findBlockingParticipant(
  currentParticipant: DealParticipant,
  participants: DealParticipant[]
): DealParticipant | null {
  if (currentParticipant.sequence_order === null) return null;
  
  const blocking = participants
    .filter(p => 
      p.sequence_order !== null &&
      p.sequence_order < currentParticipant.sequence_order! &&
      p.status !== 'completed'
    )
    .sort((a, b) => (b.sequence_order || 0) - (a.sequence_order || 0));
  
  return blocking[0] || null;
}

export function useEntryOrchestration(dealId: string): UseEntryOrchestrationResult {
  const { user, role, isExternalUser } = useAuth();
  const [state, setState] = useState<OrchestrationState>({
    mode: 'parallel',
    canEdit: true,
    isWaiting: false,
    currentParticipant: null,
    allParticipants: [],
    blockingParticipant: null,
    hasCompleted: false,
    loading: true,
  });

  const fetchParticipants = useCallback(async () => {
    if (!dealId) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const { data: participants, error } = await supabase
        .from('deal_participants')
        .select('*')
        .eq('deal_id', dealId)
        .order('sequence_order', { ascending: true, nullsFirst: false });

      if (error) throw error;

      const allParticipants = (participants || []) as DealParticipant[];
      const mode = determineMode(allParticipants);

      // Determine current user's participant record
      let currentParticipant: DealParticipant | null = null;
      
      // Check if user is logged in
      if (user) {
        currentParticipant = allParticipants.find(p => p.user_id === user.id) || null;
      }
      
      // Check magic link session for external users
      if (!currentParticipant && isExternalUser) {
        const session = getMagicLinkSession();
        if (session?.participantId) {
          currentParticipant = allParticipants.find(p => p.id === session.participantId) || null;
        }
      }

      // Determine edit permissions
      let canEdit = true;
      let isWaiting = false;
      let blockingParticipant: DealParticipant | null = null;

      if (isExternalUser && currentParticipant) {
        if (currentParticipant.status === 'completed') {
          // Already completed - read only
          canEdit = false;
        } else if (mode === 'sequential') {
          // Sequential mode - check if it's this participant's turn
          const activeParticipant = findActiveParticipant(allParticipants);
          
          if (activeParticipant && activeParticipant.id !== currentParticipant.id) {
            canEdit = false;
            isWaiting = true;
            blockingParticipant = findBlockingParticipant(currentParticipant, allParticipants);
          }
        }
        // Parallel mode - can always edit if not completed
      } else if (!isExternalUser) {
        // Internal users (CSR) can always edit
        canEdit = true;
      }

      setState({
        mode,
        canEdit,
        isWaiting,
        currentParticipant,
        allParticipants,
        blockingParticipant,
        hasCompleted: currentParticipant?.status === 'completed',
        loading: false,
      });
    } catch (err) {
      console.error('Error fetching participants:', err);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [dealId, user, isExternalUser]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  // Subscribe to realtime updates for participants
  useEffect(() => {
    if (!dealId) return;

    const channel = supabase
      .channel(`deal-participants-${dealId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deal_participants',
          filter: `deal_id=eq.${dealId}`,
        },
        () => {
          fetchParticipants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealId, fetchParticipants]);

  const completeSection = useCallback(async (): Promise<boolean> => {
    if (!state.currentParticipant) {
      console.warn('No current participant to complete');
      return false;
    }

    try {
      // Call the edge function to handle completion
      const { data, error } = await supabase.functions.invoke('complete-participant-section', {
        body: {
          participantId: state.currentParticipant.id,
          dealId,
        },
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to complete section');
      }

      // Refresh state
      await fetchParticipants();
      return true;
    } catch (err) {
      console.error('Error completing section:', err);
      return false;
    }
  }, [state.currentParticipant, dealId, fetchParticipants]);

  return {
    ...state,
    completeSection,
    refresh: fetchParticipants,
  };
}
