
CREATE TABLE public.user_form_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  form_key text NOT NULL,
  access_mode text NOT NULL DEFAULT 'view_only',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, form_key)
);

ALTER TABLE public.user_form_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage user form permissions" ON public.user_form_permissions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own form permissions" ON public.user_form_permissions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
