
-- Add new insurance fields to field_dictionary for address breakdown, payment mailing address, insurance tracking
INSERT INTO public.field_dictionary (field_key, label, section, data_type, canonical_key) VALUES
  ('insurance.business_address_city', 'Bus. Address City', 'property', 'text', 'insurance.business_address_city'),
  ('insurance.business_address_state', 'Bus. Address State', 'property', 'text', 'insurance.business_address_state'),
  ('insurance.business_address_zip', 'Bus. Address ZIP', 'property', 'text', 'insurance.business_address_zip'),
  ('insurance.payment_mailing_street', 'Payment Mailing Street', 'property', 'text', 'insurance.payment_mailing_street'),
  ('insurance.payment_mailing_city', 'Payment Mailing City', 'property', 'text', 'insurance.payment_mailing_city'),
  ('insurance.payment_mailing_state', 'Payment Mailing State', 'property', 'text', 'insurance.payment_mailing_state'),
  ('insurance.payment_mailing_zip', 'Payment Mailing ZIP', 'property', 'text', 'insurance.payment_mailing_zip'),
  ('insurance.insurance_tracking', 'Insurance Tracking', 'property', 'boolean', 'insurance.insurance_tracking'),
  ('insurance.last_verified', 'Last Verified', 'property', 'date', 'insurance.last_verified'),
  ('insurance.tracking_status', 'Tracking Status', 'property', 'dropdown', 'insurance.tracking_status')
ON CONFLICT (field_key) DO NOTHING;
