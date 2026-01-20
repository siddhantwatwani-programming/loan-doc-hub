
-- Insert new fields into field_dictionary (skip if already exists)
INSERT INTO public.field_dictionary (field_key, label, section, data_type, description)
VALUES
  -- Section: Lender Information (mapped to 'other')
  ('lender.account', 'Account', 'other', 'text', 'Lender account lookup'),
  ('lender.roundingAdjustment', 'Rounding Adjustment', 'other', 'boolean', 'Enable rounding adjustment'),
  ('lender.nameAddress', 'Lender Name & Address', 'other', 'text', 'Lender name and address (multiline)'),

  -- Section: Lender Rate (mapped to 'loan_terms')
  ('lenderRate.noteRate', 'Note Rate', 'loan_terms', 'percentage', 'Note rate percentage'),
  ('lenderRate.soldRate', 'Sold Rate', 'loan_terms', 'percentage', 'Sold rate percentage'),
  ('lenderRate.rateModifier', 'Rate Modifier', 'loan_terms', 'percentage', 'Rate modifier percentage'),
  ('lenderRate.fixedRate', 'Fixed Rate', 'loan_terms', 'percentage', 'Fixed rate percentage'),
  ('lenderRate.effectiveRate', 'Lender Rate', 'loan_terms', 'percentage', 'Effective lender rate'),

  -- Section: Terms → Loan, Amortization & Rate Type (mapped to 'loan_terms')
  ('loan.loanType', 'Loan Type', 'loan_terms', 'text', 'Type of loan'),
  ('loan.amortizationType', 'Amortization Type', 'loan_terms', 'text', 'Amortization type'),
  ('loan.rateType', 'Rate Type', 'loan_terms', 'text', 'Interest rate type'),

  -- Section: Terms → Negative Amortization / Interest (mapped to 'loan_terms')
  ('interest.negativeAmortizationTarget', 'Add Negative Amortization To', 'loan_terms', 'text', 'Target for negative amortization'),
  ('interest.includeUnpaidInterest', 'Include when Calculating Interest', 'loan_terms', 'boolean', 'Include unpaid interest in calculations'),
  ('interest.autoPayUnpaidInterest', 'Pay Automatically', 'loan_terms', 'boolean', 'Auto-pay unpaid interest'),

  -- Section: Terms → Periodic Interest Accrual Method (mapped to 'loan_terms')
  ('interest.accrualMethod', 'Periodic Interest Accrual Method', 'loan_terms', 'text', 'Interest accrual method'),
  ('interest.dailyRateBasis', 'Calculate Daily Rate Using', 'loan_terms', 'text', 'Daily rate calculation basis'),
  ('interest.dayCountBasis', 'Calculate Days Between Dates Using', 'loan_terms', 'text', 'Day count convention'),

  -- Section: Escrow Vouchers → New Escrow Voucher (mapped to 'escrow')
  ('escrow.payee', 'Payee', 'escrow', 'text', 'Escrow payee lookup'),
  ('escrow.date', 'Date', 'escrow', 'date', 'Escrow voucher date'),
  ('escrow.amount', 'Amount', 'escrow', 'currency', 'Escrow amount'),
  ('escrow.frequency', 'Frequency', 'escrow', 'text', 'Payment frequency'),
  ('escrow.type', 'Type', 'escrow', 'text', 'Escrow voucher type'),
  ('escrow.reference', 'Ref', 'escrow', 'text', 'Reference number'),
  ('escrow.memo', 'Memo', 'escrow', 'text', 'Escrow memo'),
  ('escrow.hold', 'Hold', 'escrow', 'boolean', 'Hold escrow'),
  ('escrow.discretionary', 'Discretionary', 'escrow', 'boolean', 'Discretionary escrow'),
  ('escrow.paid', 'Paid', 'escrow', 'boolean', 'Escrow paid status'),

  -- Section: Funding (mapped to 'other')
  ('funding.account', 'Account', 'other', 'text', 'Funding account lookup'),
  ('funding.principalBalance', 'Principal Balance', 'other', 'currency', 'Principal balance for funding'),
  ('funding.date', 'Funding Date', 'other', 'date', 'Date of funding'),
  ('funding.reference', 'Reference', 'other', 'text', 'Funding reference'),
  ('funding.amount', 'Funding Amount', 'other', 'currency', 'Amount funded'),
  ('funding.notes', 'Notes', 'other', 'text', 'Funding notes'),

  -- Section: Escrow Vouchers → Edit Escrow Voucher (Impound Disbursement) (mapped to 'escrow')
  ('impound.authorityName', 'Payee', 'escrow', 'text', 'Authority/payee name'),
  ('impound.disbursementDate', 'Date', 'escrow', 'date', 'Disbursement date'),
  ('impound.paymentAmount', 'Amount', 'escrow', 'currency', 'Payment amount'),
  ('impound.paymentFrequency', 'Frequency', 'escrow', 'text', 'Payment frequency'),
  ('impound.authorityType', 'Type', 'escrow', 'text', 'Authority type'),
  ('impound.parcelOrPolicyNumber', 'Ref', 'escrow', 'text', 'Parcel or policy number'),
  ('impound.memo', 'Memo', 'escrow', 'text', 'Impound memo'),
  ('impound.paid', 'Paid', 'escrow', 'boolean', 'Impound paid status'),

  -- Section: Terms → Penalties → Late Charge (mapped to 'loan_terms')
  ('lateCharge.method', 'Late Charge Method', 'loan_terms', 'text', 'Method for calculating late charges'),
  ('lateCharge.graceDays', 'Number of Grace Days', 'loan_terms', 'number', 'Grace period in days'),
  ('lateCharge.graceDaysMethod', 'Grace Days Method', 'loan_terms', 'text', 'How grace days are calculated'),
  ('lateCharge.percentOf', 'Percentage of', 'loan_terms', 'text', 'Base for late charge percentage'),
  ('lateCharge.additionalDailyAmount', 'Additional Daily Amount', 'loan_terms', 'currency', 'Additional daily late charge'),

  -- Section: Terms → Prepayment Penalty (mapped to 'loan_terms')
  ('prepaymentPenalty.enabled', 'Prepayment Penalty', 'loan_terms', 'boolean', 'Enable prepayment penalty'),
  ('prepaymentPenalty.basis', 'Penalty Based On', 'loan_terms', 'text', 'Basis for penalty calculation'),
  ('prepaymentPenalty.expirationDate', 'Prepayment Penalty Expires', 'loan_terms', 'date', 'Penalty expiration date'),
  ('prepaymentPenalty.distributeToLenders', 'Distribute to Lenders', 'loan_terms', 'percentage', 'Lender distribution percentage'),
  ('prepaymentPenalty.distributeToOriginator', 'Distribute to Orig. Vendor', 'loan_terms', 'percentage', 'Originator distribution percentage'),
  ('prepaymentPenalty.distributeToCompany', 'Distribute to Company', 'loan_terms', 'percentage', 'Company distribution percentage')
ON CONFLICT (field_key) DO NOTHING;
