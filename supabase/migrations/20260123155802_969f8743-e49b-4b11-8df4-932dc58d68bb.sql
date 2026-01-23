-- Insert 29 new fields into field_dictionary under section 'other'
INSERT INTO public.field_dictionary (field_key, label, section, data_type, is_calculated, is_repeatable, allowed_roles, description)
VALUES
  -- Recording Information
  ('recording.requested_by', 'Recording Requested By', 'other', 'text', false, false, ARRAY['admin', 'csr']::text[], 'Party requesting recording'),
  ('recording.mail_to.name', 'Mail To Name', 'other', 'text', false, false, ARRAY['admin', 'csr']::text[], 'Name for mail return'),
  ('recording.mail_to.address', 'Mail To Address', 'other', 'text', false, false, ARRAY['admin', 'csr']::text[], 'Address for mail return'),
  ('recording.instrument_number', 'Instrument Number', 'other', 'text', false, false, ARRAY['admin', 'csr']::text[], 'Recording instrument number'),
  ('recording.state', 'Recording State', 'other', 'text', false, false, ARRAY['admin', 'csr']::text[], 'State where document is recorded'),
  
  -- Property
  ('property.apn', 'Assessor''s Parcel Number', 'other', 'text', false, false, ARRAY['admin', 'csr']::text[], 'Property APN'),
  
  -- Lender Details
  ('lender.current.name', 'Current Lender Name', 'other', 'text', false, false, ARRAY['admin', 'csr']::text[], 'Name of current lender/assignor'),
  ('lender.current.vesting', 'Current Lender Vesting', 'other', 'text', false, false, ARRAY['admin', 'csr']::text[], 'Vesting of current lender'),
  ('lender.new.name', 'New Lender Name', 'other', 'text', false, false, ARRAY['admin', 'csr']::text[], 'Name of new lender/assignee'),
  ('lender.new.vesting', 'New Lender Vesting', 'other', 'text', false, false, ARRAY['admin', 'csr']::text[], 'Vesting of new lender'),
  
  -- Borrower
  ('borrower.vesting', 'Borrower Vesting', 'other', 'text', false, false, ARRAY['admin', 'csr']::text[], 'Borrower vesting information'),
  
  -- Deed of Trust Reference
  ('deed_of_trust.instrument_number', 'DOT Instrument Number', 'other', 'text', false, false, ARRAY['admin', 'csr']::text[], 'Original deed of trust instrument number'),
  ('deed_of_trust.recording_date', 'DOT Recording Date', 'other', 'date', false, false, ARRAY['admin', 'csr']::text[], 'Original deed of trust recording date'),
  ('deed_of_trust.county', 'DOT Recording County', 'other', 'text', false, false, ARRAY['admin', 'csr']::text[], 'County where DOT was recorded'),
  ('deed_of_trust.state', 'DOT Recording State', 'other', 'text', false, false, ARRAY['admin', 'csr']::text[], 'State where DOT was recorded'),
  
  -- Assignment
  ('assignment.execution_date', 'Assignment Execution Date', 'other', 'date', false, false, ARRAY['admin', 'csr']::text[], 'Date assignment was executed'),
  
  -- Signatory
  ('signatory.name', 'Signatory Name', 'other', 'text', false, false, ARRAY['admin', 'csr']::text[], 'Name of authorized signatory'),
  ('signatory.title', 'Signatory Title', 'other', 'text', false, false, ARRAY['admin', 'csr']::text[], 'Title of signatory'),
  ('signatory.capacity', 'Signatory Capacity', 'other', 'text', false, false, ARRAY['admin', 'csr']::text[], 'Capacity in which signatory acts'),
  ('signatory.organization', 'Signatory Organization', 'other', 'text', false, false, ARRAY['admin', 'csr']::text[], 'Organization represented by signatory'),
  
  -- Notary
  ('notary.execution_date', 'Notary Execution Date', 'other', 'date', false, false, ARRAY['admin', 'csr']::text[], 'Date of notary acknowledgment'),
  ('notary.name', 'Notary Name', 'other', 'text', false, false, ARRAY['admin', 'csr']::text[], 'Name of notary public'),
  ('notary.seal', 'Notary Seal', 'other', 'text', false, false, ARRAY['admin', 'csr']::text[], 'Notary seal/stamp'),
  
  -- System Fields
  ('system.field_code_f0000', 'System Field F0000', 'other', 'text', false, false, ARRAY['admin', 'csr']::text[], 'System internal field'),
  ('system.field_code_f0001', 'System Field F0001', 'other', 'text', false, false, ARRAY['admin', 'csr']::text[], 'System internal field'),
  ('system.field_code_f0009', 'System Field F0009', 'other', 'text', false, false, ARRAY['admin', 'csr']::text[], 'System internal field'),
  ('system.field_code_f1428', 'System Field F1428', 'other', 'text', false, false, ARRAY['admin', 'csr']::text[], 'System internal field'),
  ('system.field_code_f1429', 'System Field F1429', 'other', 'text', false, false, ARRAY['admin', 'csr']::text[], 'System internal field'),
  
  -- Document Metadata
  ('document.page_number', 'Page Number', 'other', 'text', false, false, ARRAY['admin', 'csr']::text[], 'Document page number')
ON CONFLICT (field_key) DO NOTHING;

-- Create template record
INSERT INTO public.templates (name, state, product_type, version, is_active, description, file_path)
VALUES (
  'Blank - Assignment of Deed of Trust (100%)',
  'CA',
  'Conventional',
  1,
  true,
  'California Assignment of Deed of Trust for 100% interest transfer',
  'Blank_Assignment_of_Deed_of_Trust_100.docx'
);