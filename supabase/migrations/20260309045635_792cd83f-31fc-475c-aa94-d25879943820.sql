
-- Add new enum values to field_section
ALTER TYPE public.field_section ADD VALUE IF NOT EXISTS 'origination_fees';
ALTER TYPE public.field_section ADD VALUE IF NOT EXISTS 'insurance';
