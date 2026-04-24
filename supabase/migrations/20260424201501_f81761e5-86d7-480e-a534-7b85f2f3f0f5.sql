INSERT INTO public.field_dictionary (field_key, label, section, data_type, form_type, allowed_roles) VALUES
  ('origination_app.borrower.info_provided_by', 'Information Provided By', 'origination_fees', 'text', 'application', ARRAY['admin','csr']),
  ('origination_app.borrower.is_borrower_also_broker', 'Is Borrower also the Broker', 'origination_fees', 'text', 'application', ARRAY['admin','csr']),
  ('origination_app.borrower.employer_contact_name', 'Employer Contact Name', 'origination_fees', 'text', 'application', ARRAY['admin','csr'])
ON CONFLICT (field_key) DO NOTHING;