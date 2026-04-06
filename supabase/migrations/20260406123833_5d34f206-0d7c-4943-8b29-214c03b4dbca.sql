INSERT INTO field_dictionary (field_key, label, section, data_type, is_calculated, calculation_formula, calculation_dependencies, is_repeatable, form_type, description)
VALUES (
  'ln_p_loanToValueRatio',
  'Loan to Value Ratio',
  'loan_terms',
  'percentage',
  true,
  '({ln_p_loanAmount} / {pr_p_appraiseValue}) * 100',
  ARRAY['ln_p_loanAmount', 'pr_p_appraiseValue'],
  false,
  'primary',
  'Calculated field: (Loan Amount / Appraised Value) × 100'
)
ON CONFLICT DO NOTHING;