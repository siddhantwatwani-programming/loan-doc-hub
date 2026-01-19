-- Phase 1: Expand - Add nullable field_dictionary_id columns
-- This is a non-breaking change that adds new columns without removing existing ones

-- Add nullable field_dictionary_id to template_field_maps
ALTER TABLE public.template_field_maps 
ADD COLUMN field_dictionary_id UUID;

-- Add nullable field_dictionary_id to deal_field_values
ALTER TABLE public.deal_field_values 
ADD COLUMN field_dictionary_id UUID;

-- Create indexes for new columns (for join performance)
CREATE INDEX idx_template_field_maps_dict_id 
ON public.template_field_maps(field_dictionary_id);

CREATE INDEX idx_deal_field_values_dict_id 
ON public.deal_field_values(field_dictionary_id);