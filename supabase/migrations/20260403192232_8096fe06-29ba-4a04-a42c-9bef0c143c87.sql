INSERT INTO field_dictionary (field_key, label, section, data_type, is_calculated, calculation_formula, calculation_dependencies, is_repeatable, description)
VALUES (
  'pr_p_annualIncome',
  'Annual Income',
  'property',
  'currency',
  true,
  '{pr_p_monthlyIncome} * 12',
  ARRAY['pr_p_monthlyIncome'],
  false,
  'Calculated field: Monthly Income × 12'
)
ON CONFLICT DO NOTHING;