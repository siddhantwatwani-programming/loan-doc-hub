
-- Add field_dictionary entries for Lien fields (stored under 'property' section)
INSERT INTO public.field_dictionary (field_key, label, section, data_type, is_calculated, is_repeatable, description)
VALUES
  ('lien.property', 'Property', 'property', 'text', false, true, 'Lien associated property'),
  ('lien.priority', 'Priority', 'property', 'text', false, true, 'Lien priority'),
  ('lien.holder', 'Lien Holder', 'property', 'text', false, true, 'Lien holder name'),
  ('lien.account', 'Account', 'property', 'text', false, true, 'Lien account number'),
  ('lien.contact', 'Contact', 'property', 'text', false, true, 'Lien contact name'),
  ('lien.phone', 'Phone', 'property', 'phone', false, true, 'Lien contact phone'),
  ('lien.original_balance', 'Original Balance', 'property', 'currency', false, true, 'Lien original balance'),
  ('lien.current_balance', 'Current Balance', 'property', 'currency', false, true, 'Lien current balance'),
  ('lien.regular_payment', 'Regular Payment', 'property', 'currency', false, true, 'Lien regular payment amount'),
  ('lien.last_checked', 'Last Checked', 'property', 'date', false, true, 'Lien last checked date'),
  ('lien.note', 'Note', 'property', 'text', false, true, 'Lien notes')
ON CONFLICT (field_key) DO NOTHING;

-- Add field_dictionary entries for Insurance fields (stored under 'property' section)
INSERT INTO public.field_dictionary (field_key, label, section, data_type, is_calculated, is_repeatable, description)
VALUES
  ('insurance.property', 'Property', 'property', 'text', false, true, 'Insurance associated property'),
  ('insurance.description', 'Description', 'property', 'text', false, true, 'Insurance description'),
  ('insurance.insured_name', 'Insured Name', 'property', 'text', false, true, 'Name of insured party'),
  ('insurance.company_name', 'Company Name', 'property', 'text', false, true, 'Insurance company name'),
  ('insurance.policy_number', 'Policy Number', 'property', 'text', false, true, 'Insurance policy number'),
  ('insurance.expiration', 'Expiration', 'property', 'date', false, true, 'Insurance expiration date'),
  ('insurance.coverage', 'Coverage', 'property', 'currency', false, true, 'Insurance coverage amount'),
  ('insurance.active', 'Active', 'property', 'boolean', false, true, 'Insurance active status'),
  ('insurance.agent_name', 'Agent Name', 'property', 'text', false, true, 'Insurance agent name'),
  ('insurance.business_address', 'Business Address', 'property', 'text', false, true, 'Insurance agent business address'),
  ('insurance.phone_number', 'Phone Number', 'property', 'phone', false, true, 'Insurance agent phone'),
  ('insurance.fax_number', 'Fax Number', 'property', 'text', false, true, 'Insurance agent fax'),
  ('insurance.email', 'Email', 'property', 'text', false, true, 'Insurance agent email'),
  ('insurance.note', 'Note', 'property', 'text', false, true, 'Insurance notes')
ON CONFLICT (field_key) DO NOTHING;
