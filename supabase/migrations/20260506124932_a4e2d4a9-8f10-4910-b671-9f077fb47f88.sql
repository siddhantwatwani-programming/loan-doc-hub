INSERT INTO public.field_dictionary (field_key, label, section, data_type)
VALUES
  ('li_slt_borrowerNotified', 'Borrower Notified', 'liens', 'boolean'),
  ('li_slt_borrowerNotifiedDate', 'Borrower Notified Date', 'liens', 'date')
ON CONFLICT (field_key) DO NOTHING;