INSERT INTO public.field_dictionary (field_key, label, section, data_type, is_calculated, is_repeatable, description)
VALUES (
  'pr_p_ownerName_N',
  'Property Owner',
  'property',
  'text',
  false,
  true,
  'Per-property owner name (resolved) sourced from property{N}.property_owner. Rendered in RE851D PROPERTY OWNER section as {{pr_p_ownerName_N}}.'
)
ON CONFLICT (field_key) DO NOTHING;