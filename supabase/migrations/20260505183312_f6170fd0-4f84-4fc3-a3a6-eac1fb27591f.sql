INSERT INTO public.field_dictionary (field_key, label, section, data_type, description, default_value, validation_rule, is_calculated, is_repeatable, is_mandatory, allowed_roles, read_only_roles, form_type)
VALUES (
  'ln_pn_principalPaydownType',
  'Principal Paydown Type',
  'loan_terms',
  'dropdown',
  'Type of principal paydown (Loan → Penalties)',
  '',
  '{"options":[{"value":"None","label":"None"},{"value":"Partial","label":"Partial"},{"value":"Full","label":"Full"},{"value":"Other","label":"Other"}]}',
  false,
  false,
  false,
  ARRAY['admin','csr'],
  ARRAY[]::text[],
  'primary'
)
ON CONFLICT (field_key) DO NOTHING;