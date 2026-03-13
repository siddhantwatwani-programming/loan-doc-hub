
-- Create storage bucket for contact attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('contact-attachments', 'contact-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated CSR/Admin users to upload files
CREATE POLICY "CSRs and Admins can upload contact attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contact-attachments'
  AND (has_role(auth.uid(), 'csr') OR has_role(auth.uid(), 'admin'))
);

-- Allow authenticated CSR/Admin users to view files
CREATE POLICY "CSRs and Admins can view contact attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'contact-attachments'
  AND (has_role(auth.uid(), 'csr') OR has_role(auth.uid(), 'admin'))
);

-- Allow authenticated CSR/Admin users to delete files
CREATE POLICY "CSRs and Admins can delete contact attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'contact-attachments'
  AND (has_role(auth.uid(), 'csr') OR has_role(auth.uid(), 'admin'))
);
