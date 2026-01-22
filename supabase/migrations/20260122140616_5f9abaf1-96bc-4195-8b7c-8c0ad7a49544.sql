-- Update System.DocumentDate to be in the 'dates' section so it shows in the Date tab
-- Also update to mark it as required (is_required doesn't exist, requirement is determined by template_field_maps.required_flag)
UPDATE public.field_dictionary 
SET section = 'dates', 
    label = 'Document Date',
    description = 'Date to be displayed on generated documents. This field is mandatory.'
WHERE field_key = 'System.DocumentDate';