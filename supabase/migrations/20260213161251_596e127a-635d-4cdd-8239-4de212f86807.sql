INSERT INTO public.field_dictionary (field_key, label, section, data_type, is_calculated, is_repeatable)
VALUES
  ('lender.banking.ach_email_2', 'ACH Email 2', 'lender', 'text', false, false),
  ('lender.tax_payer.recipient_name', 'Recipient Name', 'lender', 'text', false, false),
  ('lender.tax_payer.ein', 'EIN', 'lender', 'text', false, false),
  ('lender.tax_payer.address_2', 'Address 2', 'lender', 'text', false, false),
  ('lender.tax_payer.phone', 'Phone', 'lender', 'text', false, false),
  ('lender.tax_payer.fax', 'Fax', 'lender', 'text', false, false),
  ('lender.tax_payer.email', 'Email', 'lender', 'text', false, false),
  ('lender.tax_payer.contact_name', 'Contact Name', 'lender', 'text', false, false)
ON CONFLICT (field_key) DO NOTHING;