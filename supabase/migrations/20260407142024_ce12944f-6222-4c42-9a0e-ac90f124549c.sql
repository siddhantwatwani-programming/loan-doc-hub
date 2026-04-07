INSERT INTO public.field_dictionary (field_key, label, section, data_type, is_repeatable)
VALUES
  ('lien1.source_of_information', 'Source of Information', 'liens', 'text', true),
  ('liens.answer_10a', 'Answer 10A', 'liens', 'text', false)
ON CONFLICT DO NOTHING;