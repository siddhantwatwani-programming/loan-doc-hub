-- Add delivery preference fields for lender authorized party
INSERT INTO public.field_dictionary (field_key, label, section, data_type, is_repeatable, is_calculated)
VALUES
  ('lender.authorized_party.delivery.email', 'Delivery Email', 'lender', 'boolean', false, false),
  ('lender.authorized_party.delivery.mail', 'Delivery Mail', 'lender', 'boolean', false, false),
  ('lender.authorized_party.delivery.sms', 'Delivery SMS', 'lender', 'boolean', false, false)
ON CONFLICT (field_key) DO NOTHING;