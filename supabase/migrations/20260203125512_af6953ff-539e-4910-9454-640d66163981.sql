
-- Add missing field mappings for Blank Note Endorsement (100%) template
-- Template ID: 579dcb81-7e5c-4ad7-bc64-49f0524025f9
-- Currently has 9 mappings, adding 8 more to reach 17 total

INSERT INTO template_field_maps (template_id, field_dictionary_id, transform_rule, required_flag, display_order)
VALUES
  -- lender.current.name
  ('579dcb81-7e5c-4ad7-bc64-49f0524025f9', '7ec46600-ac08-48fc-9cc8-4736778e5547', 'titlecase', true, 10),
  -- authorized_signor.name
  ('579dcb81-7e5c-4ad7-bc64-49f0524025f9', '3fe58805-a92b-481d-bb39-b36e863fbd20', 'titlecase', false, 11),
  -- notary.name
  ('579dcb81-7e5c-4ad7-bc64-49f0524025f9', 'b146871e-edf1-42d0-9f17-7bf9e3b8904e', 'titlecase', false, 12),
  -- notary1.signature
  ('579dcb81-7e5c-4ad7-bc64-49f0524025f9', '2fa4582b-becc-43ee-902f-143c18d69821', NULL, false, 13),
  -- notary.state
  ('579dcb81-7e5c-4ad7-bc64-49f0524025f9', '32599bd1-9010-4712-bff8-a167e40c15c6', 'uppercase', false, 14),
  -- notary.date
  ('579dcb81-7e5c-4ad7-bc64-49f0524025f9', 'b9aeb00d-1f5b-4b95-b13d-30d2742cfa5d', 'date_long', false, 15),
  -- notary.seal
  ('579dcb81-7e5c-4ad7-bc64-49f0524025f9', 'ce43299d-e5b2-46e8-bbe9-c7dd3254456b', NULL, false, 16),
  -- Allonge.PayToOrderOf
  ('579dcb81-7e5c-4ad7-bc64-49f0524025f9', '55795fd0-60c3-4042-bd7b-8c6901b613f0', 'titlecase', true, 17)
ON CONFLICT DO NOTHING;
