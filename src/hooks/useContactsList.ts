import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ContactRecord {
  id: string;
  contact_type: string;
  contact_id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  company: string;
  contact_data: Record<string, any>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const PAGE_SIZE = 25;

export function useContactsList(contactType: string) {
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      let query = (supabase as any)
        .from('contacts')
        .select('*', { count: 'exact' })
        .eq('contact_type', contactType)
        .order('created_at', { ascending: false });

      if (searchQuery.trim()) {
        const q = `%${searchQuery.trim()}%`;
        query = query.or(
          `full_name.ilike.${q},email.ilike.${q},contact_id.ilike.${q},city.ilike.${q},phone.ilike.${q},company.ilike.${q}`
        );
      }

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      setContacts((data || []) as ContactRecord[]);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  }, [contactType, page, searchQuery]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return {
    contacts,
    totalCount,
    totalPages,
    loading,
    page,
    setPage,
    searchQuery,
    setSearchQuery,
    refetch: fetchContacts,
    pageSize: PAGE_SIZE,
  };
}

export async function createContact(
  contactType: string,
  data: Partial<ContactRecord>,
  userId: string
): Promise<ContactRecord | null> {
  const { data: idData, error: idError } = await (supabase as any).rpc(
    'generate_contact_id',
    { p_type: contactType }
  );
  if (idError) throw idError;

  const contactId = idData as string;

  const { data: result, error } = await (supabase as any)
    .from('contacts')
    .insert({
      contact_type: contactType,
      contact_id: contactId,
      full_name: data.full_name || '',
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      email: data.email || '',
      phone: data.phone || '',
      city: data.city || '',
      state: data.state || '',
      company: data.company || '',
      contact_data: data.contact_data || {},
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return result as ContactRecord;
}

export async function updateContact(
  id: string,
  data: Partial<ContactRecord>
): Promise<ContactRecord | null> {
  const updatePayload: Record<string, any> = {};
  if (data.full_name !== undefined) updatePayload.full_name = data.full_name;
  if (data.first_name !== undefined) updatePayload.first_name = data.first_name;
  if (data.last_name !== undefined) updatePayload.last_name = data.last_name;
  if (data.email !== undefined) updatePayload.email = data.email;
  if (data.phone !== undefined) updatePayload.phone = data.phone;
  if (data.city !== undefined) updatePayload.city = data.city;
  if (data.state !== undefined) updatePayload.state = data.state;
  if (data.company !== undefined) updatePayload.company = data.company;
  if (data.contact_data !== undefined) updatePayload.contact_data = data.contact_data;

  const { data: result, error } = await (supabase as any)
    .from('contacts')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return result as ContactRecord;
}

export async function deleteContact(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('contacts')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function fetchContactByContactId(
  contactId: string
): Promise<ContactRecord | null> {
  const { data, error } = await (supabase as any)
    .from('contacts')
    .select('*')
    .eq('contact_id', contactId)
    .maybeSingle();
  if (error) return null;
  return data as ContactRecord | null;
}
