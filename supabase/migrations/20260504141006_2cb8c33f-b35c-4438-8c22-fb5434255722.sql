INSERT INTO public.field_dictionary (field_key, label, data_type, section)
VALUES
  ('property1.land_sfr_residential', 'Land - SFR Residential', 'boolean', 'property'),
  ('property1.land_residential', 'Land - Residential', 'boolean', 'property'),
  ('property1.land_commercial', 'Land - Commercial', 'boolean', 'property'),
  ('property1.land_income_producing', 'Land - Income Producing', 'boolean', 'property')
ON CONFLICT (field_key) DO NOTHING;