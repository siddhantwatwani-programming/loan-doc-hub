INSERT INTO public.field_dictionary (field_key, label, section, data_type, is_calculated, is_repeatable, description)
VALUES ('loan_terms.funding_adjustments', 'Funding Adjustments', 'loan_terms', 'text', false, false, 'JSON array of funding adjustment records')
ON CONFLICT (field_key) DO NOTHING;