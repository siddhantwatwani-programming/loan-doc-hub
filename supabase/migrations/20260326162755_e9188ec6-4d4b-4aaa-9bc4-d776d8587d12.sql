INSERT INTO field_dictionary (field_key, label, section, data_type, canonical_key, form_type)
VALUES
  ('li_pp_lienPriorityNow', 'Lien Priority Now', 'liens', 'text', 'li_pp_lienPriorityNow', 'primary'),
  ('li_pp_lienPriorityAfter', 'Lien Priority After', 'liens', 'text', 'li_pp_lienPriorityAfter', 'primary')
ON CONFLICT (field_key) DO NOTHING;