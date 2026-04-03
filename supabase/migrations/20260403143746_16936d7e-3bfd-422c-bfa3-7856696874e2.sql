INSERT INTO public.field_dictionary (field_key, label, section, data_type, is_repeatable, form_type)
VALUES
  ('propertytax.active', 'Active', 'property', 'boolean', true, 'tax'),
  ('propertytax.current', 'Current', 'property', 'boolean', true, 'tax'),
  ('propertytax.delinquent', 'Delinquent', 'property', 'boolean', true, 'tax')
ON CONFLICT DO NOTHING;