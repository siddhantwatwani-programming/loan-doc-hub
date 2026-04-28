INSERT INTO public.merge_tag_aliases (tag_name, field_key, tag_type, is_active, description)
VALUES ('pr_pd_estimateValue', 'pr_p_appraiseValue', 'merge_tag', true, 'RE851A: Estimate of Value tag maps to Property Appraised Value (Estimate of Value UI field)')
ON CONFLICT DO NOTHING;