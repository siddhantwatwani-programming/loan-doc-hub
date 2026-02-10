
-- Add missing lender field_dictionary entries for Tax Info, Care Of, FORD, Loan ID/Type, Lender ID, and Authorized Party fields

-- Tax Info fields (lender.tax_payer.*)
INSERT INTO field_dictionary (field_key, label, section, data_type, is_calculated, is_repeatable)
VALUES
  ('lender.tax_payer.ssn', 'Tax Payer SSN', 'lender', 'text', false, false),
  ('lender.tax_payer.name', 'Tax Payer Name', 'lender', 'text', false, false),
  ('lender.tax_payer.street_address', 'Tax Payer Street Address', 'lender', 'text', false, false),
  ('lender.tax_payer.city', 'Tax Payer City', 'lender', 'text', false, false),
  ('lender.tax_payer.state', 'Tax Payer State', 'lender', 'text', false, false),
  ('lender.tax_payer.zip_code', 'Tax Payer Zip Code', 'lender', 'text', false, false),
  ('lender.tax_payer.account_number', 'Tax Payer Account Number', 'lender', 'text', false, false),
  ('lender.tax_payer.recipient_type', 'Tax Payer Recipient Type', 'lender', 'text', false, false),
  ('lender.tax_payer.auto_synchronize', 'Tax Payer Auto-Synchronize', 'lender', 'boolean', false, false),
  ('lender.tax_payer.notes', 'Tax Payer Notes', 'lender', 'text', false, false),

  -- Care Of / Attorney Address fields
  ('lender.care_of.street', 'Care Of Street', 'lender', 'text', false, false),
  ('lender.care_of.city', 'Care Of City', 'lender', 'text', false, false),
  ('lender.care_of.state', 'Care Of State', 'lender', 'text', false, false),
  ('lender.care_of.zip', 'Care Of ZIP', 'lender', 'text', false, false),

  -- Individual FORD fields (lender.ford.1 through lender.ford.8)
  ('lender.ford.1', 'FORD 1', 'lender', 'text', false, false),
  ('lender.ford.2', 'FORD 2', 'lender', 'text', false, false),
  ('lender.ford.3', 'FORD 3', 'lender', 'text', false, false),
  ('lender.ford.4', 'FORD 4', 'lender', 'text', false, false),
  ('lender.ford.5', 'FORD 5', 'lender', 'text', false, false),
  ('lender.ford.6', 'FORD 6', 'lender', 'text', false, false),
  ('lender.ford.7', 'FORD 7', 'lender', 'text', false, false),
  ('lender.ford.8', 'FORD 8', 'lender', 'text', false, false),

  -- Loan ID and Loan Type
  ('lender.loan_id', 'Loan ID', 'lender', 'text', false, false),
  ('lender.loan_type', 'Loan Type', 'lender', 'text', false, false),

  -- Lender ID
  ('lender.lender_id', 'Lender ID', 'lender', 'text', false, false),

  -- Authorized Party - Capacity and Details
  ('lender.authorized_party.capacity', 'Authorized Party Capacity', 'lender', 'text', false, false),
  ('lender.authorized_party.address.details', 'Authorized Party Address Details', 'lender', 'text', false, false),

  -- Authorized Party individual FORD fields
  ('lender.authorized_party.ford.1', 'Auth Party FORD 1', 'lender', 'text', false, false),
  ('lender.authorized_party.ford.2', 'Auth Party FORD 2', 'lender', 'text', false, false),
  ('lender.authorized_party.ford.3', 'Auth Party FORD 3', 'lender', 'text', false, false),
  ('lender.authorized_party.ford.4', 'Auth Party FORD 4', 'lender', 'text', false, false),
  ('lender.authorized_party.ford.5', 'Auth Party FORD 5', 'lender', 'text', false, false),
  ('lender.authorized_party.ford.6', 'Auth Party FORD 6', 'lender', 'text', false, false),
  ('lender.authorized_party.ford.7', 'Auth Party FORD 7', 'lender', 'text', false, false),
  ('lender.authorized_party.ford.8', 'Auth Party FORD 8', 'lender', 'text', false, false)
ON CONFLICT (field_key) DO NOTHING;
