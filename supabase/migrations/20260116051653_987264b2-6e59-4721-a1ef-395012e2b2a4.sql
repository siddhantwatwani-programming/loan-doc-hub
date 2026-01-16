-- Add calculation formula attributes to field_dictionary
ALTER TABLE public.field_dictionary
ADD COLUMN calculation_formula text DEFAULT NULL,
ADD COLUMN calculation_dependencies text[] DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.field_dictionary.calculation_formula IS 'Formula expression for calculated fields (e.g., "{first_payment_date} + {term_months} months")';
COMMENT ON COLUMN public.field_dictionary.calculation_dependencies IS 'Array of field_keys this calculated field depends on';