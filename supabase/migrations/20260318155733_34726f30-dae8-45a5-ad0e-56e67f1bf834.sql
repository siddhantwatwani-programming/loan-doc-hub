
-- Update existing lien fields to use the new 'liens' section
UPDATE public.field_dictionary 
SET section = 'liens', form_type = 'general_details'
WHERE field_key IN ('pr_li_lienProper', 'pr_li_lienHolder', 'pr_li_lienHolder2', 'pr_li_lienHolder3', 'pr_li_lienAccoun2', 'pr_li_lienContac', 'pr_li_lienPhone', 'pr_li_lienPrioriNow', 'pr_li_lienPrioriAfter');

UPDATE public.field_dictionary 
SET section = 'liens', form_type = 'general_details', data_type = 'dropdown'
WHERE field_key = 'pr_li_lienProper';

UPDATE public.field_dictionary 
SET section = 'liens', form_type = 'general_details', data_type = 'number'
WHERE field_key IN ('pr_li_lienPrioriNow', 'pr_li_lienPrioriAfter');

-- Update balance/payment fields
UPDATE public.field_dictionary 
SET section = 'liens', form_type = 'balance_payment'
WHERE field_key IN ('pr_li_lienOriginBalanc2', 'pr_li_lienCurrenBalanc2', 'pr_li_lienRegulaPaymen2');

-- Update tracking field
UPDATE public.field_dictionary 
SET section = 'liens', form_type = 'recording_tracking'
WHERE field_key = 'pr_li_seniorLienTracki';

-- Update label for Related Property
UPDATE public.field_dictionary SET label = 'Related Property' WHERE field_key = 'pr_li_lienProper';
UPDATE public.field_dictionary SET label = 'Lien Priority Now' WHERE field_key = 'pr_li_lienPrioriNow';
UPDATE public.field_dictionary SET label = 'Lien Priority After' WHERE field_key = 'pr_li_lienPrioriAfter';
UPDATE public.field_dictionary SET label = 'Account Number' WHERE field_key = 'pr_li_lienAccoun2';
UPDATE public.field_dictionary SET label = 'Contact' WHERE field_key = 'pr_li_lienContac';
UPDATE public.field_dictionary SET label = 'Phone' WHERE field_key = 'pr_li_lienPhone';
UPDATE public.field_dictionary SET label = 'Lien Holder' WHERE field_key = 'pr_li_lienHolder';
UPDATE public.field_dictionary SET label = 'Original Balance' WHERE field_key = 'pr_li_lienOriginBalanc2';
UPDATE public.field_dictionary SET label = 'Current Balance' WHERE field_key = 'pr_li_lienCurrenBalanc2';
UPDATE public.field_dictionary SET label = 'Regular Payment' WHERE field_key = 'pr_li_lienRegulaPaymen2';

-- Insert missing fields

-- General Details
INSERT INTO public.field_dictionary (field_key, label, section, data_type, form_type, is_calculated, is_repeatable)
VALUES
  ('li_gd_thisLoan', 'This Loan', 'liens', 'boolean', 'general_details', false, false),
  ('li_gd_fax', 'Fax', 'liens', 'text', 'general_details', false, false),
  ('li_gd_email', 'Email', 'liens', 'text', 'general_details', false, false),
  ('li_gd_interestRate', 'Interest Rate', 'liens', 'percentage', 'general_details', false, false),
  ('li_gd_maturityDate', 'Maturity Date', 'liens', 'date', 'general_details', false, false);

-- Loan Type
INSERT INTO public.field_dictionary (field_key, label, section, data_type, form_type, is_calculated, is_repeatable)
VALUES
  ('li_lt_loanType', 'Loan Type', 'liens', 'text', 'loan_type', false, false);

-- Balance & Payment
INSERT INTO public.field_dictionary (field_key, label, section, data_type, form_type, is_calculated, is_repeatable)
VALUES
  ('li_bp_balanceAfter', 'Balance After', 'liens', 'currency', 'balance_payment', false, false);

-- Recording & Tracking
INSERT INTO public.field_dictionary (field_key, label, section, data_type, form_type, is_calculated, is_repeatable)
VALUES
  ('li_rt_recordingNumber', 'Recording Number', 'liens', 'text', 'recording_tracking', false, false),
  ('li_rt_recordingDate', 'Recording Date', 'liens', 'date', 'recording_tracking', false, false);
