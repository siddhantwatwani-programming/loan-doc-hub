-- Add missing Additional Guarantor fields to match Borrower section
INSERT INTO public.field_dictionary (field_key, label, section, data_type, is_calculated, is_repeatable)
VALUES
  ('borrower.guarantor.alternate_reporting', 'Guarantor Alternate Reporting', 'borrower', 'boolean', false, true),
  ('borrower.guarantor.mailing_same_as_primary', 'Guarantor Mailing Same as Primary', 'borrower', 'boolean', false, true),
  ('borrower.guarantor.delivery_online', 'Guarantor Delivery Online', 'borrower', 'boolean', false, true),
  ('borrower.guarantor.delivery_mail', 'Guarantor Delivery Mail', 'borrower', 'boolean', false, true),
  ('borrower.guarantor.preferred.home', 'Guarantor Preferred Home', 'borrower', 'boolean', false, true),
  ('borrower.guarantor.preferred.work', 'Guarantor Preferred Work', 'borrower', 'boolean', false, true),
  ('borrower.guarantor.preferred.cell', 'Guarantor Preferred Cell', 'borrower', 'boolean', false, true),
  ('borrower.guarantor.preferred.fax', 'Guarantor Preferred Fax', 'borrower', 'boolean', false, true),
  ('borrower.guarantor.ford.1', 'Guarantor FORD 1', 'borrower', 'text', false, true),
  ('borrower.guarantor.ford.2', 'Guarantor FORD 2', 'borrower', 'text', false, true),
  ('borrower.guarantor.ford.3', 'Guarantor FORD 3', 'borrower', 'text', false, true),
  ('borrower.guarantor.ford.4', 'Guarantor FORD 4', 'borrower', 'text', false, true),
  ('borrower.guarantor.ford.5', 'Guarantor FORD 5', 'borrower', 'text', false, true),
  ('borrower.guarantor.ford.6', 'Guarantor FORD 6', 'borrower', 'text', false, true),
  ('borrower.guarantor.ford.7', 'Guarantor FORD 7', 'borrower', 'text', false, true),
  ('borrower.guarantor.ford.8', 'Guarantor FORD 8', 'borrower', 'text', false, true),
  ('borrower.guarantor.mailing.street', 'Guarantor Mailing Street', 'borrower', 'text', false, true),
  ('borrower.guarantor.mailing.city', 'Guarantor Mailing City', 'borrower', 'text', false, true),
  ('borrower.guarantor.mailing.state', 'Guarantor Mailing State', 'borrower', 'text', false, true),
  ('borrower.guarantor.mailing.zip', 'Guarantor Mailing ZIP', 'borrower', 'text', false, true)
ON CONFLICT (field_key) DO NOTHING;