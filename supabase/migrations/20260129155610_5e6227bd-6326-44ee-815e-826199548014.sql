-- Add description field for properties
INSERT INTO public.field_dictionary (field_key, label, data_type, section, description)
VALUES ('property1.description', 'Description', 'text', 'property', 'Property description for display in grid')
ON CONFLICT (field_key) DO NOTHING;