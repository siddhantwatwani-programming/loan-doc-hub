
-- Add missing columns to loan_history
ALTER TABLE public.loan_history
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS next_due_date date,
  ADD COLUMN IF NOT EXISTS servicing_fees numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS other_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS principal_balance numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS account_number text;

-- Create loan_history_lenders table
CREATE TABLE public.loan_history_lenders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_history_id uuid NOT NULL REFERENCES public.loan_history(id) ON DELETE CASCADE,
  lender_name text NOT NULL,
  percentage numeric DEFAULT 0,
  release_date date,
  status text DEFAULT 'Pending',
  principal_balance numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loan_history_lenders ENABLE ROW LEVEL SECURITY;

-- CSRs and Admins can do everything
CREATE POLICY "CSRs and Admins can view loan history lenders"
ON public.loan_history_lenders FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'csr'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "CSRs and Admins can insert loan history lenders"
ON public.loan_history_lenders FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'csr'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "CSRs and Admins can update loan history lenders"
ON public.loan_history_lenders FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'csr'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "CSRs and Admins can delete loan history lenders"
ON public.loan_history_lenders FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'csr'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);

-- External users can view via deal access
CREATE POLICY "External users can view loan history lenders for accessible deals"
ON public.loan_history_lenders FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.loan_history lh
    WHERE lh.id = loan_history_lenders.loan_history_id
      AND has_deal_access(auth.uid(), lh.deal_id)
  )
);

-- Index for fast lookups
CREATE INDEX idx_loan_history_lenders_loan_history_id ON public.loan_history_lenders(loan_history_id);
