-- Fix is_external_role function to have proper search_path
CREATE OR REPLACE FUNCTION public.is_external_role(_role app_role)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT _role IN ('borrower', 'broker', 'lender')
$$;