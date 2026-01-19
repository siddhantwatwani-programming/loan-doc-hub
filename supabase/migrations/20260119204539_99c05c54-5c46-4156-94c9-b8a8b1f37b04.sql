-- Fix regression: enable upsert on deal_field_values by adding a unique constraint for (deal_id, field_dictionary_id)
-- Required for PostgREST/Supabase upsert with onConflict: 'deal_id,field_dictionary_id'

CREATE UNIQUE INDEX IF NOT EXISTS deal_field_values_deal_id_field_dictionary_id_key
  ON public.deal_field_values (deal_id, field_dictionary_id);
