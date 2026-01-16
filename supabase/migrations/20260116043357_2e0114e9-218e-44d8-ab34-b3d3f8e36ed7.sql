-- Create storage bucket for template DOCX files
INSERT INTO storage.buckets (id, name, public)
VALUES ('templates', 'templates', false);

-- Storage policies for templates bucket
CREATE POLICY "Admins can upload templates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'templates' 
    AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update templates"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'templates' 
    AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete templates"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'templates' 
    AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Authenticated users can view templates"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'templates');

-- System settings table for configuration
CREATE TABLE public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type TEXT NOT NULL DEFAULT 'text',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view system settings"
ON public.system_settings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert system settings"
ON public.system_settings FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update system settings"
ON public.system_settings FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete system settings"
ON public.system_settings FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default system settings
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description)
VALUES 
    ('magic_link_expiry_minutes', '60', 'number', 'Magic link expiration time in minutes'),
    ('default_state', 'CA', 'text', 'Default state for new deals'),
    ('company_name', 'Del Toro Loan Servicing, Inc.', 'text', 'Company name displayed in documents');