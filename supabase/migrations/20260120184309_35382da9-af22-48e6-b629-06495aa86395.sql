-- Add new field_section enum values for additional CSR tabs
ALTER TYPE field_section ADD VALUE IF NOT EXISTS 'charges';
ALTER TYPE field_section ADD VALUE IF NOT EXISTS 'dates';
ALTER TYPE field_section ADD VALUE IF NOT EXISTS 'participants';
ALTER TYPE field_section ADD VALUE IF NOT EXISTS 'notes';