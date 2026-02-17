INSERT INTO public.field_dictionary (field_key, label, section, data_type, is_repeatable, is_calculated)
VALUES
  ('property.tax.payee', 'Tax Payee', 'property', 'text', false, false),
  ('property.tax.payee_address', 'Tax Payee Address', 'property', 'text', false, false),
  ('property.tax.next_due_date', 'Tax Next Due Date', 'property', 'date', false, false),
  ('property.tax.frequency', 'Tax Frequency', 'property', 'dropdown', false, false),
  ('property.tax.hold', 'Tax Hold', 'property', 'boolean', false, false),
  ('property.tax.ref', 'Tax Ref', 'property', 'text', false, false),
  ('property.tax.memo', 'Tax Memo', 'property', 'text', false, false)
ON CONFLICT (field_key) DO NOTHING;