-- Add missing charge fields to field_dictionary
INSERT INTO field_dictionary (field_key, label, section, data_type, is_repeatable, is_calculated) VALUES
  ('charge_owed_to', 'Owed To Account', 'charges', 'text', true, false),
  ('charge_account', 'Account', 'charges', 'text', true, false),
  ('charge_borrower_full_name', 'Borrower Full Name', 'charges', 'text', true, false),
  ('charge_accrued_interest', 'Accrued Interest', 'charges', 'currency', true, false),
  ('charge_unpaid_balance', 'Unpaid Balance', 'charges', 'currency', true, false),
  ('charge_total_due', 'Total Due', 'charges', 'currency', true, false),
  ('charge_advanced_by_account', 'Advanced By Account', 'charges', 'text', true, false),
  ('charge_advanced_by_lender_name', 'Advanced By Lender Name', 'charges', 'text', true, false),
  ('charge_advanced_by_amount', 'Advanced By Amount', 'charges', 'currency', true, false),
  ('charge_on_behalf_of_account', 'On Behalf Of Account', 'charges', 'text', true, false),
  ('charge_on_behalf_of_lender_name', 'On Behalf Of Lender Name', 'charges', 'text', true, false),
  ('charge_on_behalf_of_amount', 'On Behalf Of Amount', 'charges', 'currency', true, false),
  ('charge_amount_owed_by_borrower', 'Amount Owed by Borrower', 'charges', 'currency', true, false);