INSERT INTO public.field_dictionary (field_key, label, section, data_type, is_repeatable, form_type)
VALUES
  ('insurance.annual_premium', 'Annual Premium', 'insurance', 'currency', true, 'insurance'),
  ('insurance.frequency', 'Frequency', 'insurance', 'dropdown', true, 'insurance')
ON CONFLICT DO NOTHING;