CREATE OR REPLACE FUNCTION public.can_edit_contact(_user_id uuid, _contact_type text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin'::public.app_role)
    OR (
      public.has_role(_user_id, 'csr'::public.app_role)
      AND EXISTS (
        SELECT 1
        FROM public.user_form_permissions ufp
        WHERE ufp.user_id = _user_id
          AND ufp.form_key = _contact_type
          AND ufp.access_mode = 'editable'
      )
    )
$$;

DROP POLICY IF EXISTS "CSRs and Admins can update contacts" ON public.contacts;

CREATE POLICY "CSRs and Admins can update contacts"
ON public.contacts
FOR UPDATE
TO authenticated
USING (public.can_edit_contact(auth.uid(), contact_type))
WITH CHECK (public.can_edit_contact(auth.uid(), contact_type));