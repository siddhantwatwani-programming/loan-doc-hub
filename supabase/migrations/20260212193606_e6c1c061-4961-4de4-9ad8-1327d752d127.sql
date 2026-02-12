
-- Add missing field_dictionary entries for Loan Terms forms
-- Balances Form
INSERT INTO field_dictionary (field_key, label, section, data_type) VALUES
('loan_terms.loan_amount', 'Loan Amount', 'loan_terms', 'currency'),
('loan_terms.note_rate', 'Note Rate', 'loan_terms', 'percentage'),
('loan_terms.sold_rate', 'Sold Rate', 'loan_terms', 'percentage'),
('loan_terms.sold_rate_enabled', 'Sold Rate Enabled', 'loan_terms', 'boolean'),
('loan_terms.originating_vendor', 'Originating Vendor', 'loan_terms', 'text'),
('loan_terms.originating_vendor_enabled', 'Originating Vendor Enabled', 'loan_terms', 'boolean'),
('loan_terms.company', 'Company', 'loan_terms', 'text'),
('loan_terms.company_enabled', 'Company Enabled', 'loan_terms', 'boolean'),
('loan_terms.other_client_1', 'Other Client 1', 'loan_terms', 'text'),
('loan_terms.other_client_1_enabled', 'Other Client 1 Enabled', 'loan_terms', 'boolean'),
('loan_terms.other_client_1_pct', 'Other Client 1 Pct', 'loan_terms', 'percentage'),
('loan_terms.other_client_1_amt', 'Other Client 1 Amt', 'loan_terms', 'currency'),
('loan_terms.other_client_2', 'Other Client 2', 'loan_terms', 'text'),
('loan_terms.other_client_2_enabled', 'Other Client 2 Enabled', 'loan_terms', 'boolean'),
('loan_terms.other_client_2_pct', 'Other Client 2 Pct', 'loan_terms', 'percentage'),
('loan_terms.other_client_2_amt', 'Other Client 2 Amt', 'loan_terms', 'currency'),
('loan_terms.interest_split', 'Interest Split', 'loan_terms', 'text'),
('loan_terms.interest_split_enabled', 'Interest Split Enabled', 'loan_terms', 'boolean'),
('loan_terms.originating_vendor_pct', 'Originating Vendor Pct', 'loan_terms', 'percentage'),
('loan_terms.originating_vendor_amt', 'Originating Vendor Amt', 'loan_terms', 'currency'),
('loan_terms.company_pct', 'Company Pct', 'loan_terms', 'percentage'),
('loan_terms.company_amt', 'Company Amt', 'loan_terms', 'currency'),
('loan_terms.unearned_discount_balance', 'Unearned Discount Balance', 'loan_terms', 'text'),
('loan_terms.accrual_method', 'Accrual Method', 'loan_terms', 'text'),
('loan_terms.prepaid_payments', 'Prepaid Payments', 'loan_terms', 'text'),
('loan_terms.prepaid_payments_enabled', 'Prepaid Payments Enabled', 'loan_terms', 'boolean'),
('loan_terms.prepaid_payments_months', 'Prepaid Payments Months', 'loan_terms', 'number'),
('loan_terms.impounded_payments', 'Impounded Payments', 'loan_terms', 'text'),
('loan_terms.impounded_payments_months', 'Impounded Payments Months', 'loan_terms', 'number'),
('loan_terms.funding_holdback', 'Funding Holdback', 'loan_terms', 'text'),
('loan_terms.funding_holdback_enabled', 'Funding Holdback Enabled', 'loan_terms', 'boolean'),
('loan_terms.funding_holdback_held_by', 'Funding Holdback Held By', 'loan_terms', 'text'),
('loan_terms.payment_frequency', 'Payment Frequency', 'loan_terms', 'text'),
('loan_terms.day_due', 'Day Due', 'loan_terms', 'number'),
('loan_terms.first_payment', 'First Payment', 'loan_terms', 'date'),
('loan_terms.last_payment_received', 'Last Payment Received', 'loan_terms', 'date'),
('loan_terms.paid_to', 'Paid To', 'loan_terms', 'date'),
('loan_terms.next_payment', 'Next Payment', 'loan_terms', 'date'),
('loan_terms.regular_payment', 'Regular Payment', 'loan_terms', 'currency'),
('loan_terms.additional_principal', 'Additional Principal', 'loan_terms', 'currency'),
('loan_terms.other_scheduled_payments', 'Other Scheduled Payments', 'loan_terms', 'currency'),
('loan_terms.to_escrow_impounds', 'To Escrow Impounds', 'loan_terms', 'currency'),
('loan_terms.default_interest', 'Default Interest', 'loan_terms', 'currency'),
('loan_terms.total_payment', 'Total Payment', 'loan_terms', 'currency'),
('loan_terms.principal', 'Principal', 'loan_terms', 'currency'),
('loan_terms.unpaid_late_charges', 'Unpaid Late Charges', 'loan_terms', 'currency'),
('loan_terms.accrued_late_charges', 'Accrued Late Charges', 'loan_terms', 'currency'),
('loan_terms.unpaid_interest', 'Unpaid Interest', 'loan_terms', 'currency'),
('loan_terms.accrued_interest', 'Accrued Interest', 'loan_terms', 'currency'),
('loan_terms.interest_guarantee', 'Interest Guarantee', 'loan_terms', 'currency'),
('loan_terms.unpaid_default_interest', 'Unpaid Default Interest', 'loan_terms', 'currency'),
('loan_terms.accrued_default_interest', 'Accrued Default Interest', 'loan_terms', 'currency'),
('loan_terms.charges_owed', 'Charges Owed', 'loan_terms', 'currency'),
('loan_terms.charges_interest', 'Charges Interest', 'loan_terms', 'currency'),
('loan_terms.amount_to_reinstate', 'Amount To Reinstate', 'loan_terms', 'currency'),
('loan_terms.reserve_balance', 'Reserve Balance', 'loan_terms', 'currency'),
('loan_terms.escrow_balance', 'Escrow Balance', 'loan_terms', 'currency'),
('loan_terms.other_1_pct', 'Other 1 Pct', 'loan_terms', 'percentage'),
('loan_terms.other_1_amt', 'Other 1 Amt', 'loan_terms', 'currency'),
('loan_terms.other_2_pct', 'Other 2 Pct', 'loan_terms', 'percentage'),
('loan_terms.other_2_amt', 'Other 2 Amt', 'loan_terms', 'currency'),
-- Details Form
('loan_terms.details_company', 'Company', 'loan_terms', 'text'),
('Terms.LoanNumber', 'Loan Number', 'loan_terms', 'text'),
('loan_terms.assigned_csr', 'Assigned CSR', 'loan_terms', 'text'),
('loan_terms.details_originating_vendor', 'Originating Vendor', 'loan_terms', 'text'),
('loan_terms.origination', 'Origination', 'loan_terms', 'date'),
('loan_terms.boarding', 'Boarding', 'loan_terms', 'date'),
('loan_terms.maturity', 'Maturity', 'loan_terms', 'text'),
('loan_terms.maturity_date', 'Maturity Date', 'loan_terms', 'date'),
('loan_terms.lien_position', 'Lien Position', 'loan_terms', 'text'),
('loan_terms.loan_purpose', 'Loan Purpose', 'loan_terms', 'text'),
('loan_terms.rate_structure', 'Rate Structure', 'loan_terms', 'text'),
('loan_terms.amortization', 'Amortization', 'loan_terms', 'text'),
('loan_terms.interest_calculation', 'Interest Calculation', 'loan_terms', 'text'),
('loan_terms.short_payments_applied_to', 'Short Payments Applied To', 'loan_terms', 'text'),
('loan_terms.processing_unpaid_interest', 'Processing Unpaid Interest', 'loan_terms', 'text'),
('loan_terms.calculation_period', 'Calculation Period', 'loan_terms', 'text'),
('loan_terms.seller_carry', 'Seller Carry', 'loan_terms', 'boolean'),
('loan_terms.aitd_wrap', 'AITD Wrap', 'loan_terms', 'boolean'),
('loan_terms.rehab_construction', 'Rehab Construction', 'loan_terms', 'boolean'),
('loan_terms.variable_arm', 'Variable ARM', 'loan_terms', 'boolean'),
('loan_terms.respa', 'RESPA', 'loan_terms', 'boolean'),
('loan_terms.unsecured', 'Unsecured', 'loan_terms', 'boolean'),
('loan_terms.cross_collateral', 'Cross Collateral', 'loan_terms', 'boolean'),
('loan_terms.limited_no_doc', 'Limited No Doc', 'loan_terms', 'boolean'),
-- Servicing override
('loan_terms.servicing.override', 'Override', 'loan_terms', 'boolean'),
('loan_terms.servicing.custom.label', 'Custom Service Label', 'loan_terms', 'text'),
('loan_terms.servicing.custom.enabled', 'Custom Service Enabled', 'loan_terms', 'boolean')
ON CONFLICT (field_key) DO NOTHING;

-- Penalties Form - Late Charge 1 & 2, Default Interest, Interest Guarantee, Prepayment, Maturity
DO $$
DECLARE
  penalty_prefix text;
  penalty_prefixes text[] := ARRAY[
    'loan_terms.penalties.late_charge_1',
    'loan_terms.penalties.late_charge_2'
  ];
  penalty_fields text[] := ARRAY[
    'enabled', 'type', 'grace_period', 'calendar_actual', 'minimum_late_fee',
    'percentage_of_payment', 'additional_daily_charge',
    'distribution.lenders', 'distribution.origination_vendors', 'distribution.company', 'distribution.other'
  ];
  f text;
BEGIN
  FOREACH penalty_prefix IN ARRAY penalty_prefixes LOOP
    FOREACH f IN ARRAY penalty_fields LOOP
      INSERT INTO field_dictionary (field_key, label, section, data_type)
      VALUES (penalty_prefix || '.' || f, initcap(replace(f, '.', ' ')), 'loan_terms', 'text')
      ON CONFLICT (field_key) DO NOTHING;
    END LOOP;
  END LOOP;

  -- Default Interest
  FOREACH f IN ARRAY ARRAY[
    'enabled', 'triggered_by', 'grace_period', 'flat_rate_enabled', 'flat_rate',
    'modifier_enabled', 'modifier', 'active_until', 'additional_daily_charge',
    'distribution.lenders', 'distribution.origination_vendors', 'distribution.company', 'distribution.other'
  ] LOOP
    INSERT INTO field_dictionary (field_key, label, section, data_type)
    VALUES ('loan_terms.penalties.default_interest.' || f, initcap(replace(f, '.', ' ')), 'loan_terms', 'text')
    ON CONFLICT (field_key) DO NOTHING;
  END LOOP;

  -- Interest Guarantee
  FOREACH f IN ARRAY ARRAY[
    'enabled', 'months_enabled', 'months', 'include_odd_days', 'amount_enabled', 'amount',
    'distribution.lenders', 'distribution.origination_vendors', 'distribution.company', 'distribution.other'
  ] LOOP
    INSERT INTO field_dictionary (field_key, label, section, data_type)
    VALUES ('loan_terms.penalties.interest_guarantee.' || f, initcap(replace(f, '.', ' ')), 'loan_terms', 'text')
    ON CONFLICT (field_key) DO NOTHING;
  END LOOP;

  -- Prepayment Penalty
  FOREACH f IN ARRAY ARRAY[
    'enabled', 'first_years', 'greater_than', 'of_the', 'penalty_months',
    'distribution.lenders', 'distribution.origination_vendors', 'distribution.company', 'distribution.other'
  ] LOOP
    INSERT INTO field_dictionary (field_key, label, section, data_type)
    VALUES ('loan_terms.penalties.prepayment.' || f, initcap(replace(f, '.', ' ')), 'loan_terms', 'text')
    ON CONFLICT (field_key) DO NOTHING;
  END LOOP;

  -- Maturity
  FOREACH f IN ARRAY ARRAY[
    'enabled', 'grace_period_days', 'standard_10_percent', 'additional_flat_fee_enabled', 'additional_flat_fee',
    'distribution.lenders', 'distribution.origination_vendors', 'distribution.company', 'distribution.other'
  ] LOOP
    INSERT INTO field_dictionary (field_key, label, section, data_type)
    VALUES ('loan_terms.penalties.maturity.' || f, initcap(replace(f, '.', ' ')), 'loan_terms', 'text')
    ON CONFLICT (field_key) DO NOTHING;
  END LOOP;
END $$;

-- Servicing Form - Generate entries for all service rows × grid columns
DO $$
DECLARE
  row_keys text[] := ARRAY[
    'standard_servicing', 'high_touch', 'default', 'minimum_fee', 'minimum_per_lender',
    'calfirpta', 'escrow_impound', 'insurance_tracking', 'tax_tracking', 'senior_lien_tracking',
    'additional_disbursements', 'document_storage', 'mail', 'reserve_pass_through',
    'reserve_hold_and_pay', 'late_notice', 'buyer_notice', 'seller_notice', 'third_party_notice', 'custom'
  ];
  col_keys text[] := ARRAY['cost', 'lender_percent', 'lenders_split', 'borrower_amount', 'borrower_percent', 'broker'];
  r text;
  c text;
BEGIN
  FOREACH r IN ARRAY row_keys LOOP
    INSERT INTO field_dictionary (field_key, label, section, data_type)
    VALUES ('loan_terms.servicing.' || r || '.enabled', initcap(replace(r, '_', ' ')) || ' Enabled', 'loan_terms', 'boolean')
    ON CONFLICT (field_key) DO NOTHING;

    FOREACH c IN ARRAY col_keys LOOP
      INSERT INTO field_dictionary (field_key, label, section, data_type)
      VALUES ('loan_terms.servicing.' || r || '.' || c, initcap(replace(r, '_', ' ')) || ' ' || initcap(replace(c, '_', ' ')), 'loan_terms', 'text')
      ON CONFLICT (field_key) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
