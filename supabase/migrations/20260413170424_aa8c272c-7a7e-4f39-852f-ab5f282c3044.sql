INSERT INTO public.field_dictionary (field_key, label, section, data_type, form_type, description)
VALUES ('pr_p_infoProvidedBy', 'Information Provided By', 'property', 'dropdown', 'primary', 'Source of property information - Broker, Borrower, Third Party, or Other')
ON CONFLICT DO NOTHING;