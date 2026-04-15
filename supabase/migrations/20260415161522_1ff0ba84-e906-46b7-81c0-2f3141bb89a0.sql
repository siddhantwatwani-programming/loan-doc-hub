INSERT INTO public.field_dictionary (field_key, label, section, data_type)
SELECT v.field_key, v.label, 'notes'::public.field_section, v.data_type::public.field_data_type
FROM (
  VALUES
    ('nt_p_followupReminder', 'Followup Reminder', 'date'),
    ('nt_p_completed', 'Completed', 'date'),
    ('nt_p_assignedOn', 'Assigned on', 'date'),
    ('nt_p_assignedTo', 'Assigned to', 'text'),
    ('nt_p_assignedDept', 'Department', 'text'),
    ('nt_p_assignedBy', 'By', 'text'),
    ('nt_p_completedBy', 'Completed By', 'text'),
    ('nt_p_completedOn', 'Completed on', 'date'),
    ('nt_p_publish', 'Publish', 'boolean'),
    ('nt_p_addToParticipants', 'Add to Participants', 'boolean')
) AS v(field_key, label, data_type)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.field_dictionary fd
  WHERE fd.field_key = v.field_key
);