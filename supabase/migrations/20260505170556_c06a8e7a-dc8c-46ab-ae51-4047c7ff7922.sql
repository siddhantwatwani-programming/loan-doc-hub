INSERT INTO public.field_dictionary (field_key, label, section, data_type, form_type, allowed_roles, read_only_roles)
VALUES
  ('ln_pn_prepaymePenaltYears', 'Prepayment Penalty Years', 'loan_terms', 'number', 'primary', ARRAY['admin','csr'], ARRAY[]::text[]),
  ('ln_pn_prepaymePenaltMonths', 'Prepayment Penalty Months', 'loan_terms', 'number', 'primary', ARRAY['admin','csr'], ARRAY[]::text[])
ON CONFLICT (field_key) DO NOTHING;