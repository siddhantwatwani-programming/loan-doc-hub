-- Add designated_recipient field for lender 1099 form
INSERT INTO public.field_dictionary (field_key, label, section, data_type, is_repeatable, is_calculated)
VALUES
  ('lender.tax_payer.designated_recipient', 'Designated Recipient', 'lender', 'dropdown', false, false)
ON CONFLICT (field_key) DO NOTHING;