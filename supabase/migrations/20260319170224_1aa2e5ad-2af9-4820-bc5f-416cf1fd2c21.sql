
-- Allow authenticated users to upload files to contact-attachments bucket
CREATE POLICY "Authenticated users can upload contact attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'contact-attachments');

-- Allow authenticated users to read/download contact attachments
CREATE POLICY "Authenticated users can read contact attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'contact-attachments');

-- Allow authenticated users to delete their contact attachments
CREATE POLICY "Authenticated users can delete contact attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'contact-attachments');
