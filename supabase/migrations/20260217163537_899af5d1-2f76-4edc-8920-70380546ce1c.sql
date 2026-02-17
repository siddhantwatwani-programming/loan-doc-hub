-- Remove Tax ID Type, TIN, and duplicate Home phone fields from Borrower and Co-Borrower
DELETE FROM public.field_dictionary WHERE field_key IN (
  'borrower.tax_id_type',
  'borrower.tax_id',
  'borrower.phone.home2',
  'borrower.preferred.home2',
  'coborrower.tax_id_type',
  'coborrower.tin',
  'coborrower.phone.home2',
  'coborrower.preferred.home2'
);