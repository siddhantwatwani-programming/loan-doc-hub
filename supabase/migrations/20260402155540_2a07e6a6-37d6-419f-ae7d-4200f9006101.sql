INSERT INTO field_dictionary (field_key, label, section, data_type, is_calculated, is_repeatable, is_mandatory)
VALUES
  ('pr_p_taxType', 'Property Tax Type', 'property', 'dropdown', false, false, false),
  ('pr_p_taxTrackiStatus', 'Property Tax Tracking Status', 'property', 'dropdown', false, false, false)
ON CONFLICT DO NOTHING;