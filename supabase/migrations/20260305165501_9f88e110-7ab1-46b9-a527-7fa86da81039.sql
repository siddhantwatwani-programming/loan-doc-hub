
-- Create form_permissions table
CREATE TABLE public.form_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  form_key text NOT NULL,
  access_mode text NOT NULL DEFAULT 'editable' CHECK (access_mode IN ('editable', 'view_only')),
  screen_visible boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (role, form_key)
);

-- Enable RLS
ALTER TABLE public.form_permissions ENABLE ROW LEVEL SECURITY;

-- Admin can manage
CREATE POLICY "Admins can manage form permissions" ON public.form_permissions
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Anyone authenticated can read
CREATE POLICY "Anyone authenticated can view form permissions" ON public.form_permissions
FOR SELECT TO authenticated
USING (true);

-- Seed default permissions for all roles and forms
INSERT INTO public.form_permissions (role, form_key, access_mode)
SELECT r.role, f.form_key, 'editable'
FROM 
  (VALUES ('admin'::public.app_role), ('csr'::public.app_role), ('borrower'::public.app_role), ('broker'::public.app_role), ('lender'::public.app_role)) AS r(role),
  (VALUES ('borrower'), ('co_borrower'), ('property'), ('loan_terms'), ('lender'), ('broker'), ('charges'), ('notes'), ('insurance'), ('liens'), ('origination'), ('trust_ledger')) AS f(form_key)
ON CONFLICT (role, form_key) DO NOTHING;
