
-- Add missing delivery fields for Borrower Authorized Party
INSERT INTO public.field_dictionary (field_key, label, section, data_type, is_calculated, is_repeatable)
VALUES 
  ('borrower.authorized_party.delivery.email', 'Auth Party Delivery Email', 'borrower', 'boolean', false, true),
  ('borrower.authorized_party.delivery.sms', 'Auth Party Delivery SMS', 'borrower', 'boolean', false, true);
