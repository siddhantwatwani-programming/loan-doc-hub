-- Create CA Conventional packet (if not exists from partial migration)
INSERT INTO public.packets (id, name, state, product_type, description, is_active)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'CA Conventional Standard',
  'CA',
  'Conventional',
  'Standard California Conventional loan disclosure packet',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Link Lender Disclosures template to packet (if not exists)
INSERT INTO public.packet_templates (packet_id, template_id, display_order, is_required)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '6a2a19ef-0572-40ec-955b-e3875f3bb9b9',
  1,
  true
)
ON CONFLICT DO NOTHING;

-- Create sample deal using CSR user
INSERT INTO public.deals (
  id,
  deal_number,
  state,
  product_type,
  status,
  mode,
  packet_id,
  borrower_name,
  property_address,
  loan_amount,
  created_by,
  notes
)
VALUES (
  'deed0001-0000-0000-0000-000000000001',
  'DL-2025-0001',
  'CA',
  'Conventional',
  'draft',
  'doc_prep',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'John Doe',
  '789 Property Ave, Los Angeles, CA 90001',
  250000,
  '3d9cff3e-e0a0-4f84-a8e5-0333d94549bd',
  'Sample deal for pilot testing'
);

-- Insert text field values
INSERT INTO public.deal_field_values (deal_id, field_key, value_text)
VALUES 
  ('deed0001-0000-0000-0000-000000000001', 'Borrower.Name', 'John Doe'),
  ('deed0001-0000-0000-0000-000000000001', 'Borrower.Address', '123 Main St'),
  ('deed0001-0000-0000-0000-000000000001', 'Borrower.City', 'Los Angeles'),
  ('deed0001-0000-0000-0000-000000000001', 'Borrower.State', 'CA'),
  ('deed0001-0000-0000-0000-000000000001', 'Borrower.Zip', '90001'),
  ('deed0001-0000-0000-0000-000000000001', 'Broker.Name', 'ABC Mortgage'),
  ('deed0001-0000-0000-0000-000000000001', 'Broker.Address', '456 Broker Rd'),
  ('deed0001-0000-0000-0000-000000000001', 'Broker.License', 'BR-123456'),
  ('deed0001-0000-0000-0000-000000000001', 'Broker.Representative', 'Jane Smith'),
  ('deed0001-0000-0000-0000-000000000001', 'Terms.LoanNumber', 'LN-0001'),
  ('deed0001-0000-0000-0000-000000000001', 'Property1.Address', '789 Property Ave'),
  ('deed0001-0000-0000-0000-000000000001', 'Property1.City', 'Los Angeles'),
  ('deed0001-0000-0000-0000-000000000001', 'Property1.State', 'CA'),
  ('deed0001-0000-0000-0000-000000000001', 'Property1.Zip', '90001');

-- Insert numeric field values
INSERT INTO public.deal_field_values (deal_id, field_key, value_number)
VALUES 
  ('deed0001-0000-0000-0000-000000000001', 'Terms.LoanAmount', 250000),
  ('deed0001-0000-0000-0000-000000000001', 'Terms.InterestRate', 7.25),
  ('deed0001-0000-0000-0000-000000000001', 'Terms.TermMonths', 360),
  ('deed0001-0000-0000-0000-000000000001', 'Property1.MarketValue', 400000);

-- Insert date field values
INSERT INTO public.deal_field_values (deal_id, field_key, value_date)
VALUES 
  ('deed0001-0000-0000-0000-000000000001', 'Terms.FirstPaymentDate', '2024-11-01'),
  ('deed0001-0000-0000-0000-000000000001', 'System.DocumentDate', CURRENT_DATE);

-- Log DealCreated activity
INSERT INTO public.activity_log (deal_id, actor_user_id, action_type, action_details)
VALUES (
  'deed0001-0000-0000-0000-000000000001',
  '3d9cff3e-e0a0-4f84-a8e5-0333d94549bd',
  'DealCreated',
  '{"source": "seed_data", "notes": "Sample deal for pilot testing"}'::jsonb
);

-- Log DataSaved activity
INSERT INTO public.activity_log (deal_id, actor_user_id, action_type, action_details)
VALUES (
  'deed0001-0000-0000-0000-000000000001',
  '3d9cff3e-e0a0-4f84-a8e5-0333d94549bd',
  'DataSaved',
  '{"fields_count": 20, "source": "seed_data"}'::jsonb
);