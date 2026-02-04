-- Add new field keys from RE 870 Investor Questionnaire document
-- Only adding fields that don't already exist in field_dictionary

-- Form Information fields
INSERT INTO public.field_dictionary (field_key, label, section, data_type, description)
VALUES 
  ('investor.initial_or_update', 'Is this an Initial or Updated Questionnaire?', 'lender', 'dropdown', 'Indicates if this is an initial or updated investor questionnaire'),
  ('investor.date_completed', 'Date Questionnaire Completed', 'lender', 'date', 'Date the investor questionnaire was completed'),
  ('investor.no_material_change_flag', 'Investor confirms no material changes since last update', 'lender', 'boolean', 'Confirmation that no material changes have occurred since last update')
ON CONFLICT (field_key) DO NOTHING;

-- Investor Identification fields
INSERT INTO public.field_dictionary (field_key, label, section, data_type, description)
VALUES 
  ('investor.name', 'Investor Name', 'lender', 'text', 'Name of the investor'),
  ('investor.co_investor_name', 'Co-Investor Name', 'lender', 'text', 'Name of the co-investor'),
  ('investor.entity_name', 'Name of Entity (if applicable)', 'lender', 'text', 'Name of the entity if investor is an organization'),
  ('investor.entity_type', 'Type of Organization (LLC, Partnership, Trust, etc.)', 'lender', 'dropdown', 'Type of organization for entity investors'),
  ('investor.person_completing_form', 'Name of Person Completing This Questionnaire', 'lender', 'text', 'Name of person completing the questionnaire'),
  ('investor.person_title', 'Title of Person Completing This Questionnaire', 'lender', 'text', 'Title of person completing the questionnaire')
ON CONFLICT (field_key) DO NOTHING;

-- Contact Information fields
INSERT INTO public.field_dictionary (field_key, label, section, data_type, description)
VALUES 
  ('investor.address', 'Investor Mailing Address', 'lender', 'text', 'Mailing address of the investor'),
  ('investor.co_investor_address', 'Co-Investor Mailing Address', 'lender', 'text', 'Mailing address of the co-investor'),
  ('investor.phone', 'Investor Telephone Number', 'lender', 'phone', 'Telephone number of the investor'),
  ('investor.co_investor_phone', 'Co-Investor Telephone Number', 'lender', 'phone', 'Telephone number of the co-investor'),
  ('investor.dob', 'Investor Date of Birth', 'lender', 'date', 'Date of birth of the investor'),
  ('investor.co_investor_dob', 'Co-Investor Date of Birth', 'lender', 'date', 'Date of birth of the co-investor')
ON CONFLICT (field_key) DO NOTHING;

-- Employment Information fields
INSERT INTO public.field_dictionary (field_key, label, section, data_type, description)
VALUES 
  ('investor.current_position', 'Current Occupation', 'lender', 'text', 'Current occupation of the investor'),
  ('investor.job_title', 'Job Title', 'lender', 'text', 'Job title of the investor'),
  ('investor.retired_indicator', 'Are You Retired?', 'lender', 'boolean', 'Indicates if the investor is retired'),
  ('investor.years_in_position', 'Length of Time in Current Position (Years)', 'lender', 'number', 'Number of years in current position'),
  ('investor.previous_profession', 'Previous Occupation / Profession', 'lender', 'text', 'Previous occupation or profession')
ON CONFLICT (field_key) DO NOTHING;

-- Financial Information fields
INSERT INTO public.field_dictionary (field_key, label, section, data_type, description)
VALUES 
  ('investor.annual_income_range', 'Estimated Annual Income (Range)', 'lender', 'dropdown', 'Estimated annual income range'),
  ('investor.net_worth_range', 'Estimated Net Worth (Excluding Personal Residence)', 'lender', 'dropdown', 'Estimated net worth excluding personal residence'),
  ('investor.liquid_assets_range', 'Estimated Liquid Assets', 'lender', 'dropdown', 'Estimated liquid assets range'),
  ('investor.source_of_funds', 'Source of Income and Cash Resources', 'lender', 'text', 'Source of income and cash resources')
ON CONFLICT (field_key) DO NOTHING;

-- Investment Experience fields
INSERT INTO public.field_dictionary (field_key, label, section, data_type, description)
VALUES 
  ('investor.investment_experience_flag', 'Do You Have Investment Experience?', 'lender', 'boolean', 'Indicates if investor has investment experience'),
  ('investor.real_estate_experience', 'Experience in Real Estate', 'lender', 'text', 'Description of real estate experience'),
  ('investor.notes_experience', 'Experience in Notes', 'lender', 'text', 'Description of notes investment experience'),
  ('investor.trust_deed_years', 'Years of Experience in Trust Deed / Note Investments', 'lender', 'number', 'Years of experience in trust deed or note investments'),
  ('investor.prior_trust_deed_count', 'Number of Prior Trust Deed / Note Investments', 'lender', 'integer', 'Count of prior trust deed or note investments')
ON CONFLICT (field_key) DO NOTHING;

-- Acknowledgement / Signature fields
INSERT INTO public.field_dictionary (field_key, label, section, data_type, description)
VALUES 
  ('investor.signature', 'Investor Signature', 'lender', 'text', 'Signature of the investor'),
  ('investor.signature_date', 'Date Signed (Investor)', 'lender', 'date', 'Date investor signed the questionnaire'),
  ('investor.broker_signature', 'Broker Signature', 'broker', 'text', 'Signature of the broker'),
  ('investor.broker_signature_date', 'Date Signed (Broker)', 'broker', 'date', 'Date broker signed the questionnaire')
ON CONFLICT (field_key) DO NOTHING;