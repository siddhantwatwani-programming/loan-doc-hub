-- Create the new consolidated table for section-based field values
CREATE TABLE deal_section_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  section field_section NOT NULL,
  field_values JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1,
  
  CONSTRAINT deal_section_values_unique UNIQUE (deal_id, section)
);

-- Create GIN index for efficient JSONB key lookups
CREATE INDEX idx_deal_section_values_field_values 
ON deal_section_values USING GIN (field_values);

-- Create index for deal lookups
CREATE INDEX idx_deal_section_values_deal_id 
ON deal_section_values (deal_id);

-- Enable RLS
ALTER TABLE deal_section_values ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view accessible deal section values
CREATE POLICY "Users can view accessible deal section values"
ON deal_section_values FOR SELECT
USING (has_deal_access(auth.uid(), deal_id));

-- RLS Policy: CSRs can insert deal section values
CREATE POLICY "CSRs can insert deal section values"
ON deal_section_values FOR INSERT
WITH CHECK (has_role(auth.uid(), 'csr') OR has_role(auth.uid(), 'admin'));

-- RLS Policy: Authorized users can update deal section values
CREATE POLICY "Authorized users can update deal section values"
ON deal_section_values FOR UPDATE
USING (
  has_role(auth.uid(), 'csr') 
  OR has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM deal_assignments da
    WHERE da.deal_id = deal_section_values.deal_id
    AND da.user_id = auth.uid()
  )
);

-- RLS Policy: Admins can delete deal section values
CREATE POLICY "Admins can delete deal section values"
ON deal_section_values FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Migrate existing data from deal_field_values to deal_section_values
-- Uses actual field_dictionary.id as JSONB keys
INSERT INTO deal_section_values (deal_id, section, field_values, updated_at)
SELECT 
  dfv.deal_id,
  fd.section,
  jsonb_object_agg(
    dfv.field_dictionary_id::text,
    jsonb_build_object(
      'value_text', dfv.value_text,
      'value_number', dfv.value_number,
      'value_date', dfv.value_date,
      'value_json', dfv.value_json,
      'updated_at', dfv.updated_at,
      'updated_by', dfv.updated_by
    )
  ),
  MAX(dfv.updated_at)
FROM deal_field_values dfv
JOIN field_dictionary fd ON fd.id = dfv.field_dictionary_id
WHERE dfv.field_dictionary_id IS NOT NULL
GROUP BY dfv.deal_id, fd.section
ON CONFLICT (deal_id, section) DO UPDATE SET
  field_values = deal_section_values.field_values || EXCLUDED.field_values,
  updated_at = GREATEST(deal_section_values.updated_at, EXCLUDED.updated_at),
  version = deal_section_values.version + 1;