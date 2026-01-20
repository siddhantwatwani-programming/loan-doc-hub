-- Add Escrow Voucher fields (section: escrow)
INSERT INTO public.field_dictionary (field_key, label, section, data_type, description, allowed_roles)
VALUES
  ('escrowVoucher.payee', 'Payee', 'escrow', 'text', 'Escrow voucher payee name', ARRAY['admin', 'csr']),
  ('escrowVoucher.payeeAddress', 'Payee Address', 'escrow', 'text', 'Escrow voucher payee address', ARRAY['admin', 'csr']),
  ('escrowVoucher.disbursementDate', 'Disbursement Date', 'escrow', 'date', 'Escrow voucher disbursement date', ARRAY['admin', 'csr']),
  ('escrowVoucher.amount', 'Amount', 'escrow', 'currency', 'Escrow voucher amount', ARRAY['admin', 'csr']),
  ('escrowVoucher.frequency', 'Frequency', 'escrow', 'text', 'Escrow voucher payment frequency', ARRAY['admin', 'csr']),
  ('escrowVoucher.type', 'Type', 'escrow', 'text', 'Escrow voucher type', ARRAY['admin', 'csr']),
  ('escrowVoucher.referenceNumber', 'Reference Number', 'escrow', 'text', 'Escrow voucher reference number', ARRAY['admin', 'csr']),
  ('escrowVoucher.memo', 'Memo', 'escrow', 'text', 'Escrow voucher memo', ARRAY['admin', 'csr']),
  ('escrowVoucher.holdFlag', 'Hold Flag', 'escrow', 'boolean', 'Whether voucher is on hold', ARRAY['admin', 'csr']),
  ('escrowVoucher.discretionaryFlag', 'Discretionary Flag', 'escrow', 'boolean', 'Whether voucher is discretionary', ARRAY['admin', 'csr']),
  ('escrowVoucher.paidFlag', 'Paid Flag', 'escrow', 'boolean', 'Whether voucher has been paid', ARRAY['admin', 'csr'])
ON CONFLICT (field_key) DO NOTHING;

-- Add Loan Terms fields (section: loan_terms)
INSERT INTO public.field_dictionary (field_key, label, section, data_type, description, allowed_roles)
VALUES
  ('terms.loanType', 'Loan Type', 'loan_terms', 'text', 'Type of loan', ARRAY['admin', 'csr']),
  ('terms.amortizationType', 'Amortization Type', 'loan_terms', 'text', 'Type of amortization', ARRAY['admin', 'csr']),
  ('terms.rateType', 'Rate Type', 'loan_terms', 'text', 'Type of interest rate', ARRAY['admin', 'csr']),
  ('terms.negativeAmortizationTarget', 'Negative Amortization Applied To', 'loan_terms', 'text', 'Where negative amortization is applied', ARRAY['admin', 'csr']),
  ('terms.unpaidInterestHandling', 'Unpaid Interest Handling', 'loan_terms', 'text', 'How unpaid interest is handled', ARRAY['admin', 'csr']),
  ('terms.interestAccrualMethod', 'Periodic Interest Accrual Method', 'loan_terms', 'text', 'Method for periodic interest accrual', ARRAY['admin', 'csr']),
  ('terms.dailyRateBasis', 'Daily Rate Calculation Basis', 'loan_terms', 'text', 'Basis for daily rate calculation', ARRAY['admin', 'csr']),
  ('terms.dayCountMethod', 'Days Between Dates Calculation', 'loan_terms', 'text', 'Method for calculating days between dates', ARRAY['admin', 'csr'])
ON CONFLICT (field_key) DO NOTHING;

-- Add Funding fields (section: other)
INSERT INTO public.field_dictionary (field_key, label, section, data_type, description, allowed_roles)
VALUES
  ('funding.loanAccountNumber', 'Loan Account Number', 'other', 'text', 'Loan account number for funding', ARRAY['admin', 'csr']),
  ('funding.borrowerName', 'Borrower Name', 'other', 'text', 'Borrower name for funding', ARRAY['admin', 'csr']),
  ('funding.borrowerAddress', 'Borrower Address', 'other', 'text', 'Borrower address for funding', ARRAY['admin', 'csr']),
  ('funding.principalBalance', 'Principal Balance', 'other', 'currency', 'Principal balance at funding', ARRAY['admin', 'csr']),
  ('funding.fundingDate', 'Funding Date', 'other', 'date', 'Date of loan funding', ARRAY['admin', 'csr']),
  ('funding.reference', 'Reference', 'other', 'text', 'Funding reference number', ARRAY['admin', 'csr']),
  ('funding.fundingAmount', 'Funding Amount', 'other', 'currency', 'Total funding amount', ARRAY['admin', 'csr']),
  ('funding.notes', 'Notes', 'other', 'text', 'Funding notes', ARRAY['admin', 'csr'])
ON CONFLICT (field_key) DO NOTHING;

-- Add Lender Information fields (section: other)
INSERT INTO public.field_dictionary (field_key, label, section, data_type, description, allowed_roles)
VALUES
  ('lender.account', 'Lender Account', 'other', 'text', 'Lender account identifier', ARRAY['admin', 'csr']),
  ('lender.nameAddress', 'Lender Name & Address', 'other', 'text', 'Lender name and address', ARRAY['admin', 'csr']),
  ('lender.roundingAdjustmentFlag', 'Rounding Adjustment', 'other', 'boolean', 'Whether rounding adjustment is enabled', ARRAY['admin', 'csr']),
  ('lender.noteRate', 'Note Rate', 'other', 'percentage', 'Lender note rate', ARRAY['admin', 'csr']),
  ('lender.soldRate', 'Sold Rate', 'other', 'percentage', 'Lender sold rate', ARRAY['admin', 'csr']),
  ('lender.rateModifier', 'Rate Modifier', 'other', 'percentage', 'Lender rate modifier', ARRAY['admin', 'csr']),
  ('lender.fixedRate', 'Fixed Rate', 'other', 'percentage', 'Lender fixed rate', ARRAY['admin', 'csr']),
  ('lender.effectiveRate', 'Lender Rate', 'other', 'percentage', 'Effective lender rate', ARRAY['admin', 'csr'])
ON CONFLICT (field_key) DO NOTHING;

-- Add Lender Servicing Fees fields (section: other)
INSERT INTO public.field_dictionary (field_key, label, section, data_type, description, allowed_roles)
VALUES
  ('lender.brokerServicingFee.enabled', 'Broker Servicing Fee Enabled', 'other', 'boolean', 'Whether broker servicing fee is enabled', ARRAY['admin', 'csr']),
  ('lender.brokerServicingFee.percentOfPrincipal', 'Broker Fee Percent of Principal', 'other', 'percentage', 'Broker fee as percent of principal', ARRAY['admin', 'csr']),
  ('lender.brokerServicingFee.plusAmount', 'Broker Fee Plus Amount', 'other', 'currency', 'Additional broker fee amount', ARRAY['admin', 'csr']),
  ('lender.brokerServicingFee.minimumAmount', 'Broker Fee Minimum Amount', 'other', 'currency', 'Minimum broker fee amount', ARRAY['admin', 'csr']),
  ('lender.vendorServicingFee.enabled', 'Vendor Servicing Fee Enabled', 'other', 'boolean', 'Whether vendor servicing fee is enabled', ARRAY['admin', 'csr']),
  ('lender.vendorServicingFee.percentOfPrincipal', 'Vendor Fee Percent of Principal', 'other', 'percentage', 'Vendor fee as percent of principal', ARRAY['admin', 'csr']),
  ('lender.vendorServicingFee.plusAmount', 'Vendor Fee Plus Amount', 'other', 'currency', 'Additional vendor fee amount', ARRAY['admin', 'csr']),
  ('lender.vendorServicingFee.minimumAmount', 'Vendor Fee Minimum Amount', 'other', 'currency', 'Minimum vendor fee amount', ARRAY['admin', 'csr']),
  ('lender.vendorAccount', 'Vendor Account', 'other', 'text', 'Vendor account identifier', ARRAY['admin', 'csr'])
ON CONFLICT (field_key) DO NOTHING;