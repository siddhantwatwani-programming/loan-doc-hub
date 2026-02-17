-- Add vesting override tracking field for Additional Guarantor
INSERT INTO public.field_dictionary (field_key, label, section, data_type, is_calculated, is_repeatable)
VALUES
  ('borrower.guarantor.vesting_overridden', 'Guarantor Vesting Overridden', 'borrower', 'boolean', false, true);