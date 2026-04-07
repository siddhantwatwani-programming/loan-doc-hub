INSERT INTO field_dictionary (field_key, label, section, data_type, is_mandatory, form_type, description)
VALUES ('loan_terms.loan_provisions', 'Loan Provisions', 'loan_terms', 'boolean', false, 'details', 'Checkbox indicating if loan provisions are applicable')
ON CONFLICT DO NOTHING;