
-- Add the 4 missing boolean field dictionary entries for insurance disclosure checkboxes
INSERT INTO field_dictionary (field_key, label, data_type, section, is_calculated, is_repeatable)
VALUES
  ('origination_ins.re_mortgagee', 'Lender(s) as Mortgagee', 'boolean', 'origination_fees', false, false),
  ('origination_ins.re_loss_payee', 'Lender(s) as Loss Payee', 'boolean', 'origination_fees', false, false),
  ('origination_ins.re_additional_insured', 'Lender(s) as Additional Insured', 'boolean', 'origination_fees', false, false),
  ('origination_ins.re_builders_risk', 'Additional Insured on Builder''s Risk', 'boolean', 'origination_fees', false, false)
ON CONFLICT (field_key) DO NOTHING;

-- Add merge_tag_aliases with tag_type='label' so label-based replacement works in document generation
INSERT INTO merge_tag_aliases (tag_name, field_key, tag_type, is_active)
VALUES
  ('Lender(s) as Mortgagee', 'origination_ins.re_mortgagee', 'label', true),
  ('Lender(s) as Loss Payee', 'origination_ins.re_loss_payee', 'label', true),
  ('Lender(s) as Additional Insured', 'origination_ins.re_additional_insured', 'label', true),
  ('Additional Insured on Builder''s Risk', 'origination_ins.re_builders_risk', 'label', true)
ON CONFLICT DO NOTHING;
