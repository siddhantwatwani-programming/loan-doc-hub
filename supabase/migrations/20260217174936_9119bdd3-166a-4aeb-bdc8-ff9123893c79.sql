-- Add delivery and preferred phone fields for lender info
INSERT INTO public.field_dictionary (field_key, label, section, data_type, is_repeatable, is_calculated)
VALUES
  ('lender.delivery.print', 'Delivery Print', 'lender', 'boolean', false, false),
  ('lender.delivery.email', 'Delivery Email (Lender)', 'lender', 'boolean', false, false),
  ('lender.delivery.sms', 'Delivery SMS (Lender)', 'lender', 'boolean', false, false),
  ('lender.preferred.home', 'Preferred Home', 'lender', 'boolean', false, false),
  ('lender.preferred.work', 'Preferred Work', 'lender', 'boolean', false, false),
  ('lender.preferred.cell', 'Preferred Cell', 'lender', 'boolean', false, false),
  ('lender.preferred.fax', 'Preferred Fax', 'lender', 'boolean', false, false)
ON CONFLICT (field_key) DO NOTHING;