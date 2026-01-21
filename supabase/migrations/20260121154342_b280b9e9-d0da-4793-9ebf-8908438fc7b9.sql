-- Add new data types to field_data_type enum
ALTER TYPE field_data_type ADD VALUE IF NOT EXISTS 'section';
ALTER TYPE field_data_type ADD VALUE IF NOT EXISTS 'template';
ALTER TYPE field_data_type ADD VALUE IF NOT EXISTS 'decimal';