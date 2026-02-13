
INSERT INTO public.field_dictionary (field_key, label, section, data_type, is_calculated, is_repeatable)
VALUES
  ('borrower.trust_ledger.date', 'Trust Ledger Date', 'borrower', 'date', false, false),
  ('borrower.trust_ledger.reference', 'Trust Ledger Reference', 'borrower', 'text', false, false),
  ('borrower.trust_ledger.from_whom', 'Trust Ledger From Whom Received / Paid', 'borrower', 'text', false, false),
  ('borrower.trust_ledger.memo', 'Trust Ledger Memo', 'borrower', 'text', false, false),
  ('borrower.trust_ledger.payment', 'Trust Ledger Payment', 'borrower', 'currency', false, false),
  ('borrower.trust_ledger.clr', 'Trust Ledger CLR', 'borrower', 'text', false, false),
  ('borrower.trust_ledger.deposit', 'Trust Ledger Deposit', 'borrower', 'currency', false, false),
  ('borrower.trust_ledger.balance', 'Trust Ledger Balance', 'borrower', 'currency', false, false),
  ('borrower.trust_ledger.category', 'Trust Ledger Category', 'borrower', 'text', false, false)
ON CONFLICT (field_key) DO NOTHING;
