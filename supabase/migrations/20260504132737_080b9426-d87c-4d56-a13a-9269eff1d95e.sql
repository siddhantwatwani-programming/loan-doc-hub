INSERT INTO public.field_dictionary (field_key, label, section, data_type, form_type, allowed_roles)
VALUES (
  'property1.property_owner',
  'Property Owner',
  'property'::field_section,
  'text'::field_data_type,
  'primary',
  ARRAY['admin','csr']
)
ON CONFLICT (field_key) DO NOTHING;