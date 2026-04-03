INSERT INTO public.field_dictionary (field_key, label, section, data_type, is_repeatable, form_type)
VALUES
  ('insurance.impounds_active', 'Impounds Active', 'insurance', 'boolean', true, 'insurance'),
  ('insurance.red_flag_trigger', 'Red Flag Trigger', 'insurance', 'dropdown', true, 'insurance'),
  ('insurance.attempt_agent', 'Attempt Agent', 'insurance', 'boolean', true, 'insurance'),
  ('insurance.attempt_borrower', 'Attempt Borrower', 'insurance', 'boolean', true, 'insurance'),
  ('insurance.lender_notified', 'Lender Notified', 'insurance', 'boolean', true, 'insurance'),
  ('insurance.lender_notified_date', 'Lender Notified Date', 'insurance', 'date', true, 'insurance')
ON CONFLICT DO NOTHING;