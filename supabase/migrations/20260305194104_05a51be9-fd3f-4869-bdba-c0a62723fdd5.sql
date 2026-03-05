
-- Table to store permission level assignments for CSR users
CREATE TABLE public.user_permission_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  permission_level text NOT NULL DEFAULT 'full',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_permission_level CHECK (permission_level IN ('full', 'limited', 'view_only'))
);

CREATE INDEX idx_user_permission_levels_user ON public.user_permission_levels(user_id);

ALTER TABLE public.user_permission_levels ENABLE ROW LEVEL SECURITY;

-- Only admins can manage permission levels
CREATE POLICY "Admins can view permission levels" ON public.user_permission_levels
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert permission levels" ON public.user_permission_levels
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update permission levels" ON public.user_permission_levels
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete permission levels" ON public.user_permission_levels
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- CSR users can read their own permission level
CREATE POLICY "Users can view own permission level" ON public.user_permission_levels
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Add permission_level column to form_permissions for CSR sub-level configuration
ALTER TABLE public.form_permissions ADD COLUMN permission_level text DEFAULT NULL;

-- Create a security definer function to get a user's permission level
CREATE OR REPLACE FUNCTION public.get_user_permission_level(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT permission_level FROM public.user_permission_levels WHERE user_id = _user_id),
    'full'
  )
$$;
