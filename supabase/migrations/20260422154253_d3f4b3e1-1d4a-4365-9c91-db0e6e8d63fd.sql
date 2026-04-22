UPDATE public.generated_documents
   SET generation_status = 'failed',
       error_message = 'Regenerate — file failed XML integrity (Word reported "could not open"). Fixed in latest deploy.'
 WHERE id IN (
   'af6f90d8-4e3c-4f9e-87b5-01ae56843684',
   '6ccbf5bf-c220-4471-84a1-8b3142f2c172',
   '0a572917-5b15-4786-82e5-1559a60bf690'
 );