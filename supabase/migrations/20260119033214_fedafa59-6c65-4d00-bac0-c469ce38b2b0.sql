-- Add missing sections to the field_section enum for Phase I
ALTER TYPE field_section ADD VALUE IF NOT EXISTS 'broker';
ALTER TYPE field_section ADD VALUE IF NOT EXISTS 'system';