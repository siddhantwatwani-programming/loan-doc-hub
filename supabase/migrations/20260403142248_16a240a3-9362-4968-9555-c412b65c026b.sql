INSERT INTO field_dictionary (field_key, label, section, data_type, form_type, canonical_key) VALUES
('propertytax.payee', 'Tax Payee', 'property', 'text', 'primary', 'pr_p_taxPayee'),
('propertytax.authority', 'Tax Authority', 'property', 'text', 'primary', NULL),
('propertytax.payee_address', 'Tax Payee Address', 'property', 'text', 'primary', 'pr_p_taxPayeeAddres'),
('propertytax.type', 'Tax Type', 'property', 'text', 'primary', 'pr_p_taxType'),
('propertytax.memo', 'Tax Memo', 'property', 'text', 'primary', 'pr_p_taxMemo'),
('propertytax.next_due_date', 'Tax Next Due Date', 'property', 'date', 'primary', 'pr_p_taxNextDueDate'),
('propertytax.frequency', 'Tax Frequency', 'property', 'text', 'primary', 'pr_p_taxFreque'),
('propertytax.annual_payment', 'Annual Payment', 'property', 'currency', 'primary', NULL),
('propertytax.tax_tracking', 'Tax Tracking', 'property', 'boolean', 'primary', 'pr_p_taxTracki'),
('propertytax.last_verified', 'Tax Last Verified', 'property', 'date', 'primary', NULL),
('propertytax.lender_notified', 'Lender Notified', 'property', 'date', 'primary', NULL),
('propertytax.tracking_status', 'Tax Tracking Status', 'property', 'text', 'primary', 'pr_p_taxTrackiStatus'),
('propertytax.delinquent_amount', 'Delinquent Amount', 'property', 'currency', 'primary', NULL)
ON CONFLICT (field_key) DO NOTHING;