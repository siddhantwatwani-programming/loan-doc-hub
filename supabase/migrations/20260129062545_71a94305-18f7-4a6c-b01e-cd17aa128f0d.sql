-- Make deals table columns nullable with defaults
ALTER TABLE deals ALTER COLUMN state SET DEFAULT 'TBD';
ALTER TABLE deals ALTER COLUMN product_type SET DEFAULT 'TBD';
ALTER TABLE deals ALTER COLUMN state DROP NOT NULL;
ALTER TABLE deals ALTER COLUMN product_type DROP NOT NULL;

-- Make templates table columns nullable with defaults
ALTER TABLE templates ALTER COLUMN state SET DEFAULT 'TBD';
ALTER TABLE templates ALTER COLUMN product_type SET DEFAULT 'TBD';
ALTER TABLE templates ALTER COLUMN state DROP NOT NULL;
ALTER TABLE templates ALTER COLUMN product_type DROP NOT NULL;