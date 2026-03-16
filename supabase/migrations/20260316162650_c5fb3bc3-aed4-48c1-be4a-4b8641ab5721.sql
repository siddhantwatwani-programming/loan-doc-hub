INSERT INTO public.field_dictionary (field_key, label, section, data_type, canonical_key, form_type, is_calculated, is_repeatable, is_mandatory)
VALUES
  ('loan_terms.details_company', 'Company', 'loan_terms', 'text', 'loan_terms.details_company', 'details', false, false, false),
  ('loan_terms.details_borrower_id', 'Borrower ID', 'loan_terms', 'text', 'loan_terms.details_borrower_id', 'details', false, false, false),
  ('loan_terms.details_borrower_name', 'Borrower Name', 'loan_terms', 'text', 'loan_terms.details_borrower_name', 'details', false, false, false),
  ('loan_terms.details_co_borrower_id', 'Co-Borrower ID', 'loan_terms', 'text', 'loan_terms.details_co_borrower_id', 'details', false, false, false),
  ('loan_terms.details_co_borrower_name', 'Co-Borrower Name', 'loan_terms', 'text', 'loan_terms.details_co_borrower_name', 'details', false, false, false),
  ('loan_terms.details_originating_vendor', 'Originating Vendor', 'loan_terms', 'text', 'loan_terms.details_originating_vendor', 'details', false, false, false)
ON CONFLICT (field_key) DO NOTHING;