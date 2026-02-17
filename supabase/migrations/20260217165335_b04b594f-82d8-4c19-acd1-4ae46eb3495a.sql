-- Remove duplicate/unnecessary field_dictionary entries for Tax ID Type, TIN, and duplicate Home phone fields
DELETE FROM public.field_dictionary WHERE field_key IN (
  'borrower.tax_id_type',
  'borrower.tax_id',
  'borrower.phone.home2',
  'borrower.preferred.home2',
  'coborrower.tax_id_type',
  'coborrower.tax_id',
  'coborrower.phone.home2',
  'coborrower.preferred.home2'
);