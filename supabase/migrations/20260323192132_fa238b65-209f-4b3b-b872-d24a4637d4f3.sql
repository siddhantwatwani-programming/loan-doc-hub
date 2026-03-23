
CREATE TABLE public.borrower_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  file_size text,
  category text NOT NULL DEFAULT 'Miscellaneous',
  description text,
  uploaded_by uuid NOT NULL,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  version_number integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'active'
);

ALTER TABLE public.borrower_attachments ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_borrower_attachments_contact_id ON public.borrower_attachments(contact_id);

CREATE POLICY "CSRs and Admins can manage borrower attachments"
  ON public.borrower_attachments FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'csr'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'csr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "External users can view borrower attachments"
  ON public.borrower_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contacts c
      JOIN public.deal_participants dp ON dp.contact_id = c.id
      JOIN public.deal_assignments da ON da.deal_id = dp.deal_id AND da.user_id = auth.uid()
      WHERE c.id = borrower_attachments.contact_id
    )
  );
