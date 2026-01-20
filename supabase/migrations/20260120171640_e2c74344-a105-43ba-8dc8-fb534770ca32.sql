-- Add new section enum values for Charge Adjustment, Charge History, and Loan Charges Summary Report
ALTER TYPE field_section ADD VALUE IF NOT EXISTS 'charge_adjustment_loan_info';
ALTER TYPE field_section ADD VALUE IF NOT EXISTS 'charge_adjustment_adjustment_info';
ALTER TYPE field_section ADD VALUE IF NOT EXISTS 'charge_adjustment_adjustments';
ALTER TYPE field_section ADD VALUE IF NOT EXISTS 'charge_adjustment_actions';
ALTER TYPE field_section ADD VALUE IF NOT EXISTS 'charge_history_header';
ALTER TYPE field_section ADD VALUE IF NOT EXISTS 'charge_history_transaction_grid';
ALTER TYPE field_section ADD VALUE IF NOT EXISTS 'charge_history_actions';
ALTER TYPE field_section ADD VALUE IF NOT EXISTS 'loan_charges_summary_header';
ALTER TYPE field_section ADD VALUE IF NOT EXISTS 'loan_charges_summary_details';

-- Add new data type for Action buttons
ALTER TYPE field_data_type ADD VALUE IF NOT EXISTS 'action';