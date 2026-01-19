-- Phase 2: Backfill - Populate field_dictionary_id from field_key

-- Backfill template_field_maps
UPDATE public.template_field_maps tfm
SET field_dictionary_id = fd.id
FROM public.field_dictionary fd
WHERE tfm.field_key = fd.field_key;

-- Backfill deal_field_values  
UPDATE public.deal_field_values dfv
SET field_dictionary_id = fd.id
FROM public.field_dictionary fd
WHERE dfv.field_key = fd.field_key;