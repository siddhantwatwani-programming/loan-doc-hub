
INSERT INTO public.field_dictionary (field_key, label, section, data_type, form_type) VALUES
  ('li_lt_anticipated', 'Anticipated', 'liens', 'boolean', 'loan_type'),
  ('li_lt_existingRemain', 'Existing - Remain', 'liens', 'boolean', 'loan_type'),
  ('li_lt_existingPaydown', 'Existing - Paydown', 'liens', 'boolean', 'loan_type'),
  ('li_lt_existingPayoff', 'Existing - Payoff', 'liens', 'boolean', 'loan_type'),
  ('li_lt_existingPaydownAmount', 'Paydown Amount', 'liens', 'currency', 'loan_type'),
  ('li_lt_existingPayoffAmount', 'Payoff Amount', 'liens', 'currency', 'loan_type'),
  ('li_rt_recordingNumberFlag', 'Recording Number Flag', 'liens', 'boolean', 'recording_tracking'),
  ('li_gd_estimate', 'Estimate', 'liens', 'boolean', 'general_details')
ON CONFLICT DO NOTHING;
