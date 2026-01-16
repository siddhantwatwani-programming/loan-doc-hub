-- Add role-based visibility columns to field_dictionary
ALTER TABLE public.field_dictionary
ADD COLUMN allowed_roles text[] DEFAULT ARRAY['admin', 'csr']::text[],
ADD COLUMN read_only_roles text[] DEFAULT ARRAY[]::text[];

-- Add comments for documentation
COMMENT ON COLUMN public.field_dictionary.allowed_roles IS 'Roles that can view and edit this field. CSR and Admin have full access by default.';
COMMENT ON COLUMN public.field_dictionary.read_only_roles IS 'Roles that can view but not edit this field.';

-- Create a function to check if a user can view a field based on allowed_roles/read_only_roles
CREATE OR REPLACE FUNCTION public.can_view_field_v2(_user_id uuid, _field_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- CSR and Admin always have full access
    has_role(_user_id, 'csr') OR has_role(_user_id, 'admin')
    OR
    -- Check if user's role is in allowed_roles or read_only_roles
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.field_dictionary fd ON fd.field_key = _field_key
      WHERE ur.user_id = _user_id 
        AND (ur.role::text = ANY(fd.allowed_roles) OR ur.role::text = ANY(fd.read_only_roles))
    )
$$;

-- Create a function to check if a user can edit a field based on allowed_roles
CREATE OR REPLACE FUNCTION public.can_edit_field_v2(_user_id uuid, _field_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- CSR can edit all non-calculated fields
    (has_role(_user_id, 'csr') AND NOT EXISTS (
      SELECT 1 FROM public.field_dictionary WHERE field_key = _field_key AND is_calculated = true
    ))
    OR
    -- Admin can view all but only edit config (handled at app level, allow view here)
    has_role(_user_id, 'admin')
    OR
    -- External users: Check if user's role is in allowed_roles (not read_only_roles)
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.field_dictionary fd ON fd.field_key = _field_key
      WHERE ur.user_id = _user_id 
        AND ur.role::text = ANY(fd.allowed_roles)
        AND fd.is_calculated = false
    )
$$;