
CREATE TABLE public.loan_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  date_received DATE,
  date_due DATE,
  reference TEXT,
  payment_code TEXT,
  total_amount_received NUMERIC DEFAULT 0,
  applied_to_interest NUMERIC DEFAULT 0,
  applied_to_principal NUMERIC DEFAULT 0,
  applied_to_late_charges NUMERIC DEFAULT 0,
  applied_to_reserve NUMERIC DEFAULT 0,
  applied_to_impound NUMERIC DEFAULT 0,
  prepayment_penalty NUMERIC DEFAULT 0,
  charges_principal NUMERIC DEFAULT 0,
  charges_interest NUMERIC DEFAULT 0,
  fees_paid_to_broker NUMERIC DEFAULT 0,
  fees_paid_to_lenders NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.loan_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CSRs and Admins can view loan history"
ON public.loan_history FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'csr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CSRs and Admins can insert loan history"
ON public.loan_history FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'csr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CSRs and Admins can update loan history"
ON public.loan_history FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'csr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CSRs and Admins can delete loan history"
ON public.loan_history FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'csr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "External users can view loan history for accessible deals"
ON public.loan_history FOR SELECT
TO authenticated
USING (has_deal_access(auth.uid(), deal_id));

CREATE INDEX idx_loan_history_deal_id ON public.loan_history(deal_id);

CREATE TRIGGER update_loan_history_updated_at
BEFORE UPDATE ON public.loan_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
