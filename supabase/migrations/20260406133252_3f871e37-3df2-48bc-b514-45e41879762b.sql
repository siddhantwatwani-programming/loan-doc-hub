INSERT INTO field_dictionary (field_key, label, section, data_type, is_calculated, is_repeatable, form_type, description)
VALUES 
  ('ln_p_unpaidOther', 'Unpaid Other', 'loan_terms', 'currency', false, false, 'primary', 'Unpaid other charges balance'),
  ('ln_p_suspenseFunds', 'Suspense Funds', 'loan_terms', 'currency', false, false, 'primary', 'Suspense funds balance')
ON CONFLICT DO NOTHING;