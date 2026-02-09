
-- Add field_dictionary entries for Loan Funding persistence
INSERT INTO public.field_dictionary (field_key, label, section, data_type, is_calculated, is_repeatable, description)
VALUES
  ('loan_terms.funding_records', 'Funding Records', 'loan_terms', 'text', false, false, 'JSON array of loan funding records'),
  ('loan_terms.funding_history', 'Funding History', 'loan_terms', 'text', false, false, 'JSON array of loan funding history')
ON CONFLICT (field_key) DO NOTHING;
