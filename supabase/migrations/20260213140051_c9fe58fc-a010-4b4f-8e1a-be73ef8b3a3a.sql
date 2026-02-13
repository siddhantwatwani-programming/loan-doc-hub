INSERT INTO public.field_dictionary (field_key, label, section, data_type, is_calculated, is_repeatable)
VALUES
  ('loan_terms.impounded_payments_enabled', 'Impounded Payments Enabled', 'loan_terms', 'boolean', false, false),
  ('broker.preferred.home', 'Preferred Home Phone', 'broker', 'boolean', false, false),
  ('broker.preferred.work', 'Preferred Work Phone', 'broker', 'boolean', false, false),
  ('broker.preferred.cell', 'Preferred Cell Phone', 'broker', 'boolean', false, false),
  ('broker.preferred.fax', 'Preferred Fax', 'broker', 'boolean', false, false)
ON CONFLICT (field_key) DO NOTHING;