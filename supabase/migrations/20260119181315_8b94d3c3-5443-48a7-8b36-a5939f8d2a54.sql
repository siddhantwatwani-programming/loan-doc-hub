-- Phase 3 (continued): Update RLS policy before dropping field_key column

-- First, create a NEW version of can_view_field that uses field_dictionary_id
-- Using a different name to avoid overloading issues
CREATE OR REPLACE FUNCTION public.can_view_field_by_id(_user_id uuid, _field_dictionary_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    -- CSR and Admin have full access
    has_role(_user_id, 'csr') OR has_role(_user_id, 'admin')
    OR
    -- Check field permissions for user's role by joining to field_dictionary
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.field_dictionary fd ON fd.id = _field_dictionary_id
      JOIN public.field_permissions fp ON fp.role = ur.role AND fp.field_key = fd.field_key
      WHERE ur.user_id = _user_id 
        AND fp.can_view = true
    )
$$;

-- Drop the old RLS policy that references field_key
DROP POLICY IF EXISTS "Users can view accessible deal field values" ON deal_field_values;

-- Create new RLS policy using field_dictionary_id
CREATE POLICY "Users can view accessible deal field values"
ON deal_field_values FOR SELECT
USING (
  has_deal_access(auth.uid(), deal_id) 
  AND can_view_field_by_id(auth.uid(), field_dictionary_id)
);

-- Now drop the field_key column from deal_field_values
ALTER TABLE public.deal_field_values DROP COLUMN field_key;

-- Drop field_key from template_field_maps
ALTER TABLE public.template_field_maps DROP COLUMN field_key;