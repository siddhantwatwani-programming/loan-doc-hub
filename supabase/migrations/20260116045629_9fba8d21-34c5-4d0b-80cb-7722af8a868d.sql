-- Drop existing deal_field_values table and recreate with typed columns
DROP TABLE IF EXISTS public.deal_field_values;

-- Create new deal_field_values table with typed value columns
CREATE TABLE public.deal_field_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    field_key TEXT NOT NULL REFERENCES public.field_dictionary(field_key) ON DELETE CASCADE,
    value_text TEXT,
    value_number DECIMAL,
    value_date DATE,
    value_json JSONB,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id),
    UNIQUE(deal_id, field_key)
);

-- Enable RLS
ALTER TABLE public.deal_field_values ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "CSRs can view deal field values"
ON public.deal_field_values
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM deals d
        WHERE d.id = deal_field_values.deal_id
        AND (has_role(auth.uid(), 'csr') OR has_role(auth.uid(), 'admin'))
    )
);

CREATE POLICY "CSRs can insert deal field values"
ON public.deal_field_values
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM deals d
        WHERE d.id = deal_field_values.deal_id
        AND (has_role(auth.uid(), 'csr') OR has_role(auth.uid(), 'admin'))
    )
    AND auth.uid() = updated_by
);

CREATE POLICY "CSRs can update deal field values"
ON public.deal_field_values
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM deals d
        WHERE d.id = deal_field_values.deal_id
        AND (has_role(auth.uid(), 'csr') OR has_role(auth.uid(), 'admin'))
    )
);

CREATE POLICY "Admins can delete deal field values"
ON public.deal_field_values
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM deals d
        WHERE d.id = deal_field_values.deal_id
        AND has_role(auth.uid(), 'admin')
    )
);

-- Create index for faster lookups
CREATE INDEX idx_deal_field_values_deal_id ON public.deal_field_values(deal_id);
CREATE INDEX idx_deal_field_values_field_key ON public.deal_field_values(field_key);

-- Trigger for updated_at
CREATE TRIGGER update_deal_field_values_updated_at
BEFORE UPDATE ON public.deal_field_values
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();