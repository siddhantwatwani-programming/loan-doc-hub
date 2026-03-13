import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface LenderContact {
  contact_id: string;
  full_name: string;
  contact_data: Record<string, any>;
}

interface LenderIdSearchProps {
  value: string;
  onChange: (lenderId: string, lenderFullName: string, contactData?: Record<string, any>) => void;
  className?: string;
  disabled?: boolean;
}

export const LenderIdSearch: React.FC<LenderIdSearchProps> = ({
  value,
  onChange,
  className,
  disabled = false,
}) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LenderContact[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  const searchLenders = useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('contact_id, full_name, contact_data')
        .eq('contact_type', 'lender')
        .or(`contact_id.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
        .order('contact_id', { ascending: true })
        .limit(10);

      if (error) throw error;
      const mapped = (data || []).map((row: any) => ({
        contact_id: row.contact_id,
        full_name: row.full_name || '',
        contact_data: (row.contact_data as Record<string, any>) || {},
      }));
      setResults(mapped);
      setIsOpen(mapped.length > 0);
    } catch (err) {
      console.error('Lender search error:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val, '');

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchLenders(val), 300);
  };

  const handleSelect = (lender: LenderContact) => {
    setQuery(lender.contact_id);
    setIsOpen(false);
    setResults([]);
    onChange(lender.contact_id, lender.full_name, lender.contact_data);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative flex-1">
      <Input
        value={query}
        onChange={handleInputChange}
        onFocus={() => { if (results.length > 0) setIsOpen(true); }}
        placeholder="Search Lender ID or Name"
        className={cn('h-7 text-sm pr-8', className)}
        disabled={disabled}
      />
      {isLoading ? (
        <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />
      ) : (
        <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      )}

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md max-h-48 overflow-y-auto">
          {results.map((lender) => (
            <button
              key={lender.contact_id}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex justify-between items-center"
              onClick={() => handleSelect(lender)}
            >
              <span className="font-medium">{lender.contact_id}</span>
              <span className="text-muted-foreground truncate ml-2">{lender.full_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LenderIdSearch;
