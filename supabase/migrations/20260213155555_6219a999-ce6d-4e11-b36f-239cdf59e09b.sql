
-- Add new Co-Borrower field dictionary entries for the updated form layout
INSERT INTO public.field_dictionary (field_key, label, section, data_type, is_calculated, is_repeatable)
VALUES
  ('coborrower.borrower_id', 'Borrower ID', 'co_borrower', 'text', false, false),
  ('coborrower.borrower_type', 'Borrower Type', 'co_borrower', 'dropdown', false, false),
  ('coborrower.capacity', 'Capacity', 'co_borrower', 'text', false, false),
  ('coborrower.credit_score', 'Credit Score', 'co_borrower', 'text', false, false),
  ('coborrower.primary_address.street', 'Primary Address Street', 'co_borrower', 'text', false, false),
  ('coborrower.primary_address.city', 'Primary Address City', 'co_borrower', 'text', false, false),
  ('coborrower.primary_address.state', 'Primary Address State', 'co_borrower', 'text', false, false),
  ('coborrower.primary_address.zip', 'Primary Address ZIP', 'co_borrower', 'text', false, false),
  ('coborrower.mailing_same_as_primary', 'Same as Primary', 'co_borrower', 'boolean', false, false),
  ('coborrower.mailing_address.street', 'Mailing Address Street', 'co_borrower', 'text', false, false),
  ('coborrower.mailing_address.city', 'Mailing Address City', 'co_borrower', 'text', false, false),
  ('coborrower.mailing_address.state', 'Mailing Address State', 'co_borrower', 'text', false, false),
  ('coborrower.mailing_address.zip', 'Mailing Address ZIP', 'co_borrower', 'text', false, false),
  ('coborrower.phone.home2', 'Home Phone 2', 'co_borrower', 'phone', false, false),
  ('coborrower.preferred.home', 'Preferred Home', 'co_borrower', 'boolean', false, false),
  ('coborrower.preferred.home2', 'Preferred Home 2', 'co_borrower', 'boolean', false, false),
  ('coborrower.preferred.work', 'Preferred Work', 'co_borrower', 'boolean', false, false),
  ('coborrower.preferred.cell', 'Preferred Cell', 'co_borrower', 'boolean', false, false),
  ('coborrower.preferred.fax', 'Preferred Fax', 'co_borrower', 'boolean', false, false),
  ('coborrower.vesting', 'Vesting', 'co_borrower', 'text', false, false),
  ('coborrower.ford', 'FORD', 'co_borrower', 'text', false, false),
  ('coborrower.tax_id_type', 'Tax ID Type', 'co_borrower', 'dropdown', false, false),
  ('coborrower.issue_1098', 'Issue 1098', 'co_borrower', 'boolean', false, false),
  ('coborrower.alternate_reporting', 'Alternate Reporting', 'co_borrower', 'boolean', false, false),
  ('coborrower.delivery_online', 'Delivery Online', 'co_borrower', 'boolean', false, false),
  ('coborrower.delivery_mail', 'Delivery Mail', 'co_borrower', 'boolean', false, false)
ON CONFLICT (field_key) DO NOTHING;
