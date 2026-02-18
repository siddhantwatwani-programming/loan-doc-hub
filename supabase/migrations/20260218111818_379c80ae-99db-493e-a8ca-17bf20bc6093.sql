
-- Add denormalized snapshot columns for history stability
ALTER TABLE public.generated_documents
  ADD COLUMN IF NOT EXISTS template_name text,
  ADD COLUMN IF NOT EXISTS packet_name text,
  ADD COLUMN IF NOT EXISTS generation_batch_id uuid;

-- Backfill existing template_name from templates table
UPDATE public.generated_documents gd
SET template_name = t.name
FROM public.templates t
WHERE gd.template_id = t.id AND gd.template_name IS NULL;

-- Backfill existing packet_name from packets table
UPDATE public.generated_documents gd
SET packet_name = p.name
FROM public.packets p
WHERE gd.packet_id = p.id AND gd.packet_name IS NULL;

-- Index for batch grouping queries
CREATE INDEX IF NOT EXISTS idx_generated_documents_batch_id 
  ON public.generated_documents(generation_batch_id) 
  WHERE generation_batch_id IS NOT NULL;
