INSERT INTO public.field_dictionary (field_key, label, section, data_type, is_calculated, is_repeatable, description)
VALUES (
  'ln_p_totalWithLoan_N',
  'Total Encumbrance + Loan',
  'loan_terms',
  'currency',
  true,
  true,
  'Derived per-property for RE851D: ln_p_totalEncumbrance_N + ln_p_loanAmount. Computed at document generation time; not user-editable.'
)
ON CONFLICT (field_key) DO NOTHING;