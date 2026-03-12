INSERT INTO public.field_dictionary (field_key, label, section, data_type, is_calculated, is_repeatable, description, canonical_key)
VALUES
  ('loan_terms.sold_rate_originating_vendor', 'Originating Vendor', 'loan_terms', 'percentage', false, false, 'Sold Rate - Originating Vendor percentage', 'ln_p_soldRateOriginatingVendor'),
  ('loan_terms.sold_rate_company', 'Company', 'loan_terms', 'percentage', false, false, 'Sold Rate - Company percentage', 'ln_p_soldRateCompany'),
  ('loan_terms.sold_rate_other_client_1', 'Other - Select from Client List', 'loan_terms', 'percentage', false, false, 'Sold Rate - Other Client 1 percentage', 'ln_p_soldRateOtherClient1'),
  ('loan_terms.sold_rate_other_client_2', 'Other - Select from Client List', 'loan_terms', 'percentage', false, false, 'Sold Rate - Other Client 2 percentage', 'ln_p_soldRateOtherClient2');