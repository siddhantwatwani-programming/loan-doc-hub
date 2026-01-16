-- Create deal_assignments table for external user access
CREATE TABLE public.deal_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  UNIQUE(deal_id, user_id)
);

-- Create field_permissions table for role-based field access
CREATE TABLE public.field_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role app_role NOT NULL,
  field_key TEXT NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role, field_key)
);

-- Enable RLS
ALTER TABLE public.deal_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_permissions ENABLE ROW LEVEL SECURITY;

-- Deal assignments policies
CREATE POLICY "CSRs and Admins can view all deal assignments"
  ON public.deal_assignments FOR SELECT
  USING (has_role(auth.uid(), 'csr') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "CSRs and Admins can manage deal assignments"
  ON public.deal_assignments FOR INSERT
  WITH CHECK (
    (has_role(auth.uid(), 'csr') OR has_role(auth.uid(), 'admin'))
    AND auth.uid() = assigned_by
  );

CREATE POLICY "CSRs and Admins can update deal assignments"
  ON public.deal_assignments FOR UPDATE
  USING (has_role(auth.uid(), 'csr') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "CSRs and Admins can delete deal assignments"
  ON public.deal_assignments FOR DELETE
  USING (has_role(auth.uid(), 'csr') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "External users can view their own assignments"
  ON public.deal_assignments FOR SELECT
  USING (auth.uid() = user_id);

-- Field permissions policies (admin managed, all authenticated can read)
CREATE POLICY "Anyone authenticated can view field permissions"
  ON public.field_permissions FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage field permissions"
  ON public.field_permissions FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Create helper function to check if user has access to a deal
CREATE OR REPLACE FUNCTION public.has_deal_access(_user_id uuid, _deal_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- CSR and Admin have full access
    has_role(_user_id, 'csr') OR has_role(_user_id, 'admin')
    OR
    -- External users need explicit assignment
    EXISTS (
      SELECT 1
      FROM public.deal_assignments
      WHERE deal_id = _deal_id AND user_id = _user_id
    )
$$;

-- Create helper function to check if user can view a field
CREATE OR REPLACE FUNCTION public.can_view_field(_user_id uuid, _field_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- CSR and Admin have full access
    has_role(_user_id, 'csr') OR has_role(_user_id, 'admin')
    OR
    -- Check field permissions for user's role
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.field_permissions fp ON fp.role = ur.role
      WHERE ur.user_id = _user_id 
        AND fp.field_key = _field_key 
        AND fp.can_view = true
    )
$$;

-- Create helper function to check if user can edit a field
CREATE OR REPLACE FUNCTION public.can_edit_field(_user_id uuid, _field_key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- CSR and Admin have full access
    has_role(_user_id, 'csr') OR has_role(_user_id, 'admin')
    OR
    -- Check field permissions for user's role
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.field_permissions fp ON fp.role = ur.role
      WHERE ur.user_id = _user_id 
        AND fp.field_key = _field_key 
        AND fp.can_edit = true
    )
$$;

-- Create helper function to check if role is external
CREATE OR REPLACE FUNCTION public.is_external_role(_role app_role)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT _role IN ('borrower', 'broker', 'lender')
$$;

-- Update deals RLS to include external user access
DROP POLICY IF EXISTS "CSRs can view all deals" ON public.deals;
CREATE POLICY "Users can view accessible deals"
  ON public.deals FOR SELECT
  USING (has_deal_access(auth.uid(), id));

-- Update deal_field_values RLS for external users
DROP POLICY IF EXISTS "CSRs can view deal field values" ON public.deal_field_values;
CREATE POLICY "Users can view accessible deal field values"
  ON public.deal_field_values FOR SELECT
  USING (
    has_deal_access(auth.uid(), deal_id) 
    AND can_view_field(auth.uid(), field_key)
  );

-- Update generated_documents RLS for external users  
DROP POLICY IF EXISTS "CSRs can view generated documents" ON public.generated_documents;
CREATE POLICY "Users can view accessible generated documents"
  ON public.generated_documents FOR SELECT
  USING (has_deal_access(auth.uid(), deal_id));

-- Trigger for field_permissions updated_at
CREATE TRIGGER update_field_permissions_updated_at
  BEFORE UPDATE ON public.field_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();