UPDATE public.field_dictionary
SET validation_rule = '{"options":[{"value":"Original","label":"Original"},{"value":"Unpaid","label":"Unpaid"}]}',
    updated_at = now()
WHERE field_key = 'ln_pn_principalPaydownType';