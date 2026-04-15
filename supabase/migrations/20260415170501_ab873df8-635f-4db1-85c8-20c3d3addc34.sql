INSERT INTO merge_tag_aliases (tag_name, field_key, tag_type, is_active, description)
VALUES
  ('ld_p_investorQuestiDueDate', 'ld_p_investorQuestiDueDate', 'merge_tag', true, 'Investor Questionnaire Due Date'),
  ('ld_p_lenderType', 'ld_p_lenderType', 'merge_tag', true, 'Lender Type'),
  ('lender.investor_questionnaire_due_date', 'ld_p_investorQuestiDueDate', 'merge_tag', true, 'Investor Questionnaire Due Date (canonical)'),
  ('lender.type', 'ld_p_lenderType', 'merge_tag', true, 'Lender Type (canonical)'),
  ('Lender_Type', 'ld_p_lenderType', 'merge_tag', true, 'Lender Type (legacy)'),
  ('LenderType', 'ld_p_lenderType', 'merge_tag', true, 'Lender Type (legacy camelCase)'),
  ('InvestorQuestionnaireDueDate', 'ld_p_investorQuestiDueDate', 'merge_tag', true, 'Investor Questionnaire Due Date (legacy camelCase)')
ON CONFLICT DO NOTHING;