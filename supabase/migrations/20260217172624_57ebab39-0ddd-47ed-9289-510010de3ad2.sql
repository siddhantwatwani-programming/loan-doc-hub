
-- Add field_dictionary entries for property 1099 form fields
INSERT INTO public.field_dictionary (field_key, label, section, data_type, is_repeatable, is_calculated)
VALUES
  ('property.1099.designated_recipient', 'Designated Recipient', 'property', 'dropdown', false, false),
  ('property.1099.name', '1099 Name', 'property', 'text', false, false),
  ('property.1099.address', '1099 Address', 'property', 'text', false, false),
  ('property.1099.account_number', '1099 Account Number', 'property', 'text', false, false),
  ('property.1099.city', '1099 City', 'property', 'text', false, false),
  ('property.1099.tin_type', 'TIN Type', 'property', 'dropdown', false, false),
  ('property.1099.tin', 'TIN', 'property', 'text', false, false),
  ('property.1099.state', '1099 State', 'property', 'text', false, false),
  ('property.1099.zip', '1099 ZIP', 'property', 'text', false, false),
  ('property.1099.send_1099', 'Send 1099', 'property', 'boolean', false, false)
ON CONFLICT (field_key) DO NOTHING;
