INSERT INTO public.field_dictionary (field_key, label, section, data_type, form_type, canonical_key, is_calculated, allowed_roles, read_only_roles)
VALUES
  ('ln_p_totalEncumbrance', 'Total Senior Encumbrances (per property)', 'property', 'currency', 'primary', 'ln_p_totalEncumbrance', true, ARRAY['admin','csr'], ARRAY[]::text[]),
  ('property_number', 'Property No. (auto-numbered)', 'property', 'number', 'primary', 'property_number', true, ARRAY['admin','csr'], ARRAY[]::text[])
ON CONFLICT (field_key) DO UPDATE SET
  label = EXCLUDED.label,
  data_type = EXCLUDED.data_type,
  canonical_key = EXCLUDED.canonical_key,
  is_calculated = EXCLUDED.is_calculated,
  updated_at = now();