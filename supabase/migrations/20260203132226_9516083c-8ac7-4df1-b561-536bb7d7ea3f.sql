
-- Add field mappings for Change of Beneficiary template
-- Template ID: 39ff84d4-22fc-4a42-b86b-9031b5aa0168
-- Currently has 0 mappings, adding all validated tags

INSERT INTO template_field_maps (template_id, field_dictionary_id, transform_rule, required_flag, display_order)
VALUES
  -- other.date
  ('39ff84d4-22fc-4a42-b86b-9031b5aa0168', '4e9b45e9-987c-4039-91ec-bb99d6414532', 'date_long', true, 1),
  -- borrower.full_name
  ('39ff84d4-22fc-4a42-b86b-9031b5aa0168', '69d7cead-a5f1-4f71-b43e-7a12d9bdb385', 'titlecase', true, 2),
  -- borrower.email
  ('39ff84d4-22fc-4a42-b86b-9031b5aa0168', '63f87fd8-1653-4cea-b47f-514c03e5d241', NULL, false, 3),
  -- Terms.LoanNumber
  ('39ff84d4-22fc-4a42-b86b-9031b5aa0168', 'd2fcf56b-9b2d-461f-8135-d47fd55fea49', NULL, true, 4),
  -- Property1.Address
  ('39ff84d4-22fc-4a42-b86b-9031b5aa0168', '82fffd8d-0ca1-44aa-ac22-4ccaee5e2bab', NULL, false, 5),
  -- lender.old_lender
  ('39ff84d4-22fc-4a42-b86b-9031b5aa0168', 'ce09e699-ee84-4c19-b751-d7dbe33b8ff5', 'titlecase', false, 6),
  -- deedOfTrust.date
  ('39ff84d4-22fc-4a42-b86b-9031b5aa0168', 'e30b11eb-0158-40a3-8a23-31938cfdfe1a', 'date_long', false, 7),
  -- other.state
  ('39ff84d4-22fc-4a42-b86b-9031b5aa0168', '1a7ac9f3-214c-49cc-9901-2550c0f8e3de', 'uppercase', false, 8),
  -- other.new_beneficiary
  ('39ff84d4-22fc-4a42-b86b-9031b5aa0168', '23525792-0565-42d6-ba7f-518c904eb54f', 'titlecase', true, 9),
  -- lender.new.name
  ('39ff84d4-22fc-4a42-b86b-9031b5aa0168', 'e72e830f-93fc-495d-99d7-b6249b17c998', 'titlecase', false, 10),
  -- recording.mail_to.address
  ('39ff84d4-22fc-4a42-b86b-9031b5aa0168', 'a52ac36c-cc21-4349-a6bd-5110dbbad95d', NULL, false, 11),
  -- notary.date
  ('39ff84d4-22fc-4a42-b86b-9031b5aa0168', 'b9aeb00d-1f5b-4b95-b13d-30d2742cfa5d', 'date_long', false, 12)
ON CONFLICT DO NOTHING;
