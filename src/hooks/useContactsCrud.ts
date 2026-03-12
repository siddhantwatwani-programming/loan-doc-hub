import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ContactRecord {
  id: string;
  contact_id: string;
  contact_type: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  company: string;
  contact_data: Record<string, string>;
  created_at: string;
  updated_at: string;
}

interface UseContactsCrudOptions {
  contactType: 'lender' | 'broker' | 'borrower';
  pageSize?: number;
}

export function useContactsCrud({ contactType, pageSize = 25 }: UseContactsCrudOptions) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchContacts = useCallback(async (page: number, search: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Count query
      let countQuery = supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('contact_type', contactType);

      if (search) {
        countQuery = countQuery.or(
          `full_name.ilike.%${search}%,email.ilike.%${search}%,contact_id.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%,phone.ilike.%${search}%,company.ilike.%${search}%`
        );
      }

      const { count, error: countError } = await countQuery;
      if (countError) throw countError;
      setTotalCount(count || 0);

      // Data query
      let dataQuery = supabase
        .from('contacts')
        .select('*')
        .eq('contact_type', contactType)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (search) {
        dataQuery = dataQuery.or(
          `full_name.ilike.%${search}%,email.ilike.%${search}%,contact_id.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%,phone.ilike.%${search}%,company.ilike.%${search}%`
        );
      }

      const { data, error } = await dataQuery;
      if (error) throw error;

      setContacts((data || []).map((row: any) => ({
        ...row,
        contact_data: (row.contact_data as Record<string, string>) || {},
      })));
    } catch (err: any) {
      console.error('Error fetching contacts:', err);
      toast.error('Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  }, [user, contactType, pageSize]);

  useEffect(() => {
    fetchContacts(currentPage, searchQuery);
  }, [currentPage, searchQuery, fetchContacts]);

  const createContact = useCallback(async (contactData: Record<string, string>) => {
    if (!user) return null;
    try {
      const fullName = contactData.full_name || `${contactData.first_name || ''} ${contactData.last_name || ''}`.trim();
      
      // Generate contact_id via DB function
      const { data: idData, error: idError } = await supabase.rpc('generate_contact_id', { p_type: contactType });
      if (idError) throw idError;

      const insertPayload = {
        contact_type: contactType,
        contact_id: idData as string,
        created_by: user.id,
        full_name: fullName,
        first_name: contactData.first_name || contactData['first_name'] || '',
        last_name: contactData.last_name || contactData['last_name'] || '',
        email: contactData.email || '',
        phone: contactData.phone || contactData['phone.cell'] || contactData['phone.mobile'] || contactData['phone.home'] || contactData['phone.work'] || '',
        city: contactData.city || contactData['address.city'] || contactData['primary_address.city'] || '',
        state: contactData.state || contactData['address.state'] || contactData['primary_address.state'] || '',
        company: contactData.company || '',
        contact_data: contactData,
      };

      const { data, error } = await supabase
        .from('contacts')
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;
      toast.success(`${contactType.charAt(0).toUpperCase() + contactType.slice(1)} created`);
      fetchContacts(currentPage, searchQuery);
      return data;
    } catch (err: any) {
      console.error('Error creating contact:', err);
      toast.error('Failed to create contact');
      return null;
    }
  }, [user, contactType, currentPage, searchQuery, fetchContacts]);

  const updateContact = useCallback(async (id: string, contactData: Record<string, string>) => {
    if (!user) return false;
    try {
      const fullName = contactData.full_name || `${contactData.first_name || ''} ${contactData.last_name || ''}`.trim();
      
      const { error } = await supabase
        .from('contacts')
        .update({
          full_name: fullName,
          first_name: contactData.first_name || '',
          last_name: contactData.last_name || '',
          email: contactData.email || '',
          phone: contactData.phone || contactData['phone.cell'] || contactData['phone.mobile'] || contactData['phone.home'] || contactData['phone.work'] || '',
          city: contactData.city || contactData['address.city'] || contactData['primary_address.city'] || '',
          state: contactData.state || contactData['address.state'] || contactData['primary_address.state'] || '',
          company: contactData.company || '',
          contact_data: contactData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Contact saved');
      fetchContacts(currentPage, searchQuery);
      return true;
    } catch (err: any) {
      console.error('Error updating contact:', err);
      toast.error('Failed to save contact');
      return false;
    }
  }, [user, currentPage, searchQuery, fetchContacts]);

  const deleteContact = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (error) throw error;
      toast.success('Contact deleted');
      fetchContacts(currentPage, searchQuery);
      return true;
    } catch (err: any) {
      console.error('Error deleting contact:', err);
      toast.error('Failed to delete contact');
      return false;
    }
  }, [currentPage, searchQuery, fetchContacts]);

  const deleteContacts = useCallback(async (ids: string[]) => {
    try {
      const { error } = await supabase.from('contacts').delete().in('id', ids);
      if (error) throw error;
      toast.success(`${ids.length} contact${ids.length !== 1 ? 's' : ''} deleted`);
      fetchContacts(currentPage, searchQuery);
      return true;
    } catch (err: any) {
      console.error('Error deleting contacts:', err);
      toast.error('Failed to delete contacts');
      return false;
    }
  }, [currentPage, searchQuery, fetchContacts]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    contacts,
    totalCount,
    totalPages,
    currentPage,
    setCurrentPage,
    searchQuery,
    setSearchQuery,
    isLoading,
    createContact,
    updateContact,
    deleteContact,
    deleteContacts,
    refresh: () => fetchContacts(currentPage, searchQuery),
  };
}
