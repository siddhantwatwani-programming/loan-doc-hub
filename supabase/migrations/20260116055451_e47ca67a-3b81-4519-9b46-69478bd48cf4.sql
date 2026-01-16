-- Add reference_pdf_path column to templates
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS reference_pdf_path TEXT;

-- Create a unique constraint for template versioning (name + state + product_type + version)
-- This ensures each version is unique for a given template configuration
CREATE UNIQUE INDEX IF NOT EXISTS idx_templates_version_unique 
ON public.templates(name, state, product_type, version);

-- Update file_path to be conceptually the template_docx_path (no rename needed, just documentation)
-- The file_path column already exists and is used for DOCX files
COMMENT ON COLUMN public.templates.file_path IS 'Path to the template DOCX file in storage (required for document generation)';
COMMENT ON COLUMN public.templates.reference_pdf_path IS 'Optional path to a reference PDF file for preview purposes';

-- Ensure packet_templates only references active templates via application logic
-- (We'll enforce this in the application layer rather than a constraint since it needs to be checked dynamically)