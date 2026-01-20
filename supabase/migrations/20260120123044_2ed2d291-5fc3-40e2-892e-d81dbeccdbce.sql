-- Insert all Field Dictionary entries (skip duplicates using ON CONFLICT)
-- Data type mappings: phone/email/string/enum → text, decimal → number or percentage

INSERT INTO public.field_dictionary (field_key, label, section, data_type, description)
VALUES
-- Borrower – Name & Salutation
('borrower.full_name', 'Full Name', 'borrower', 'text', 'Borrower full name'),
('borrower.salutation', 'Salutation', 'borrower', 'text', 'Borrower salutation'),
('borrower.first_name', 'First Name', 'borrower', 'text', 'Borrower first name'),
('borrower.middle_initial', 'Middle Initial (MI)', 'borrower', 'text', 'Borrower middle initial'),
('borrower.last_name', 'Last Name', 'borrower', 'text', 'Borrower last name'),
('borrower.generation', 'Generation', 'borrower', 'text', 'Borrower generation suffix'),

-- Borrower – Phone Numbers
('borrower.phone.home', 'Home Phone', 'borrower', 'text', 'Borrower home phone'),
('borrower.phone.work', 'Work Phone', 'borrower', 'text', 'Borrower work phone'),
('borrower.phone.mobile', 'Mobile Phone', 'borrower', 'text', 'Borrower mobile phone'),
('borrower.phone.fax', 'Fax', 'borrower', 'text', 'Borrower fax number'),

-- Borrower – Mailing Address
('borrower.address.street', 'Street Address', 'borrower', 'text', 'Borrower street address'),
('borrower.address.city', 'City', 'borrower', 'text', 'Borrower city'),
('borrower.address.state', 'State / Province', 'borrower', 'text', 'Borrower state or province'),
('borrower.address.zip', 'Zip Code', 'borrower', 'text', 'Borrower zip code'),

-- Borrower – Email & Delivery Options
('borrower.email', 'Email Address', 'borrower', 'text', 'Borrower email address'),
('borrower.email.format', 'Email Format', 'borrower', 'text', 'Borrower email format preference'),
('borrower.delivery.print', 'Delivery – Print', 'borrower', 'boolean', 'Enable print delivery'),
('borrower.delivery.email', 'Delivery – Email', 'borrower', 'boolean', 'Enable email delivery'),
('borrower.delivery.sms', 'Delivery – SMS', 'borrower', 'boolean', 'Enable SMS delivery'),

-- Borrower – Account Information
('borrower.account.number', 'Account Number', 'borrower', 'text', 'Borrower account number'),
('borrower.dob', 'Date of Birth (DOB)', 'borrower', 'date', 'Borrower date of birth'),
('borrower.tax_id', 'TIN / SSN / Tax ID', 'borrower', 'text', 'Borrower tax identification number'),
('borrower.tax_id.type', 'TIN Type', 'borrower', 'text', 'Type of tax ID (enum)'),
('borrower.account.hold_status', 'Hold Account Status', 'borrower', 'boolean', 'Account hold status'),

-- Notices & Forms
('notices.tax_reporting', 'Tax Reporting', 'other', 'boolean', 'Enable tax reporting'),
('notices.send_late_notices', 'Send Late Notices', 'other', 'boolean', 'Enable late notices'),
('notices.payment_receipts', 'Send Payment Receipts', 'other', 'boolean', 'Enable payment receipts'),
('notices.payment_statements', 'Send Payment Statements', 'other', 'boolean', 'Enable payment statements'),
('notices.print_rolodex', 'Print Rolodex Cards', 'other', 'boolean', 'Enable rolodex card printing'),

-- Tax Payer 1098
('tax1098.ssn', 'Tax Payer SSN', 'other', 'text', 'Tax payer SSN for 1098'),
('tax1098.name', 'Tax Payer Name', 'other', 'text', 'Tax payer name for 1098'),
('tax1098.address.street', 'Street Address', 'other', 'text', 'Tax payer street address'),
('tax1098.address.city', 'City', 'other', 'text', 'Tax payer city'),
('tax1098.address.state', 'State', 'other', 'text', 'Tax payer state'),
('tax1098.address.zip', 'Zip Code', 'other', 'text', 'Tax payer zip code'),
('tax1098.account_number', 'Account Number (Optional)', 'other', 'text', 'Tax payer account number'),
('tax1098.recipient_type', 'Recipient Type', 'other', 'text', 'Tax payer recipient type (enum)'),
('tax1098.auto_sync', 'Auto-Synchronize', 'other', 'boolean', 'Enable auto-sync for 1098'),

-- Co-Borrower / Other Information
('coborrower.loan_number', 'Loan Number', 'co_borrower', 'text', 'Co-borrower loan number'),
('coborrower.relation', 'Relation', 'co_borrower', 'text', 'Relation to primary borrower (enum)'),
('coborrower.type', 'Borrower Type', 'co_borrower', 'text', 'Co-borrower type (enum)'),
('coborrower.credit_reporting', 'Credit Reporting Enabled', 'co_borrower', 'boolean', 'Enable credit reporting'),
('coborrower.dob', 'DOB', 'co_borrower', 'date', 'Co-borrower date of birth'),

-- ACH Information
('ach.bank_name', 'Bank Name', 'other', 'text', 'ACH bank name'),
('ach.bank_address', 'Bank Address', 'other', 'text', 'ACH bank address'),
('ach.routing_number', 'Routing Number', 'other', 'text', 'ACH routing number'),
('ach.account_number', 'Bank Account Number', 'other', 'text', 'ACH bank account number'),
('ach.individual_id', 'Individual ID', 'other', 'text', 'ACH individual ID'),
('ach.individual_name', 'Individual Name', 'other', 'text', 'ACH individual name'),
('ach.account_type', 'Account Type', 'other', 'text', 'ACH account type (enum)'),
('ach.service_status', 'Service Status', 'other', 'text', 'ACH service status (enum)'),
('ach.apply_debit_as', 'Apply Debit As', 'other', 'text', 'ACH apply debit as (enum)'),
('ach.debit_frequency', 'Debit Frequency', 'other', 'text', 'ACH debit frequency (enum)'),
('ach.debit_due_day', 'Debit Due Day', 'other', 'number', 'ACH debit due day'),
('ach.next_debit_date', 'Next Debit Date', 'other', 'date', 'ACH next debit date'),
('ach.stop_date', 'Stop Date', 'other', 'date', 'ACH stop date'),
('ach.debit_amount', 'Debit Amount', 'other', 'currency', 'ACH debit amount'),

-- Loan – General
('loan.original_amount', 'Original Amount', 'loan_terms', 'currency', 'Original loan amount'),
('loan.note_rate', 'Note Rate', 'loan_terms', 'percentage', 'Loan note rate'),
('loan.sold_rate', 'Sold Rate', 'loan_terms', 'percentage', 'Loan sold rate'),
('loan.priority', 'Priority', 'loan_terms', 'text', 'Loan priority (enum)'),

-- Loan – Important Dates
('loan.closing_date', 'Closing Date', 'loan_terms', 'date', 'Loan closing date'),
('loan.first_payment_date', 'First Payment Date', 'loan_terms', 'date', 'First payment date'),
('loan.purchase_date', 'Purchase Date', 'loan_terms', 'date', 'Loan purchase date'),
('loan.booking_date', 'Booking Date', 'loan_terms', 'date', 'Loan booking date'),
('loan.interest_paid_to', 'Interest Paid To', 'loan_terms', 'date', 'Interest paid to date'),
('loan.next_payment_date', 'Next Payment Date', 'loan_terms', 'date', 'Next payment date'),
('loan.maturity_date', 'Maturity Date', 'loan_terms', 'date', 'Loan maturity date'),
('loan.paid_off_date', 'Paid Off Date', 'loan_terms', 'date', 'Loan paid off date'),

-- Loan – Balances
('loan.balance.principal', 'Principal Balance', 'loan_terms', 'currency', 'Principal balance'),
('loan.balance.trust', 'Trust Balance', 'loan_terms', 'currency', 'Trust balance'),
('loan.balance.unpaid_charges', 'Unpaid Charges', 'loan_terms', 'currency', 'Unpaid charges balance'),
('loan.balance.unpaid_interest', 'Unpaid Interest', 'loan_terms', 'currency', 'Unpaid interest balance'),

-- Loan – Payments
('loan.payment.frequency', 'Payment Frequency', 'loan_terms', 'text', 'Payment frequency (enum)'),
('loan.payment.due_day', 'Due Day', 'loan_terms', 'number', 'Payment due day'),
('loan.payment.principal_interest', 'Principal & Interest (P&I)', 'loan_terms', 'currency', 'P&I payment amount'),
('loan.payment.reserves', 'Reserves', 'loan_terms', 'currency', 'Reserves payment'),
('loan.payment.other', 'Other Payments', 'loan_terms', 'currency', 'Other payments'),
('loan.payment.total', 'Total Payment', 'loan_terms', 'currency', 'Total payment amount'),

-- Loan – Terms (Split Interest)
('loan.split_interest.enabled', 'Split Interest Enabled', 'loan_terms', 'boolean', 'Enable split interest'),
('loan.split_interest.lender_rate', 'Lender Interest Rate', 'loan_terms', 'percentage', 'Lender interest rate for split'),

-- New Interest Differential Distribution
('lender_or_vendor_id', 'Lender or Vendor', 'other', 'text', 'Lender or vendor ID (lookup)'),
('interest_distribution_percentage', 'Percentage', 'other', 'percentage', 'Interest distribution percentage'),
('interest_distribution_plus_amount', 'Plus Amount', 'other', 'currency', 'Interest distribution plus amount'),

-- Adjust Trust Balance
('loan_account_number', 'Account', 'other', 'text', 'Loan account number'),
('trust_adjustment_code', 'Adjustment Code', 'other', 'text', 'Trust adjustment code (enum)'),
('trust_adjustment_date', 'Adjustment Date', 'other', 'date', 'Trust adjustment date'),
('trust_adjustment_reference', 'Reference', 'other', 'text', 'Trust adjustment reference'),
('trust_adjust_reserve_amount', 'Adjust Reserve', 'other', 'currency', 'Trust reserve adjustment amount'),
('trust_adjust_impound_amount', 'Adjust Impound', 'other', 'currency', 'Trust impound adjustment amount'),
('trust_adjustment_notes', 'Notes', 'other', 'text', 'Trust adjustment notes'),

-- Adjust Unpaid Late Charges
('late_charge_adjustment_code', 'Adjustment Code', 'other', 'text', 'Late charge adjustment code'),
('late_charge_adjustment_date', 'Adjustment Date', 'other', 'date', 'Late charge adjustment date'),
('late_charge_reference', 'Reference', 'other', 'text', 'Late charge reference'),
('late_charge_adjustment_amount', 'Adjustment Amount', 'other', 'currency', 'Late charge adjustment amount'),
('late_charge_notes', 'Notes', 'other', 'text', 'Late charge notes'),

-- New Charge
('charge_date', 'Date of Charge', 'other', 'date', 'Charge date'),
('charge_interest_start_date', 'Interest From', 'other', 'date', 'Charge interest start date'),
('charge_reference', 'Reference', 'other', 'text', 'Charge reference'),
('charge_type', 'Charge Type', 'other', 'text', 'Charge type (enum)'),
('charge_original_amount', 'Original Amount', 'other', 'currency', 'Charge original amount'),
('charge_interest_rate', 'Interest Rate', 'other', 'percentage', 'Charge interest rate'),
('charge_description', 'Description', 'other', 'text', 'Charge description'),
('charge_notes', 'Notes', 'other', 'text', 'Charge notes'),
('charge_is_deferred', 'Deferred', 'other', 'boolean', 'Is charge deferred'),

-- New Charge – Distribution
('distribution_advanced_by_account', 'Advanced By – Account', 'other', 'text', 'Distribution advanced by account'),
('distribution_advanced_by_lender_name', 'Advanced By – Lender Name', 'other', 'text', 'Distribution advanced by lender name'),
('distribution_advanced_by_amount', 'Advanced By – Amount', 'other', 'currency', 'Distribution advanced by amount'),
('distribution_on_behalf_account', 'On Behalf Of – Account', 'other', 'text', 'Distribution on behalf account'),
('distribution_on_behalf_lender_name', 'On Behalf Of – Lender Name', 'other', 'text', 'Distribution on behalf lender name'),
('distribution_on_behalf_amount', 'On Behalf Of – Amount', 'other', 'currency', 'Distribution on behalf amount'),
('distribute_between_all_lenders', 'Distribute Between All Lenders', 'other', 'boolean', 'Distribute between all lenders'),
('amount_owed_by_borrower', 'Amount Owed by Borrower', 'other', 'currency', 'Amount owed by borrower'),

-- New Other Payment
('payee_account', 'Account', 'other', 'text', 'Payee account (lookup)'),
('other_payment_amount', 'Pay Amount', 'other', 'currency', 'Other payment amount'),
('other_payment_paid_by', 'Paid By', 'other', 'text', 'Other payment paid by (enum)'),
('other_payment_description', 'Description', 'other', 'text', 'Other payment description'),
('other_payment_is_active', 'Active', 'other', 'boolean', 'Is other payment active'),

-- Loan Terms / Escrow Analysis
('loan_category_grouping', 'Category & Grouping', 'escrow', 'text', 'Loan category grouping (enum)'),
('lender_code', 'Lender Code', 'escrow', 'text', 'Lender code'),
('loan_purpose', 'Loan Purpose', 'escrow', 'text', 'Loan purpose (enum)'),
('escrow_analysis_paid', 'Escrow Analysis Paid', 'escrow', 'boolean', 'Escrow analysis paid'),
('escrow_scheduled_payment_changes', 'Escrow Analysis Scheduled Payment Changes', 'escrow', 'text', 'Scheduled payment changes (system)'),
('tax_reporting_information', 'Tax Reporting Information', 'escrow', 'text', 'Tax reporting information (system)'),

-- New Modification
('modification_adjustment_date', 'Adjustment Date', 'other', 'date', 'Modification adjustment date'),
('modification_note_rate', 'Note Rate', 'other', 'percentage', 'Modification note rate'),
('modification_sold_rate', 'Sold Rate', 'other', 'percentage', 'Modification sold rate'),
('modification_apply_to_principal_interest', 'Apply to P & I', 'other', 'currency', 'Apply modification to P&I'),
('modification_apply_to_reserve', 'Apply to Reserve', 'other', 'currency', 'Apply modification to reserve'),
('modification_apply_to_impound', 'Apply to Impound', 'other', 'currency', 'Apply modification to impound'),
('print_borrower_modification_notice', 'Print Borrower Modification Notice', 'other', 'boolean', 'Print borrower modification notice')

ON CONFLICT (field_key) DO NOTHING;