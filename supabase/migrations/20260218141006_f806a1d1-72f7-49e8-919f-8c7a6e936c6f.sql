
INSERT INTO field_dictionary (field_key, label, section, data_type, is_repeatable)
VALUES
  ('lien.this_loan', 'This Loan', 'property', 'boolean', true),
  ('lien.estimate', 'Estimate', 'property', 'boolean', true),
  ('lien.status', 'Status', 'property', 'dropdown', true)
ON CONFLICT (field_key) DO NOTHING;
