INSERT INTO field_dictionary (field_key, label, section, data_type, is_calculated, is_repeatable) VALUES
  ('ch_p_department', 'Department', 'charges', 'text', false, true),
  ('ch_p_category', 'Category', 'charges', 'text', false, true),
  ('ch_p_details', 'Details', 'charges', 'text', false, true),
  ('ch_p_currentBalance', 'Current Balance', 'charges', 'currency', false, true),
  ('ch_p_balanceDueAsOf', 'Balance Due as of', 'charges', 'date', false, true),
  ('ch_p_balanceDue', 'Balance Due', 'charges', 'currency', false, true),
  ('ch_p_advancedByDeferred', 'Advanced By Deferred', 'charges', 'text', false, true),
  ('ch_p_advancedByTotal', 'Advanced By Total', 'charges', 'currency', false, true),
  ('ch_p_onBehalfOfBilling', 'On Behalf Of Billing', 'charges', 'text', false, true),
  ('ch_p_onBehalfOfTotal', 'On Behalf Of Total', 'charges', 'currency', false, true),
  ('ch_p_owedFrom', 'Owed From', 'charges', 'text', false, true),
  ('ch_p_distribuBetweenAll', 'Distribute Between All Lenders', 'charges', 'text', false, true)
ON CONFLICT (field_key) DO NOTHING;