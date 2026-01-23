-- Add missing business fields for Assignment of Deed of Trust (100%) template
-- These fields are required for notary section, authorized signor, etc.

INSERT INTO public.field_dictionary (id, field_key, label, section, data_type, is_calculated, is_repeatable, allowed_roles, read_only_roles)
VALUES
  -- Notary fields
  (gen_random_uuid(), 'notary.date', 'Notary Date', 'other', 'date', false, false, ARRAY['admin','csr']::text[], ARRAY[]::text[]),
  (gen_random_uuid(), 'notary.commission_expiry', 'Notary Commission Expiry', 'other', 'date', false, false, ARRAY['admin','csr']::text[], ARRAY[]::text[]),
  (gen_random_uuid(), 'notary.county', 'Notary County', 'other', 'text', false, false, ARRAY['admin','csr']::text[], ARRAY[]::text[]),
  (gen_random_uuid(), 'notary.state', 'Notary State', 'other', 'text', false, false, ARRAY['admin','csr']::text[], ARRAY[]::text[]),
  (gen_random_uuid(), 'notary.appearing_party_names', 'Appearing Party Names', 'other', 'text', false, false, ARRAY['admin','csr']::text[], ARRAY[]::text[]),
  
  -- Authorized signor fields (not to be confused with signatory which already exists)
  (gen_random_uuid(), 'authorized_signor.name', 'Authorized Signor Name', 'other', 'text', false, false, ARRAY['admin','csr']::text[], ARRAY[]::text[]),
  (gen_random_uuid(), 'authorized_signor.title', 'Authorized Signor Title', 'other', 'text', false, false, ARRAY['admin','csr']::text[], ARRAY[]::text[])
ON CONFLICT (field_key) DO NOTHING;