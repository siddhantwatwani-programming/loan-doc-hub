CREATE OR REPLACE FUNCTION public.assign_user_role_and_permission(
  p_user_id uuid,
  p_role public.app_role,
  p_permission_level text DEFAULT 'full'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Keep single internal role per user and make operation idempotent
  DELETE FROM public.user_roles
  WHERE user_id = p_user_id;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id, role) DO UPDATE
  SET role = EXCLUDED.role;

  IF p_role = 'csr' THEN
    INSERT INTO public.user_permission_levels (user_id, permission_level)
    VALUES (p_user_id, COALESCE(p_permission_level, 'full'))
    ON CONFLICT (user_id) DO UPDATE
    SET permission_level = EXCLUDED.permission_level,
        updated_at = now();
  ELSE
    DELETE FROM public.user_permission_levels
    WHERE user_id = p_user_id;
  END IF;
END;
$$;