-- Add additional profile columns for Users directory
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS license_number TEXT,
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'internal' 
  CHECK (user_type IN ('internal', 'borrower', 'broker', 'lender'));

-- Create index for user_type filtering
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);

-- Update RLS policies to allow CSR to view and edit profiles
DROP POLICY IF EXISTS "CSR can view all profiles" ON public.profiles;
CREATE POLICY "CSR can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  public.has_role(auth.uid(), 'csr') 
  OR public.has_role(auth.uid(), 'admin')
  OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "CSR can update profiles" ON public.profiles;
CREATE POLICY "CSR can update profiles" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (
  public.has_role(auth.uid(), 'csr') 
  OR public.has_role(auth.uid(), 'admin')
  OR user_id = auth.uid()
)
WITH CHECK (
  public.has_role(auth.uid(), 'csr') 
  OR public.has_role(auth.uid(), 'admin')
  OR user_id = auth.uid()
);

-- Add unique constraint for deal_field_values to support upsert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'deal_field_values_deal_id_field_key_key'
  ) THEN
    ALTER TABLE public.deal_field_values 
    ADD CONSTRAINT deal_field_values_deal_id_field_key_key 
    UNIQUE (deal_id, field_key);
  END IF;
END $$;