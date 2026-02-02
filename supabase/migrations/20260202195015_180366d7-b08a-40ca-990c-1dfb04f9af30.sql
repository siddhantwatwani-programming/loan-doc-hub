
-- Insert template_field_maps for Assignment of Deed of Trust (partial interst) template
-- Template ID: acf7bbd0-a111-4c52-aafd-a0d8c1cc401c
-- All 37 tags validated - adding unique field dictionary entries with transforms

INSERT INTO template_field_maps (template_id, field_dictionary_id, transform_rule, required_flag, display_order)
VALUES
  -- Core loan/lender fields (required)
  ('acf7bbd0-a111-4c52-aafd-a0d8c1cc401c', 'd2fcf56b-9b2d-461f-8135-d47fd55fea49', NULL, true, 1), -- Terms.LoanNumber
  ('acf7bbd0-a111-4c52-aafd-a0d8c1cc401c', '7ec46600-ac08-48fc-9cc8-4736778e5547', 'titlecase', true, 2), -- lender.current.name
  ('acf7bbd0-a111-4c52-aafd-a0d8c1cc401c', 'e72e830f-93fc-495d-99d7-b6249b17c998', 'titlecase', true, 3), -- lender.new.name
  ('acf7bbd0-a111-4c52-aafd-a0d8c1cc401c', 'e5556cdb-32a4-4853-9a0d-bbdade2cbd97', NULL, false, 4), -- lender.new.vesting
  
  -- DOT recording info
  ('acf7bbd0-a111-4c52-aafd-a0d8c1cc401c', 'c4af0658-63c8-4391-a149-dd3ab0ff8f6a', NULL, false, 5), -- deed_of_trust.instrument_number
  ('acf7bbd0-a111-4c52-aafd-a0d8c1cc401c', '64f12413-4aec-4798-a19a-8927bbfde8ab', 'date_mmddyyyy', true, 6), -- deed_of_trust.recording_date
  ('acf7bbd0-a111-4c52-aafd-a0d8c1cc401c', 'd4c5dba0-00c0-4751-918f-efcb7a33fdad', 'uppercase', false, 7), -- deed_of_trust.county
  
  -- Recording info
  ('acf7bbd0-a111-4c52-aafd-a0d8c1cc401c', 'a52ac36c-cc21-4349-a6bd-5110dbbad95d', NULL, false, 8), -- recording.mail_to.address
  ('acf7bbd0-a111-4c52-aafd-a0d8c1cc401c', 'c3c152e9-cd4d-4976-9049-23b396e78a5f', NULL, false, 9), -- recording.instrument_number
  
  -- Property fields
  ('acf7bbd0-a111-4c52-aafd-a0d8c1cc401c', '37cb579a-3acc-42df-8fc0-73369fa1228d', NULL, false, 10), -- property1.apn
  ('acf7bbd0-a111-4c52-aafd-a0d8c1cc401c', 'd3174152-9e9e-4bc7-9b1b-9782db2cf0cf', NULL, true, 11), -- property1.address
  ('acf7bbd0-a111-4c52-aafd-a0d8c1cc401c', 'b8cc809e-2a53-47bc-96b7-778ea18d9ef6', NULL, true, 12), -- property1.legal_description
  ('acf7bbd0-a111-4c52-aafd-a0d8c1cc401c', '82fffd8d-0ca1-44aa-ac22-4ccaee5e2bab', NULL, false, 13), -- Property1.Address
  ('acf7bbd0-a111-4c52-aafd-a0d8c1cc401c', '48d0659e-b1a0-46a3-8b13-a085c6de2f62', NULL, false, 14), -- property.legalDescription
  ('acf7bbd0-a111-4c52-aafd-a0d8c1cc401c', 'dac220b4-cc2d-4ce0-abd0-3c6504e2f028', NULL, false, 15), -- property.apn
  
  -- Other/misc fields
  ('acf7bbd0-a111-4c52-aafd-a0d8c1cc401c', '32569fea-cf02-48cd-a339-7c0eeb39bc39', 'percentage', true, 16), -- other.amount_to_own
  ('acf7bbd0-a111-4c52-aafd-a0d8c1cc401c', 'bf92f268-6552-4fd5-a19d-e0a06fd8e52e', NULL, false, 17), -- borrower.vesting
  ('acf7bbd0-a111-4c52-aafd-a0d8c1cc401c', 'b3666e8e-5df6-495c-b3da-949fd89de9e1', 'uppercase', false, 18), -- other.country
  ('acf7bbd0-a111-4c52-aafd-a0d8c1cc401c', '1a7ac9f3-214c-49cc-9901-2550c0f8e3de', 'uppercase', false, 19), -- other.state
  
  -- Signatory fields
  ('acf7bbd0-a111-4c52-aafd-a0d8c1cc401c', '3fe58805-a92b-481d-bb39-b36e863fbd20', 'titlecase', false, 20), -- authorized_signor.name
  ('acf7bbd0-a111-4c52-aafd-a0d8c1cc401c', '3b732daf-1d12-4241-bd1d-87a0e18f228c', 'titlecase', false, 21), -- signatory.title
  
  -- Date fields
  ('acf7bbd0-a111-4c52-aafd-a0d8c1cc401c', '4e9b45e9-987c-4039-91ec-bb99d6414532', 'date_long', true, 22), -- other.date
  ('acf7bbd0-a111-4c52-aafd-a0d8c1cc401c', '1a6639ab-f7ab-4efe-8ab6-fe84ba13a084', 'date_long', false, 23), -- notary2.ackDate
  ('acf7bbd0-a111-4c52-aafd-a0d8c1cc401c', 'b9aeb00d-1f5b-4b95-b13d-30d2742cfa5d', 'date_long', false, 24), -- notary.date
  
  -- Notary fields
  ('acf7bbd0-a111-4c52-aafd-a0d8c1cc401c', 'b146871e-edf1-42d0-9f17-7bf9e3b8904e', 'titlecase', false, 25), -- notary.name
  ('acf7bbd0-a111-4c52-aafd-a0d8c1cc401c', 'f3990576-fb6c-4f7c-8cf3-5f60cf17ed61', 'titlecase', false, 26), -- notary.appearing_party_names
  ('acf7bbd0-a111-4c52-aafd-a0d8c1cc401c', 'ce43299d-e5b2-46e8-bbe9-c7dd3254456b', NULL, false, 27), -- notary.seal
  ('acf7bbd0-a111-4c52-aafd-a0d8c1cc401c', '2fa4582b-becc-43ee-902f-143c18d69821', NULL, false, 28), -- notary1.signature
  ('acf7bbd0-a111-4c52-aafd-a0d8c1cc401c', '32599bd1-9010-4712-bff8-a167e40c15c6', 'uppercase', false, 29) -- notary.state
ON CONFLICT DO NOTHING;
