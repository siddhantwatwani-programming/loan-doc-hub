-- Phase 2: Field Key Standardization
-- Add canonical_key column to field_dictionary for key normalization

-- 1. Add canonical_key column to field_dictionary
ALTER TABLE public.field_dictionary
ADD COLUMN IF NOT EXISTS canonical_key TEXT;

-- 2. Create index for canonical_key lookups
CREATE INDEX IF NOT EXISTS idx_field_dictionary_canonical_key 
ON public.field_dictionary (canonical_key) 
WHERE canonical_key IS NOT NULL;

-- 3. Create field_key_migrations table to track key transitions
CREATE TABLE IF NOT EXISTS public.field_key_migrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_key TEXT NOT NULL,
  new_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'migrated', 'deprecated', 'rollback')),
  migrated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (old_key, new_key)
);

-- 4. Enable RLS on field_key_migrations
ALTER TABLE public.field_key_migrations ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for field_key_migrations (admin-only write, authenticated read)
CREATE POLICY "Anyone authenticated can view field key migrations"
ON public.field_key_migrations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert field key migrations"
ON public.field_key_migrations
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update field key migrations"
ON public.field_key_migrations
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete field key migrations"
ON public.field_key_migrations
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. Create trigger for updated_at
CREATE TRIGGER update_field_key_migrations_updated_at
BEFORE UPDATE ON public.field_key_migrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Initialize canonical_key from field_key (lowercase, normalized)
UPDATE public.field_dictionary
SET canonical_key = LOWER(REGEXP_REPLACE(field_key, '[^a-zA-Z0-9._]', '_', 'g'))
WHERE canonical_key IS NULL;

-- 8. Create helper function to resolve canonical keys
CREATE OR REPLACE FUNCTION public.resolve_canonical_key(p_field_key TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    -- First check if there's a migration for this key
    (SELECT new_key FROM public.field_key_migrations WHERE old_key = p_field_key AND status = 'migrated' LIMIT 1),
    -- Then check for canonical_key in dictionary
    (SELECT canonical_key FROM public.field_dictionary WHERE field_key = p_field_key LIMIT 1),
    -- Fall back to normalized input
    LOWER(REGEXP_REPLACE(p_field_key, '[^a-zA-Z0-9._]', '_', 'g'))
  )
$$;