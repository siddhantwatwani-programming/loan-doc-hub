INSERT INTO field_dictionary (field_key, label, section, data_type, is_calculated, is_repeatable)
VALUES
  ('notes_entry.high_priority', 'High Priority', 'notes', 'boolean', false, true),
  ('notes_entry.date', 'Date', 'notes', 'date', false, true),
  ('notes_entry.account', 'Account', 'notes', 'text', false, true),
  ('notes_entry.name', 'Name', 'notes', 'text', false, true),
  ('notes_entry.reference', 'Reference', 'notes', 'text', false, true),
  ('notes_entry.content', 'Content', 'notes', 'text', false, true)
ON CONFLICT (field_key) DO NOTHING;