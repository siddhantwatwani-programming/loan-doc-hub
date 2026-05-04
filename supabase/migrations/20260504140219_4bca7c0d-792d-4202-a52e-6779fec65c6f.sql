
INSERT INTO public.field_dictionary (field_key, label, section, data_type, description)
VALUES
  ('propertytax.tax_confidence', 'Tax Confidence', 'property', 'text', 'Actual or Estimated'),
  ('propertytax.bring_current_amount', 'Amount to Bring Taxes Current', 'property', 'currency', 'Amount required to bring delinquent taxes current')
ON CONFLICT DO NOTHING;
