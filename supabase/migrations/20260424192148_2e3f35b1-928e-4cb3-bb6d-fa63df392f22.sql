
INSERT INTO public.field_dictionary (field_key, label, section, data_type, form_type, is_calculated, is_repeatable, is_mandatory) VALUES
('origination_app.financials.bank_statements_present', 'Bank Statements', 'origination_fees', 'boolean', 'financials', false, false, false),
('origination_app.financials.bank_statements_status', 'Bank Statements Status', 'origination_fees', 'text', 'financials', false, false, false),
('origination_app.financials.balance_sheet_pl_present', 'Balance Sheet / P&L', 'origination_fees', 'boolean', 'financials', false, false, false),
('origination_app.financials.balance_sheet_pl_assurance', 'Assurance Level', 'origination_fees', 'text', 'financials', false, false, false),
('origination_app.financials.balance_sheet_pl_status', 'Balance Sheet / P&L Status', 'origination_fees', 'text', 'financials', false, false, false),
('origination_app.financials.balance_sheet_as_of_date', 'Balance Sheet as of Date', 'origination_fees', 'date', 'financials', false, false, false),
('origination_app.financials.pl_period_begin', 'P&L Period Begin', 'origination_fees', 'date', 'financials', false, false, false),
('origination_app.financials.pl_period_end', 'P&L Period End', 'origination_fees', 'date', 'financials', false, false, false),
('origination_app.financials.performed_by', 'Performed By', 'origination_fees', 'text', 'financials', false, false, false),
('origination_app.financials.rent_rolls_leases_present', 'Rent Rolls / Leases', 'origination_fees', 'boolean', 'financials', false, false, false),
('origination_app.financials.rent_rolls_leases_status', 'Rent Rolls / Leases Status', 'origination_fees', 'text', 'financials', false, false, false)
ON CONFLICT (field_key) DO NOTHING;
