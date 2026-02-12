import { supabase } from '@/integrations/supabase/client';

const PAGE_SIZE = 1000;

/**
 * Fetches all rows from a Supabase table, paginating in batches of 1,000
 * to work around PostgREST's max-rows limit.
 *
 * @param buildQuery - callback that receives the supabase client and returns
 *   a query builder (without .range() or .limit()).
 * @returns The concatenated array of all rows.
 */
export async function fetchAllRows<T = any>(
  buildQuery: (client: typeof supabase) => any
): Promise<T[]> {
  const allRows: T[] = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await buildQuery(supabase).range(from, to);

    if (error) throw error;

    const rows = (data || []) as T[];
    allRows.push(...rows);

    if (rows.length < PAGE_SIZE) break; // last page
    from += PAGE_SIZE;
  }

  return allRows;
}
