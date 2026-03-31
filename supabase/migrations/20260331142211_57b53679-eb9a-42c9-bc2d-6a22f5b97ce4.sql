
INSERT INTO field_dictionary (field_key, label, section, data_type, form_type, is_calculated, is_repeatable, is_mandatory)
VALUES
-- 900 Section: Items Required by Lender to be Paid in Advance
-- 901 Interest
('of_901_int_o', '901 Interest (Others)', 'origination_fees', 'currency', 'origination_fees', false, false, false),
('of_901_int_b', '901 Interest (Broker)', 'origination_fees', 'currency', 'origination_fees', false, false, false),
-- 902 Mortgage Insurance Premiums
('of_902_mi_o', '902 Mortgage Insurance Premiums (Others)', 'origination_fees', 'currency', 'origination_fees', false, false, false),
('of_902_mi_b', '902 Mortgage Insurance Premiums (Broker)', 'origination_fees', 'currency', 'origination_fees', false, false, false),
-- 903 Hazard Insurance Premiums
('of_903_hi_o', '903 Hazard Insurance Premiums (Others)', 'origination_fees', 'currency', 'origination_fees', false, false, false),
('of_903_hi_b', '903 Hazard Insurance Premiums (Broker)', 'origination_fees', 'currency', 'origination_fees', false, false, false),
-- 904 County Property Taxes
('of_904_tax_o', '904 County Property Taxes (Others)', 'origination_fees', 'currency', 'origination_fees', false, false, false),
('of_904_tax_b', '904 County Property Taxes (Broker)', 'origination_fees', 'currency', 'origination_fees', false, false, false),
-- 905 VA Funding Fee
('of_905_va_o', '905 VA Funding Fee (Others)', 'origination_fees', 'currency', 'origination_fees', false, false, false),
('of_905_va_b', '905 VA Funding Fee (Broker)', 'origination_fees', 'currency', 'origination_fees', false, false, false),
-- 900 Additional Description
('of_900_desc_o', '900 Additional Description (Others)', 'origination_fees', 'currency', 'origination_fees', false, false, false),
('of_900_desc_b', '900 Additional Description (Broker)', 'origination_fees', 'currency', 'origination_fees', false, false, false),

-- 1000 Section: Reserves Deposited with Lender
-- 1001 Hazard Insurance
('of_1001_hi_o', '1001 Hazard Insurance (Others)', 'origination_fees', 'currency', 'origination_fees', false, false, false),
('of_1001_hi_b', '1001 Hazard Insurance (Broker)', 'origination_fees', 'currency', 'origination_fees', false, false, false),
-- 1002 Mortgage Insurance
('of_1002_mi_o', '1002 Mortgage Insurance (Others)', 'origination_fees', 'currency', 'origination_fees', false, false, false),
('of_1002_mi_b', '1002 Mortgage Insurance (Broker)', 'origination_fees', 'currency', 'origination_fees', false, false, false),
-- 1004 County Property Taxes
('of_1004_tax_o', '1004 County Property Taxes (Others)', 'origination_fees', 'currency', 'origination_fees', false, false, false),
('of_1004_tax_b', '1004 County Property Taxes (Broker)', 'origination_fees', 'currency', 'origination_fees', false, false, false),
-- 1000 Additional Description
('of_1000_desc_o', '1000 Additional Description (Others)', 'origination_fees', 'currency', 'origination_fees', false, false, false),
('of_1000_desc_b', '1000 Additional Description (Broker)', 'origination_fees', 'currency', 'origination_fees', false, false, false),

-- 1100 Section: Title Charges
-- 1101 Settlement/Closing/Escrow Fee
('of_1101_set_o', '1101 Settlement/Closing/Escrow Fee (Others)', 'origination_fees', 'currency', 'origination_fees', false, false, false),
('of_1101_set_b', '1101 Settlement/Closing/Escrow Fee (Broker)', 'origination_fees', 'currency', 'origination_fees', false, false, false),
-- 1105 Document Preparation Fee
('of_1105_doc_o', '1105 Document Preparation Fee (Others)', 'origination_fees', 'currency', 'origination_fees', false, false, false),
('of_1105_doc_b', '1105 Document Preparation Fee (Broker)', 'origination_fees', 'currency', 'origination_fees', false, false, false),
-- 1106 Notary Fee
('of_1106_not_o', '1106 Notary Fee (Others)', 'origination_fees', 'currency', 'origination_fees', false, false, false),
('of_1106_not_b', '1106 Notary Fee (Broker)', 'origination_fees', 'currency', 'origination_fees', false, false, false),
-- 1108 Title Insurance
('of_1108_ti_o', '1108 Title Insurance (Others)', 'origination_fees', 'currency', 'origination_fees', false, false, false),
('of_1108_ti_b', '1108 Title Insurance (Broker)', 'origination_fees', 'currency', 'origination_fees', false, false, false),

-- 1200 Section: Government Recording & Transfer Charges
-- 1201 Recording Fees
('of_1201_rec_o', '1201 Recording Fees (Others)', 'origination_fees', 'currency', 'origination_fees', false, false, false),
('of_1201_rec_b', '1201 Recording Fees (Broker)', 'origination_fees', 'currency', 'origination_fees', false, false, false),
-- 1202 City/County Tax/Stamps
('of_1202_ts_o', '1202 City/County Tax/Stamps (Others)', 'origination_fees', 'currency', 'origination_fees', false, false, false),
('of_1202_ts_b', '1202 City/County Tax/Stamps (Broker)', 'origination_fees', 'currency', 'origination_fees', false, false, false),
-- 1200 Additional Description
('of_1200_desc_o', '1200 Additional Description (Others)', 'origination_fees', 'currency', 'origination_fees', false, false, false),
('of_1200_desc_b', '1200 Additional Description (Broker)', 'origination_fees', 'currency', 'origination_fees', false, false, false),

-- 1300 Section: Additional Settlement Charges
-- 1302 Pest Inspection
('of_1302_pest_o', '1302 Pest Inspection (Others)', 'origination_fees', 'currency', 'origination_fees', false, false, false),
('of_1302_pest_b', '1302 Pest Inspection (Broker)', 'origination_fees', 'currency', 'origination_fees', false, false, false);
