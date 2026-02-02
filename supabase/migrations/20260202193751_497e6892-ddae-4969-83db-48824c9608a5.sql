-- Insert template_field_maps for Collateral Assignment of Deed of Trust template
-- Template ID: 83f568d3-db76-4671-b188-538806b3deba
-- These mappings define transform rules for proper field formatting in the document

INSERT INTO template_field_maps (template_id, field_dictionary_id, transform_rule, required_flag, display_order)
VALUES
  -- Date fields with date_long transform
  ('83f568d3-db76-4671-b188-538806b3deba', '4e9b45e9-987c-4039-91ec-bb99d6414532', 'date_long', true, 1), -- other.date
  ('83f568d3-db76-4671-b188-538806b3deba', '1a6639ab-f7ab-4efe-8ab6-fe84ba13a084', 'date_long', false, 2), -- notary2.ackDate
  ('83f568d3-db76-4671-b188-538806b3deba', 'b9aeb00d-1f5b-4b95-b13d-30d2742cfa5d', 'date_long', false, 3), -- notary.date
  
  -- Date fields with date_mmddyyyy transform
  ('83f568d3-db76-4671-b188-538806b3deba', '4aac92c9-6d6d-44eb-af23-a5033193d00f', 'date_mmddyyyy', false, 4), -- recording.date
  ('83f568d3-db76-4671-b188-538806b3deba', '64f12413-4aec-4798-a19a-8927bbfde8ab', 'date_mmddyyyy', false, 5), -- deed_of_trust.recording_date
  
  -- Text fields with titlecase transform
  ('83f568d3-db76-4671-b188-538806b3deba', '7ec46600-ac08-48fc-9cc8-4736778e5547', 'titlecase', true, 6), -- lender.current.name
  ('83f568d3-db76-4671-b188-538806b3deba', 'b146871e-edf1-42d0-9f17-7bf9e3b8904e', 'titlecase', false, 7), -- notary.name
  ('83f568d3-db76-4671-b188-538806b3deba', '3fe58805-a92b-481d-bb39-b36e863fbd20', 'titlecase', false, 8), -- authorized_signor.name
  ('83f568d3-db76-4671-b188-538806b3deba', 'f3990576-fb6c-4f7c-8cf3-5f60cf17ed61', 'titlecase', false, 9), -- notary.appearing_party_names
  ('83f568d3-db76-4671-b188-538806b3deba', 'e3db89aa-f796-4a68-a748-f0428b44842c', 'titlecase', false, 10), -- notary2.representedEntityName
  
  -- Core required fields without specific transforms (uses default formatting)
  ('83f568d3-db76-4671-b188-538806b3deba', 'd2fcf56b-9b2d-461f-8135-d47fd55fea49', NULL, true, 11), -- Terms.LoanNumber
  ('83f568d3-db76-4671-b188-538806b3deba', 'aab82127-8940-4eca-9bf4-c932b3fe50f4', NULL, true, 12), -- lender.vesting
  ('83f568d3-db76-4671-b188-538806b3deba', 'bf92f268-6552-4fd5-a19d-e0a06fd8e52e', NULL, true, 13), -- borrower.vesting
  ('83f568d3-db76-4671-b188-538806b3deba', '32569fea-cf02-48cd-a339-7c0eeb39bc39', 'percentage', true, 14), -- other.amount_to_own
  ('83f568d3-db76-4671-b188-538806b3deba', '834b9985-dad0-4f83-a0c6-b864ef122340', NULL, false, 15), -- deedOfTrust.trustee
  ('83f568d3-db76-4671-b188-538806b3deba', 'c3c152e9-cd4d-4976-9049-23b396e78a5f', NULL, false, 16), -- recording.instrument_number
  ('83f568d3-db76-4671-b188-538806b3deba', 'b3666e8e-5df6-495c-b3da-949fd89de9e1', 'uppercase', false, 17), -- other.country
  ('83f568d3-db76-4671-b188-538806b3deba', '1a7ac9f3-214c-49cc-9901-2550c0f8e3de', 'uppercase', false, 18), -- other.state
  ('83f568d3-db76-4671-b188-538806b3deba', 'd3174152-9e9e-4bc7-9b1b-9782db2cf0cf', NULL, true, 19), -- property1.address
  ('83f568d3-db76-4671-b188-538806b3deba', 'b8cc809e-2a53-47bc-96b7-778ea18d9ef6', NULL, true, 20), -- property1.legal_description
  ('83f568d3-db76-4671-b188-538806b3deba', '37cb579a-3acc-42df-8fc0-73369fa1228d', NULL, false, 21), -- property1.apn
  ('83f568d3-db76-4671-b188-538806b3deba', '3b732daf-1d12-4241-bd1d-87a0e18f228c', 'titlecase', false, 22), -- signatory.title
  ('83f568d3-db76-4671-b188-538806b3deba', 'ce43299d-e5b2-46e8-bbe9-c7dd3254456b', NULL, false, 23), -- notary.seal
  ('83f568d3-db76-4671-b188-538806b3deba', '2fa4582b-becc-43ee-902f-143c18d69821', NULL, false, 24) -- notary1.signature
ON CONFLICT DO NOTHING;