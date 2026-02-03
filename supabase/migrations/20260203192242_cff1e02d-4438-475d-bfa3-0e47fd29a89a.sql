-- Add missing template field mappings for Assignment (WA) document
-- Maps recording.state and other.country fields to the template

INSERT INTO template_field_maps (template_id, field_dictionary_id, transform_rule, required_flag)
VALUES 
  ('88d08d22-4dd2-47f6-bde3-2d2ed89d6dc2', '3294c774-bbbb-4d3f-bb5d-e7b3fc8c97d0', NULL, false),
  ('88d08d22-4dd2-47f6-bde3-2d2ed89d6dc2', 'b3666e8e-5df6-495c-b3da-949fd89de9e1', NULL, false)
ON CONFLICT DO NOTHING;