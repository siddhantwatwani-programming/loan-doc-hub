
-- Add field_dictionary entries for Borrower → 1098 section fields
INSERT INTO public.field_dictionary (field_key, label, section, data_type, is_calculated, is_repeatable)
VALUES
  ('borrower.1098.designated_recipient', 'Designated Recipient', 'borrower', 'dropdown', false, true),
  ('borrower.1098.name', 'Name', 'borrower', 'text', false, true),
  ('borrower.1098.address', 'Address', 'borrower', 'text', false, true),
  ('borrower.1098.account_number', 'Account Number', 'borrower', 'text', false, true),
  ('borrower.1098.city', 'City', 'borrower', 'text', false, true),
  ('borrower.1098.tin_type', 'TIN Type', 'borrower', 'dropdown', false, true),
  ('borrower.1098.tin', 'TIN', 'borrower', 'text', false, true),
  ('borrower.1098.state', 'State', 'borrower', 'text', false, true),
  ('borrower.1098.zip', 'ZIP', 'borrower', 'text', false, true),
  ('borrower.1098.send_1098', 'Send 1098', 'borrower', 'boolean', false, true);
