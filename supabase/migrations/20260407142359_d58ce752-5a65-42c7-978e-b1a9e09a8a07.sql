INSERT INTO public.field_dictionary (field_key, label, section, data_type, is_repeatable)
VALUES
  ('loan_terms.servicing.per_month', 'Per Month', 'loan_terms', 'boolean', false),
  ('loan_terms.servicing.per_year', 'Per Year', 'loan_terms', 'boolean', false),
  ('loan_terms.servicing.payable_monthly', 'Payable Monthly', 'loan_terms', 'boolean', false),
  ('loan_terms.servicing.payable_annually', 'Payable Annually', 'loan_terms', 'boolean', false),
  ('loan_terms.servicing.payable_quarterly', 'Payable Quarterly', 'loan_terms', 'boolean', false)
ON CONFLICT DO NOTHING;