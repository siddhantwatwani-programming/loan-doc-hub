INSERT INTO public.field_dictionary (field_key, label, data_type, section, form_type, allowed_roles, read_only_roles, is_mandatory, is_repeatable, is_calculated)
VALUES
  ('of_re_proposedLoanTerm.months', 'Proposed Loan Term — Months', 'boolean', 'origination_fees', 'primary', ARRAY['admin','csr'], ARRAY[]::text[], false, false, false),
  ('of_re_proposedLoanTerm.years',  'Proposed Loan Term — Years',  'boolean', 'origination_fees', 'primary', ARRAY['admin','csr'], ARRAY[]::text[], false, false, false)
ON CONFLICT (field_key) DO NOTHING;