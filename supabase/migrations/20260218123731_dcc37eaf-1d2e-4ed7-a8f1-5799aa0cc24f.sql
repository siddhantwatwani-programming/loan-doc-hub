
-- Add field dictionary entries for new borrower fields (Tax ID, Delivery Options, Send)
-- Borrower namespace
INSERT INTO public.field_dictionary (field_key, label, section, data_type, description)
VALUES
  ('borrower.tax_id_type', 'Tax ID Type', 'borrower', 'dropdown', 'Tax identification type'),
  ('borrower.tin', 'TIN', 'borrower', 'text', 'Tax identification number'),
  ('borrower.tin_verified', 'TIN Verified', 'borrower', 'boolean', 'Whether TIN has been verified'),
  ('borrower.delivery_print', 'Delivery Print', 'borrower', 'boolean', 'Print delivery option'),
  ('borrower.delivery_email', 'Delivery Email', 'borrower', 'boolean', 'Email delivery option'),
  ('borrower.delivery_sms', 'Delivery SMS', 'borrower', 'boolean', 'SMS delivery option'),
  ('borrower.send_payment_notification', 'Send Payment Notification', 'borrower', 'boolean', 'Send payment notification'),
  ('borrower.send_late_notice', 'Send Late Notice', 'borrower', 'boolean', 'Send late notice'),
  ('borrower.send_borrower_statement', 'Send Borrower Statement', 'borrower', 'boolean', 'Send borrower statement'),
  ('borrower.send_maturity_notice', 'Send Maturity Notice', 'borrower', 'boolean', 'Send maturity notice')
ON CONFLICT (field_key) DO NOTHING;

-- Co-Borrower namespace
INSERT INTO public.field_dictionary (field_key, label, section, data_type, description)
VALUES
  ('coborrower.tax_id_type', 'Tax ID Type', 'co_borrower', 'dropdown', 'Tax identification type'),
  ('coborrower.tin', 'TIN', 'co_borrower', 'text', 'Tax identification number'),
  ('coborrower.tin_verified', 'TIN Verified', 'co_borrower', 'boolean', 'Whether TIN has been verified'),
  ('coborrower.delivery_print', 'Delivery Print', 'co_borrower', 'boolean', 'Print delivery option'),
  ('coborrower.delivery_email', 'Delivery Email', 'co_borrower', 'boolean', 'Email delivery option'),
  ('coborrower.delivery_sms', 'Delivery SMS', 'co_borrower', 'boolean', 'SMS delivery option'),
  ('coborrower.send_payment_notification', 'Send Payment Notification', 'co_borrower', 'boolean', 'Send payment notification'),
  ('coborrower.send_late_notice', 'Send Late Notice', 'co_borrower', 'boolean', 'Send late notice'),
  ('coborrower.send_borrower_statement', 'Send Borrower Statement', 'co_borrower', 'boolean', 'Send borrower statement'),
  ('coborrower.send_maturity_notice', 'Send Maturity Notice', 'co_borrower', 'boolean', 'Send maturity notice')
ON CONFLICT (field_key) DO NOTHING;

-- Additional Guarantor namespace
INSERT INTO public.field_dictionary (field_key, label, section, data_type, description)
VALUES
  ('borrower.guarantor.tax_id_type', 'Tax ID Type', 'borrower', 'dropdown', 'Tax identification type'),
  ('borrower.guarantor.tin', 'TIN', 'borrower', 'text', 'Tax identification number'),
  ('borrower.guarantor.tin_verified', 'TIN Verified', 'borrower', 'boolean', 'Whether TIN has been verified'),
  ('borrower.guarantor.delivery_print', 'Delivery Print', 'borrower', 'boolean', 'Print delivery option'),
  ('borrower.guarantor.delivery_email', 'Delivery Email', 'borrower', 'boolean', 'Email delivery option'),
  ('borrower.guarantor.delivery_sms', 'Delivery SMS', 'borrower', 'boolean', 'SMS delivery option'),
  ('borrower.guarantor.send_payment_notification', 'Send Payment Notification', 'borrower', 'boolean', 'Send payment notification'),
  ('borrower.guarantor.send_late_notice', 'Send Late Notice', 'borrower', 'boolean', 'Send late notice'),
  ('borrower.guarantor.send_borrower_statement', 'Send Borrower Statement', 'borrower', 'boolean', 'Send borrower statement'),
  ('borrower.guarantor.send_maturity_notice', 'Send Maturity Notice', 'borrower', 'boolean', 'Send maturity notice')
ON CONFLICT (field_key) DO NOTHING;
