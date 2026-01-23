-- Update template upload policy to allow both admins and CSRs
DROP POLICY IF EXISTS "Admins can upload templates" ON storage.objects;
CREATE POLICY "Admins and CSRs can upload templates" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'templates' 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'csr'::app_role)
  )
);

-- Also update the update and delete policies to allow CSRs
DROP POLICY IF EXISTS "Admins can update templates" ON storage.objects;
CREATE POLICY "Admins and CSRs can update templates" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (
  bucket_id = 'templates' 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'csr'::app_role)
  )
);

DROP POLICY IF EXISTS "Admins can delete templates" ON storage.objects;
CREATE POLICY "Admins and CSRs can delete templates" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (
  bucket_id = 'templates' 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'csr'::app_role)
  )
);