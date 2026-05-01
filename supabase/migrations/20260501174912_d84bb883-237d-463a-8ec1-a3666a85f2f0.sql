INSERT INTO public.field_dictionary (field_key, label, section, data_type, form_type, is_calculated, is_repeatable)
VALUES
  ('of_re_interestRate.fixed', 'Interest Rate — Fixed', 'origination_fees', 'boolean', 'primary', false, false),
  ('of_re_interestRate.adjustable', 'Interest Rate — Adjustable', 'origination_fees', 'boolean', 'primary', false, false)
ON CONFLICT (field_key) DO NOTHING;