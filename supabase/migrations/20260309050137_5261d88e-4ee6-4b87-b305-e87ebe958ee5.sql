
ALTER TABLE public.field_dictionary ADD COLUMN IF NOT EXISTS form_type text DEFAULT 'primary';
ALTER TABLE public.field_dictionary ADD COLUMN IF NOT EXISTS is_mandatory boolean DEFAULT false;
