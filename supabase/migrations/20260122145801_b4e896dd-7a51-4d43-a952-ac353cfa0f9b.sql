
-- Add foreign key constraint from template_field_maps to field_dictionary
ALTER TABLE public.template_field_maps
ADD CONSTRAINT fk_template_field_maps_field_dictionary
FOREIGN KEY (field_dictionary_id)
REFERENCES public.field_dictionary(id)
ON DELETE SET NULL;

-- Add foreign key constraint from template_field_maps to templates
ALTER TABLE public.template_field_maps
ADD CONSTRAINT fk_template_field_maps_template
FOREIGN KEY (template_id)
REFERENCES public.templates(id)
ON DELETE CASCADE;
