import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface AccountResult {
  contact_id: string;
  full_name: string;
}

interface PaymentAccountSearchProps {
  value: string;
  onChange: (accountId: string, name: string) => void;
  className?: string;
}

export const PaymentAccountSearch: React.FC<PaymentAccountSearchProps> = ({ value, onChange, className }) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<AccountResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { setQuery(value); }, [value]);

  const search = useCallback(async (term: string) => {
    setIsLoading(true);
    try {
      let qb = supabase
        .from('contacts')
        .select('contact_id, full_name')
        .eq('contact_type', 'lender');

      if (term && term.length >= 1) {
        qb = qb.or(`contact_id.ilike.%${term}%,full_name.ilike.%${term}%`);
      }

      const { data, error } = await qb.order('contact_id', { ascending: true }).limit(20);
      if (error) throw error;
      setResults((data || []).map((r: any) => ({ contact_id: r.contact_id, full_name: r.full_name || '' })));
      setIsOpen(true);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  };

  const handleSelect = (r: AccountResult) => {
    setQuery(r.contact_id);
    setIsOpen(false);
    onChange(r.contact_id, r.full_name);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={query}
        onChange={handleInputChange}
        onFocus={() => search(query)}
        placeholder="Search"
        className={cn('h-6 text-xs pr-5', className)}
      />
      {isLoading ? (
        <Loader2 className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground animate-spin" />
      ) : (
        <Search className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
      )}
      {isOpen && results.length > 0 && (
        <div className="absolute z-[9999] top-full left-0 right-0 mt-0.5 bg-popover border border-border rounded shadow-md max-h-40 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.contact_id}
              type="button"
              className="w-full text-left px-2 py-1 text-xs hover:bg-accent hover:text-accent-foreground flex justify-between"
              onClick={() => handleSelect(r)}
            >
              <span className="font-medium">{r.contact_id}</span>
              <span className="text-muted-foreground truncate ml-2">{r.full_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
