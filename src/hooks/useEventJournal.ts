import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface FieldChange {
  fieldLabel: string;
  oldValue: string;
  newValue: string;
}

export interface EventJournalEntry {
  id: string;
  deal_id: string;
  event_number: number;
  actor_user_id: string;
  actor_name: string | null;
  section: string;
  details: FieldChange[];
  created_at: string;
  ip_address: string | null;
}

let cachedIp: string | null = null;

async function getClientIp(): Promise<string> {
  if (cachedIp) return cachedIp;
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    cachedIp = data.ip || 'unknown';
  } catch {
    cachedIp = 'unknown';
  }
  return cachedIp!;
}

export function useEventJournalLogger() {
  const logFieldChanges = useCallback(async (
    dealId: string,
    section: string,
    changes: FieldChange[],
    actorUserId: string
  ) => {
    if (!changes.length) return;

    const ipAddress = await getClientIp();

    const { error } = await supabase
      .from('event_journal' as any)
      .insert({
        deal_id: dealId,
        section,
        details: changes,
        actor_user_id: actorUserId,
        event_number: 0, // Will be overridden by trigger
        ip_address: ipAddress,
      } as any);

    if (error) {
      console.error('Failed to log event journal entry:', error);
    }
  }, []);

  return { logFieldChanges };
}

export function useEventJournalEntries(dealId: string | null) {
  return useQuery({
    queryKey: ['event-journal', dealId],
    enabled: !!dealId,
    queryFn: async () => {
      if (!dealId) return [];

      const { data: entries, error } = await supabase
        .from('event_journal' as any)
        .select('*')
        .eq('deal_id', dealId)
        .order('event_number', { ascending: false });

      if (error) throw error;

      // Fetch actor names from profiles
      const actorIds = [...new Set((entries || []).map((e: any) => e.actor_user_id))];
      let profileMap: Record<string, string> = {};

      if (actorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', actorIds);

        (profiles || []).forEach((p: any) => {
          profileMap[p.user_id] = p.full_name || p.email || 'Unknown';
        });
      }

      return (entries || []).map((e: any): EventJournalEntry => ({
        id: e.id,
        deal_id: e.deal_id,
        event_number: e.event_number,
        actor_user_id: e.actor_user_id,
        actor_name: profileMap[e.actor_user_id] || 'Unknown',
        section: e.section,
        details: (e.details || []) as FieldChange[],
        created_at: e.created_at,
        ip_address: e.ip_address || null,
      }));
    },
  });
}
