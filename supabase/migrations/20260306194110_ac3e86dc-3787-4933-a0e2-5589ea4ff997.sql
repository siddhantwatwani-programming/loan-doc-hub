CREATE POLICY "CSRs and Admins can delete event journal"
ON public.event_journal
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'csr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));