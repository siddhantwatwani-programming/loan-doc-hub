-- Create generated-docs bucket for output files
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-docs', 'generated-docs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for generated-docs bucket
CREATE POLICY "CSRs can upload generated documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'generated-docs' 
  AND (
    (SELECT has_role(auth.uid(), 'csr')) 
    OR (SELECT has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Users can view generated documents for their deals"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'generated-docs'
  AND (
    (SELECT has_role(auth.uid(), 'csr'))
    OR (SELECT has_role(auth.uid(), 'admin'))
    OR EXISTS (
      SELECT 1 FROM deal_assignments da
      WHERE da.user_id = auth.uid()
      AND da.deal_id::text = (storage.foldername(name))[1]
    )
  )
);