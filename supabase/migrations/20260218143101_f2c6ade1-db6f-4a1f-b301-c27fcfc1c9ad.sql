
INSERT INTO public.field_dictionary (field_key, label, section, data_type, is_calculated, is_repeatable)
VALUES
  ('property.tax.type', 'Type', 'property', 'dropdown', false, false),
  ('property.tax.authority', 'Authority', 'property', 'text', false, false),
  ('property.tax.tax_tracking', 'Tax Tracking', 'property', 'boolean', false, false),
  ('property.tax.last_verified', 'Last Verified', 'property', 'date', false, false),
  ('property.tax.tracking_status', 'Status', 'property', 'dropdown', false, false)
ON CONFLICT (field_key) DO NOTHING;
