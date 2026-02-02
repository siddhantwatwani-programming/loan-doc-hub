
-- First, add missing field dictionary entries for the fragmented tags
INSERT INTO field_dictionary (field_key, label, section, data_type, description)
VALUES
  ('other.old_beneficiary_address', 'Old Beneficiary Address', 'other', 'text', 'Address of previous beneficiary'),
  ('other.new_beneficiary_address', 'New Beneficiary Address', 'other', 'text', 'Address of new beneficiary'),
  ('other.old_beneficiary_phone', 'Old Beneficiary Phone', 'other', 'phone', 'Phone number of previous beneficiary'),
  ('other.new_beneficiary_phone', 'New Beneficiary Phone', 'other', 'phone', 'Phone number of new beneficiary'),
  ('other.old_beneficiary_email', 'Old Beneficiary Email', 'other', 'text', 'Email of previous beneficiary'),
  ('other.new_beneficiary_email', 'New Beneficiary Email', 'other', 'text', 'Email of new beneficiary'),
  ('other.old_beneficiary_email_dtls_acct', 'Old Beneficiary Email Details Account', 'other', 'text', 'Account details for previous beneficiary email'),
  ('other.new_beneficiary_email_dtls_acct', 'New Beneficiary Email Details Account', 'other', 'text', 'Account details for new beneficiary email'),
  ('other.esignature', 'E-Signature', 'other', 'text', 'Electronic signature field')
ON CONFLICT (field_key) DO NOTHING;

-- Insert template_field_maps for Assignment of Beneficiary template (ec2aa016-4b60-4172-847d-1109b95bbf8d)
-- Using the already-mapped fields from validation
INSERT INTO template_field_maps (template_id, field_dictionary_id, transform_rule, required_flag, display_order)
SELECT 'ec2aa016-4b60-4172-847d-1109b95bbf8d', id, 
  CASE 
    WHEN data_type = 'date' THEN 'date_long'
    WHEN data_type = 'phone' THEN 'phone'
    ELSE NULL 
  END,
  CASE
    WHEN field_key IN ('Terms.LoanNumber', 'borrower.full_name', 'other.date', 'other.old_beneficiary', 'other.new_beneficiary') THEN true
    ELSE false
  END,
  row_number
FROM (
  SELECT id, field_key, data_type, ROW_NUMBER() OVER (ORDER BY section, label) as row_number
  FROM field_dictionary
  WHERE field_key IN (
    'other.date',
    'Terms.LoanNumber',
    'borrower.full_name',
    'property1.address',
    'other.old_beneficiary',
    'other.new_beneficiary',
    'other.date_of_transfer_to_new_beneficiary',
    'other.interest_is_assigned_as_of',
    'other.comments',
    'other.submitted_by',
    'name',
    'Property1.Address',
    'recording.mail_to.address',
    'notary.date',
    'other.old_beneficiary_address',
    'other.new_beneficiary_address',
    'other.old_beneficiary_phone',
    'other.new_beneficiary_phone',
    'other.old_beneficiary_email',
    'other.new_beneficiary_email',
    'other.old_beneficiary_email_dtls_acct',
    'other.new_beneficiary_email_dtls_acct',
    'other.esignature'
  )
) sub
ON CONFLICT DO NOTHING;
