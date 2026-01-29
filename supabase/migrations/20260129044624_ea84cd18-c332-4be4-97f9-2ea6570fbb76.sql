-- Phase 1: Create merge_tag_aliases table for externalized merge tag mappings
-- This replaces hard-coded MERGE_TAG_TO_FIELD_MAP and LABEL_TO_FIELD_MAP in generate-document

-- Create enum for tag types
CREATE TYPE public.merge_tag_type AS ENUM ('merge_tag', 'label', 'f_code');

-- Create the merge_tag_aliases table
CREATE TABLE public.merge_tag_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_name TEXT NOT NULL,
  field_key TEXT NOT NULL,
  tag_type public.merge_tag_type NOT NULL DEFAULT 'merge_tag',
  replace_next TEXT,  -- For label-based replacement (text that follows the label to replace)
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint on tag_name and tag_type combination
ALTER TABLE public.merge_tag_aliases 
  ADD CONSTRAINT merge_tag_aliases_tag_name_type_unique UNIQUE (tag_name, tag_type);

-- Create index for faster lookups
CREATE INDEX idx_merge_tag_aliases_tag_name ON public.merge_tag_aliases(tag_name);
CREATE INDEX idx_merge_tag_aliases_field_key ON public.merge_tag_aliases(field_key);
CREATE INDEX idx_merge_tag_aliases_is_active ON public.merge_tag_aliases(is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE public.merge_tag_aliases ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin-only write, authenticated read
CREATE POLICY "Anyone authenticated can view merge tag aliases"
  ON public.merge_tag_aliases
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert merge tag aliases"
  ON public.merge_tag_aliases
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update merge tag aliases"
  ON public.merge_tag_aliases
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete merge tag aliases"
  ON public.merge_tag_aliases
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_merge_tag_aliases_updated_at
  BEFORE UPDATE ON public.merge_tag_aliases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed data: Merge Tag mappings (from MERGE_TAG_TO_FIELD_MAP)
INSERT INTO public.merge_tag_aliases (tag_name, field_key, tag_type, description) VALUES
-- Borrower mappings
('Borrower_Name', 'Borrower.Name', 'merge_tag', 'Borrower name'),
('Borrower_Address', 'Borrower.Address', 'merge_tag', 'Borrower address'),
('Borrower_address', 'Borrower.Address', 'merge_tag', 'Borrower address (lowercase)'),
('Borrower_City', 'Borrower.City', 'merge_tag', 'Borrower city'),
('Borrower_State', 'Borrower.State', 'merge_tag', 'Borrower state'),
('Borrower_Zip', 'Borrower.Zip', 'merge_tag', 'Borrower ZIP code'),

-- Broker mappings
('Broker_Name', 'Broker.Name', 'merge_tag', 'Broker name'),
('Broker_address', 'Broker.Address', 'merge_tag', 'Broker address (lowercase)'),
('Broker_Address', 'Broker.Address', 'merge_tag', 'Broker address'),
('Broker_License_', 'Broker.License', 'merge_tag', 'Broker license'),
('Broker_License', 'Broker.License', 'merge_tag', 'Broker license'),
('Broker_Rep', 'Broker.Representative', 'merge_tag', 'Broker representative'),
('Broker_License_1', 'Broker.License', 'merge_tag', 'Broker license variant'),

-- Loan terms mappings
('Loan_Number', 'Terms.LoanNumber', 'merge_tag', 'Loan number'),
('Loan_Amount', 'Terms.LoanAmount', 'merge_tag', 'Loan amount'),
('Amount_Funded', 'Terms.LoanAmount', 'merge_tag', 'Amount funded'),
('Interest_Rate', 'Terms.InterestRate', 'merge_tag', 'Interest rate'),
('Term_Months', 'Terms.TermMonths', 'merge_tag', 'Term in months'),
('First_Payment_Date', 'Terms.FirstPaymentDate', 'merge_tag', 'First payment date'),
('Maturity_Date', 'Terms.MaturityDate', 'merge_tag', 'Maturity date'),
('Payment_Amount', 'Terms.PaymentAmount', 'merge_tag', 'Payment amount'),

-- Property mappings
('Property_Address', 'Property1.Address', 'merge_tag', 'Property address'),
('Property_address', 'Property1.Address', 'merge_tag', 'Property address (lowercase)'),
('Property_City', 'Property1.City', 'merge_tag', 'Property city'),
('Property_State', 'Property1.State', 'merge_tag', 'Property state'),
('Property_Zip', 'Property1.Zip', 'merge_tag', 'Property ZIP code'),
('Market_Value', 'Property1.MarketValue', 'merge_tag', 'Property market value'),

-- System mappings
('Document_Date', 'System.DocumentDate', 'merge_tag', 'Document date'),

-- F-code mappings (Assignment of Deed of Trust)
('F0000', 'Terms.LoanNumber', 'f_code', 'Loan Number field code'),
('F0001', 'lender.current.name', 'f_code', 'Current Lender Name field code'),
('F0009', 'deed_of_trust.county', 'f_code', 'DOT County field code'),
('F1428', 'deed_of_trust.instrument_number', 'f_code', 'DOT Instrument Number field code'),
('F1429', 'deed_of_trust.recording_date', 'f_code', 'DOT Recording Date field code'),

-- Assignment of Deed of Trust document field mappings
('Loan_Loan_Number', 'Terms.LoanNumber', 'merge_tag', 'Deal loan number'),
('Deal_Loan_Number', 'Terms.LoanNumber', 'merge_tag', 'Deal loan number variant'),
('Property_Legal_Description', 'property.legalDescription', 'merge_tag', 'Property legal description'),
('Legal_Description', 'property.legalDescription', 'merge_tag', 'Legal description'),
('Property_APN', 'property.apn', 'merge_tag', 'Property APN'),
('Assessors_Parcel_Number', 'property.apn', 'merge_tag', 'Assessors parcel number'),

-- Borrower fields
('Deal_Borrower_Name', 'borrower.name', 'merge_tag', 'Deal borrower name'),
('Borrower_Full_Name', 'borrower.name', 'merge_tag', 'Borrower full name'),
('Borrower_Vesting', 'borrower.vesting', 'merge_tag', 'Borrower vesting'),

-- Recording fields
('Recording_County', 'recording.county', 'merge_tag', 'Recording county'),
('Recording_Date', 'recording.recording_date', 'merge_tag', 'Recording date'),
('Recording_Requested_By', 'recording.requested_by', 'merge_tag', 'Recording requested by'),
('Mail_To_Name', 'recording.mail_to.name', 'merge_tag', 'Mail to name'),
('Mail_To_Address', 'recording.mail_to.address', 'merge_tag', 'Mail to address'),
('Recording_Instrument_Number', 'recording.instrument_number', 'merge_tag', 'Recording instrument number'),
('Recording_State', 'recording.state', 'merge_tag', 'Recording state'),

-- Lender fields
('Current_Lender_Name', 'lender.current.name', 'merge_tag', 'Current lender name'),
('Current_Lender_Vesting', 'lender.current.vesting', 'merge_tag', 'Current lender vesting'),
('New_Lender_Name', 'lender.new.name', 'merge_tag', 'New lender name'),
('New_Lender_Vesting', 'lender.new.vesting', 'merge_tag', 'New lender vesting'),

-- Deed of Trust fields
('DOT_Instrument_Number', 'deed_of_trust.instrument_number', 'merge_tag', 'DOT instrument number'),
('DOT_Recording_Date', 'deed_of_trust.recording_date', 'merge_tag', 'DOT recording date'),
('DOT_County', 'deed_of_trust.county', 'merge_tag', 'DOT county'),
('DOT_Recording_County', 'deed_of_trust.county', 'merge_tag', 'DOT recording county'),
('DOT_State', 'deed_of_trust.state', 'merge_tag', 'DOT state'),
('DOT_Recording_State', 'deed_of_trust.state', 'merge_tag', 'DOT recording state'),

-- Assignment fields
('Assignment_Execution_Date', 'assignment.execution_date', 'merge_tag', 'Assignment execution date'),

-- Signatory fields
('Signatory_Name', 'signatory.name', 'merge_tag', 'Signatory name'),
('Signatory_Title', 'signatory.title', 'merge_tag', 'Signatory title'),
('Signatory_Capacity', 'signatory.capacity', 'merge_tag', 'Signatory capacity'),
('Signatory_Organization', 'signatory.organization', 'merge_tag', 'Signatory organization'),

-- Notary fields
('Notary_Execution_Date', 'notary.execution_date', 'merge_tag', 'Notary execution date'),
('Notary_Name', 'notary.name', 'merge_tag', 'Notary name'),
('Notary_Seal', 'notary.seal', 'merge_tag', 'Notary seal'),
('Notary_Date', 'notary.date', 'merge_tag', 'Notary date'),
('Notary_Commission_Expiry', 'notary.commission_expiry', 'merge_tag', 'Notary commission expiry'),
('Notary_County', 'notary.county', 'merge_tag', 'Notary county'),
('Notary_State', 'notary.state', 'merge_tag', 'Notary state'),
('Notary_Appearing_Party_Names', 'notary.appearing_party_names', 'merge_tag', 'Notary appearing party names'),
('Notary1_State', 'notary.state', 'merge_tag', 'Notary1 state'),
('Notary1_County', 'notary.county', 'merge_tag', 'Notary1 county'),
('Notary1_Appearing_Party', 'notary.appearing_party_names', 'merge_tag', 'Notary1 appearing party'),
('Notary1_Appearing_Party_Names', 'notary.appearing_party_names', 'merge_tag', 'Notary1 appearing party names'),
('Notary1_Signature', 'notary.signature', 'merge_tag', 'Notary1 signature'),

-- Document fields
('Document_Page_Number', 'document.page_number', 'merge_tag', 'Document page number'),

-- Lender mappings
('Lender_Name', 'Lender.Name', 'merge_tag', 'Lender name'),
('Lender_Vesting', 'Lender.Vesting', 'merge_tag', 'Lender vesting'),
('Lender_address', 'Lender.Address', 'merge_tag', 'Lender address (lowercase)'),
('Lender_Address', 'Lender.Address', 'merge_tag', 'Lender address'),
('Beneficial_interest_', 'Lender.BeneficialInterest', 'merge_tag', 'Beneficial interest'),

-- Allonge to Note specific mappings
('Note_Date', 'Terms.NoteDate', 'merge_tag', 'Note date'),
('Date_of_Note', 'Terms.NoteDate', 'merge_tag', 'Date of note'),
('Mortgagor', 'Borrower.Name', 'merge_tag', 'Mortgagor'),
('Mortgagors', 'Borrower.Name', 'merge_tag', 'Mortgagors'),
('Pay_To_Order_Of', 'Allonge.PayToOrderOf', 'merge_tag', 'Pay to order of'),
('Pay_To_The_Order_Of', 'Allonge.PayToOrderOf', 'merge_tag', 'Pay to the order of'),
('Execution_Date', 'Allonge.ExecutionDate', 'merge_tag', 'Execution date'),
('Allonge_Execution_Date', 'Allonge.ExecutionDate', 'merge_tag', 'Allonge execution date'),
('Authorized_Signature', 'Allonge.AuthorizedSignature', 'merge_tag', 'Authorized signature'),
('Print_Name', 'Allonge.PrintName', 'merge_tag', 'Print name'),
('Title', 'Allonge.Title', 'merge_tag', 'Title'),
('Signer_Title', 'Allonge.Title', 'merge_tag', 'Signer title');

-- Seed data: Label mappings (from LABEL_TO_FIELD_MAP)
INSERT INTO public.merge_tag_aliases (tag_name, field_key, tag_type, replace_next, description) VALUES
-- Allonge to Note specific labels
('DATE OF NOTE:', 'other.date_of_note', 'label', NULL, 'Date of note label'),
('MORTGAGOR (S):', 'other.mortgagor_s', 'label', NULL, 'Mortgagor(s) label'),
('MORTGAGOR(S):', 'other.mortgagor_s', 'label', NULL, 'Mortgagor(s) label variant'),
('PROPERTY ADDRESS:', 'Property1.Address', 'label', NULL, 'Property address label'),
('LOAN AMOUNT:', 'Terms.LoanAmount', 'label', NULL, 'Loan amount label'),
('LOAN NO.:', 'Terms.LoanNumber', 'label', NULL, 'Loan number label'),
('LOAN NO:', 'Terms.LoanNumber', 'label', NULL, 'Loan number label variant'),
('Lender Name:', 'lender.nameAddress', 'label', NULL, 'Lender name label'),
('Print Name:', 'Allonge.PrintName', 'label', NULL, 'Print name label'),
('Title:', 'Allonge.Title', 'label', NULL, 'Title label'),
('as of _', 'Allonge.ExecutionDate', 'label', NULL, 'Execution date with underscores'),
('PAY TO THE ORDER OF', 'Allonge.PayToOrderOf', 'label', 'CALIFORNIA HOUSING FINANCE AGENCY', 'Pay to order label with replacement'),

-- Assignment of Deed of Trust labels
('Current Lender', 'lender.current.name', 'label', 'Current Lender', 'Current lender label'),
('New Lender Vesting', 'lender.new.vesting', 'label', 'New Lender Vesting', 'New lender vesting label'),
('New Lender', 'lender.new.name', 'label', 'New Lender', 'New lender label'),
('borrower vesting', 'borrower.vesting', 'label', 'borrower vesting', 'Borrower vesting label'),
('instrument number', 'deed_of_trust.instrument_number', 'label', 'instrument number', 'Instrument number label'),
('recording date', 'deed_of_trust.recording_date', 'label', 'recording date', 'Recording date label'),
('County, State', 'deed_of_trust.county', 'label', 'County, State', 'County state label'),
('Property Address', 'Property1.Address', 'label', 'Property Address', 'Property address label'),
('Legal Description', 'property.legalDescription', 'label', 'Legal Description', 'Legal description label'),
('APN:', 'property.apn', 'label', NULL, 'APN label'),
('APN#', 'property.apn', 'label', NULL, 'APN# label'),
('Authorized Signor Name', 'signatory.name', 'label', 'Authorized Signor Name', 'Authorized signor name label'),
('Authorized Signer Name', 'signatory.name', 'label', 'Authorized Signer Name', 'Authorized signer name label'),
('Title / Capacity', 'signatory.title', 'label', 'Title / Capacity', 'Title/capacity label'),
('Current Lender Vesting (or Successor if applicable),', 'lender.current.vesting', 'label', 'Current Lender Vesting (or Successor if applicable),', 'Current lender vesting label variant 1'),
('Current Lender Vesting (or Successor, if applicable)', 'lender.current.vesting', 'label', 'Current Lender Vesting (or Successor, if applicable)', 'Current lender vesting label variant 2'),
('Current Lender Vesting (or Successor, if applicable),', 'lender.current.vesting', 'label', 'Current Lender Vesting (or Successor, if applicable),', 'Current lender vesting label variant 3'),
('Current Lender Vesting (or Successor, if applicable).', 'lender.current.vesting', 'label', 'Current Lender Vesting (or Successor, if applicable).', 'Current lender vesting label variant 4'),

-- Address and mail to labels
('Address', 'recording.mail_to.address', 'label', 'Address', 'Mail to address label'),
('Loan No.', 'Terms.LoanNumber', 'label', 'Loan No.', 'Loan no. label'),
('Loan No', 'Terms.LoanNumber', 'label', 'Loan No', 'Loan no label'),
('Loan Number', 'Terms.LoanNumber', 'label', 'Loan Number', 'Loan number label'),

-- Notary section labels
('Notary Name', 'notary.name', 'label', 'Notary Name', 'Notary name label'),
('Notary Seal', 'notary.seal', 'label', 'Notary Seal', 'Notary seal label'),
('Notary Date', 'notary.date', 'label', 'Notary Date', 'Notary date label'),
('Notary Commission Expiry', 'notary.commission_expiry', 'label', 'Notary Commission Expiry', 'Notary commission expiry label'),
('Notary County', 'notary.county', 'label', 'Notary County', 'Notary county label'),
('Notary State', 'notary.state', 'label', 'Notary State', 'Notary state label'),
('Appearing Party Names', 'notary.appearing_party_names', 'label', 'Appearing Party Names', 'Appearing party names label'),
('State of', 'notary.state', 'label', 'State of', 'State of label'),
('County of', 'notary.county', 'label', 'County of', 'County of label'),
('Commission Expires', 'notary.commission_expiry', 'label', NULL, 'Commission expires label'),
('My Commission Expires', 'notary.commission_expiry', 'label', NULL, 'My commission expires label'),
('personally appeared', 'notary.appearing_party_names', 'label', 'personally appeared', 'Personally appeared label'),
('Date', 'notary.date', 'label', 'Date', 'Date label'),
('Notary Signature', 'notary.name', 'label', 'Notary Signature', 'Notary signature label'),
('Notary Stamp or Seal', 'notary.seal', 'label', 'Notary Stamp or Seal', 'Notary stamp or seal label');