
INSERT INTO public.field_dictionary (field_key, label, section, data_type, is_calculated, is_repeatable)
VALUES ('co_borrower.is_primary', 'Primary Contact', 'co_borrower', 'boolean', false, true)
ON CONFLICT (field_key) DO NOTHING;
