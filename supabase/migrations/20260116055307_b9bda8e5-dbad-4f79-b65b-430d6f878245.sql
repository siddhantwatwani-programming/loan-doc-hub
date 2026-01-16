-- Create enums for document generation
CREATE TYPE public.output_type AS ENUM ('docx_only', 'docx_and_pdf');
CREATE TYPE public.generation_status AS ENUM ('queued', 'running', 'success', 'failed');
CREATE TYPE public.request_type AS ENUM ('single_doc', 'packet');

-- Create GeneratedDocument table
CREATE TABLE public.generated_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE RESTRICT,
  packet_id UUID REFERENCES public.packets(id) ON DELETE SET NULL,
  output_docx_path TEXT NOT NULL,
  output_pdf_path TEXT,
  output_type public.output_type NOT NULL DEFAULT 'docx_only',
  version_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  generation_status public.generation_status NOT NULL DEFAULT 'queued',
  error_message TEXT
);

-- Create GenerationJob table
CREATE TABLE public.generation_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL,
  request_type public.request_type NOT NULL,
  packet_id UUID REFERENCES public.packets(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
  output_type public.output_type NOT NULL DEFAULT 'docx_only',
  status public.generation_status NOT NULL DEFAULT 'queued',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX idx_generated_documents_deal_id ON public.generated_documents(deal_id);
CREATE INDEX idx_generated_documents_template_id ON public.generated_documents(template_id);
CREATE INDEX idx_generated_documents_deal_template ON public.generated_documents(deal_id, template_id);
CREATE INDEX idx_generation_jobs_deal_id ON public.generation_jobs(deal_id);
CREATE INDEX idx_generation_jobs_status ON public.generation_jobs(status);

-- Function to auto-increment version_number per (deal_id, template_id)
CREATE OR REPLACE FUNCTION public.set_document_version_number()
RETURNS TRIGGER AS $$
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO NEW.version_number
  FROM public.generated_documents
  WHERE deal_id = NEW.deal_id AND template_id = NEW.template_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_generated_document_version
  BEFORE INSERT ON public.generated_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.set_document_version_number();

-- Enable RLS
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for generated_documents
CREATE POLICY "CSRs can view generated documents"
  ON public.generated_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM deals d
      WHERE d.id = generated_documents.deal_id
      AND (has_role(auth.uid(), 'csr') OR has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "CSRs can insert generated documents"
  ON public.generated_documents FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND (has_role(auth.uid(), 'csr') OR has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "CSRs can update generated documents"
  ON public.generated_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM deals d
      WHERE d.id = generated_documents.deal_id
      AND (has_role(auth.uid(), 'csr') OR has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Admins can delete generated documents"
  ON public.generated_documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM deals d
      WHERE d.id = generated_documents.deal_id
      AND has_role(auth.uid(), 'admin')
    )
  );

-- RLS policies for generation_jobs
CREATE POLICY "CSRs can view generation jobs"
  ON public.generation_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM deals d
      WHERE d.id = generation_jobs.deal_id
      AND (has_role(auth.uid(), 'csr') OR has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "CSRs can insert generation jobs"
  ON public.generation_jobs FOR INSERT
  WITH CHECK (
    auth.uid() = requested_by
    AND (has_role(auth.uid(), 'csr') OR has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "CSRs can update generation jobs"
  ON public.generation_jobs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM deals d
      WHERE d.id = generation_jobs.deal_id
      AND (has_role(auth.uid(), 'csr') OR has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Admins can delete generation jobs"
  ON public.generation_jobs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM deals d
      WHERE d.id = generation_jobs.deal_id
      AND has_role(auth.uid(), 'admin')
    )
  );

-- Add 'generated' to deal_status enum
ALTER TYPE public.deal_status ADD VALUE IF NOT EXISTS 'generated';