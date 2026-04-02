INSERT INTO public.field_dictionary (field_key, label, section, data_type, canonical_key, is_calculated, is_repeatable)
VALUES 
  ('bk_p_repLicense', 'Representative License', 'broker', 'text', 'bk_p_repLicense', false, false),
  ('bk_p_repSignature', 'Representative Signature', 'broker', 'text', 'bk_p_repSignature', false, false)
ON CONFLICT (field_key) DO NOTHING;