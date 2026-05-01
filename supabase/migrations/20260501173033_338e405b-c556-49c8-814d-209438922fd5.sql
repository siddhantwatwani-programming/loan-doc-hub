INSERT INTO public.field_dictionary (field_key, label, section, data_type, form_type, is_calculated, canonical_key)
VALUES
  ('property_type_sfr_owner', 'Property Type — SFR Owner-occupied (checkbox)', 'property', 'boolean', 'primary', true, 'property_type_sfr_owner'),
  ('property_type_sfr_non_owner', 'Property Type — SFR Non-owner / Condo (checkbox)', 'property', 'boolean', 'primary', true, 'property_type_sfr_non_owner'),
  ('property_type_sfr_zoned', 'Property Type — Land SFR Zoned (checkbox)', 'property', 'boolean', 'primary', true, 'property_type_sfr_zoned'),
  ('property_type_commercial', 'Property Type — Commercial / Multi-family / Mixed-use (checkbox)', 'property', 'boolean', 'primary', true, 'property_type_commercial'),
  ('property_type_land_zoned', 'Property Type — Land Residential / Commercial (checkbox)', 'property', 'boolean', 'primary', true, 'property_type_land_zoned'),
  ('property_type_land_income', 'Property Type — Land Income Producing (checkbox)', 'property', 'boolean', 'primary', true, 'property_type_land_income'),
  ('property_type_other', 'Property Type — Other (checkbox)', 'property', 'boolean', 'primary', true, 'property_type_other'),
  ('property_type_other_text', 'Property Type — Other (text)', 'property', 'text', 'primary', true, 'property_type_other_text')
ON CONFLICT (field_key) DO UPDATE SET
  label = EXCLUDED.label,
  data_type = EXCLUDED.data_type,
  is_calculated = EXCLUDED.is_calculated,
  canonical_key = EXCLUDED.canonical_key,
  updated_at = now();