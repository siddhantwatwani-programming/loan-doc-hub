INSERT INTO field_dictionary (field_key, label, section, data_type, is_repeatable, is_calculated, is_mandatory)
VALUES
  ('pr_li_delinqu60day', '60-day + Delinquencies', 'liens', 'boolean', true, false, false),
  ('pr_li_delinquHowMany', 'How Many', 'liens', 'text', true, false, false),
  ('pr_li_currentDelinqu', 'Currently Delinquent', 'liens', 'boolean', true, false, false),
  ('pr_li_paidByLoan', 'Will be Paid by this Loan', 'liens', 'boolean', true, false, false),
  ('pr_li_sourceOfPayment', 'Source of Payment', 'liens', 'text', true, false, false);