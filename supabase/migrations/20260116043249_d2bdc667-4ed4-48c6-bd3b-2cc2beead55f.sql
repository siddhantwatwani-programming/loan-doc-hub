-- Enums for Deal
CREATE TYPE public.deal_mode AS ENUM ('doc_prep', 'servicing_only');
CREATE TYPE public.deal_status AS ENUM ('draft', 'ready', 'generated');

-- Enums for FieldDictionary
CREATE TYPE public.field_data_type AS ENUM ('text', 'number', 'currency', 'date', 'percentage', 'boolean');
CREATE TYPE public.field_section AS ENUM ('borrower', 'co_borrower', 'loan_terms', 'property', 'seller', 'title', 'escrow', 'other');

-- ============================================
-- FieldDictionary - Master field definitions
-- ============================================
CREATE TABLE public.field_dictionary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    section field_section NOT NULL,
    data_type field_data_type NOT NULL DEFAULT 'text',
    is_calculated BOOLEAN NOT NULL DEFAULT false,
    is_repeatable BOOLEAN NOT NULL DEFAULT false,
    description TEXT,
    default_value TEXT,
    validation_rule TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.field_dictionary ENABLE ROW LEVEL SECURITY;

-- Field dictionary is read-only for CSRs, writable by admins
CREATE POLICY "Anyone authenticated can view field dictionary"
ON public.field_dictionary FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert field dictionary"
ON public.field_dictionary FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update field dictionary"
ON public.field_dictionary FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete field dictionary"
ON public.field_dictionary FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- Packet - Document packet definitions
-- ============================================
CREATE TABLE public.packets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    state TEXT NOT NULL,
    product_type TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(name, state, product_type)
);

ALTER TABLE public.packets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view packets"
ON public.packets FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert packets"
ON public.packets FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update packets"
ON public.packets FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete packets"
ON public.packets FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- Template - Document templates
-- ============================================
CREATE TABLE public.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    state TEXT NOT NULL,
    product_type TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    file_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(name, state, product_type, version)
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view templates"
ON public.templates FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert templates"
ON public.templates FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update templates"
ON public.templates FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete templates"
ON public.templates FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- TemplateFieldMap - Links templates to fields
-- ============================================
CREATE TABLE public.template_field_maps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
    field_key TEXT NOT NULL REFERENCES public.field_dictionary(field_key) ON DELETE CASCADE,
    required_flag BOOLEAN NOT NULL DEFAULT false,
    transform_rule TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(template_id, field_key)
);

ALTER TABLE public.template_field_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view template field maps"
ON public.template_field_maps FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert template field maps"
ON public.template_field_maps FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update template field maps"
ON public.template_field_maps FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete template field maps"
ON public.template_field_maps FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- PacketTemplate - Links packets to templates
-- ============================================
CREATE TABLE public.packet_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    packet_id UUID NOT NULL REFERENCES public.packets(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_required BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(packet_id, template_id)
);

ALTER TABLE public.packet_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view packet templates"
ON public.packet_templates FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert packet templates"
ON public.packet_templates FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update packet templates"
ON public.packet_templates FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete packet templates"
ON public.packet_templates FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- Deal - Main transaction entity
-- ============================================
CREATE TABLE public.deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_number TEXT NOT NULL UNIQUE,
    state TEXT NOT NULL,
    product_type TEXT NOT NULL,
    packet_id UUID REFERENCES public.packets(id),
    mode deal_mode NOT NULL DEFAULT 'doc_prep',
    status deal_status NOT NULL DEFAULT 'draft',
    borrower_name TEXT,
    property_address TEXT,
    loan_amount NUMERIC(15,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NOT NULL REFERENCES auth.users(id)
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- CSRs can view and manage deals
CREATE POLICY "CSRs can view all deals"
ON public.deals FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'csr') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "CSRs can create deals"
ON public.deals FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'csr') AND auth.uid() = created_by);

CREATE POLICY "CSRs can update deals"
ON public.deals FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'csr') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete deals"
ON public.deals FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- DealFieldValues - Stores field values for deals
-- ============================================
CREATE TABLE public.deal_field_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    field_key TEXT NOT NULL REFERENCES public.field_dictionary(field_key),
    field_value TEXT,
    repeat_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(deal_id, field_key, repeat_index)
);

ALTER TABLE public.deal_field_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CSRs can view deal field values"
ON public.deal_field_values FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.deals d 
        WHERE d.id = deal_id 
        AND (public.has_role(auth.uid(), 'csr') OR public.has_role(auth.uid(), 'admin'))
    )
);

CREATE POLICY "CSRs can insert deal field values"
ON public.deal_field_values FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.deals d 
        WHERE d.id = deal_id 
        AND public.has_role(auth.uid(), 'csr')
    )
);

CREATE POLICY "CSRs can update deal field values"
ON public.deal_field_values FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.deals d 
        WHERE d.id = deal_id 
        AND (public.has_role(auth.uid(), 'csr') OR public.has_role(auth.uid(), 'admin'))
    )
);

CREATE POLICY "Admins can delete deal field values"
ON public.deal_field_values FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.deals d 
        WHERE d.id = deal_id 
        AND public.has_role(auth.uid(), 'admin')
    )
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX idx_deals_status ON public.deals(status);
CREATE INDEX idx_deals_state ON public.deals(state);
CREATE INDEX idx_deals_created_by ON public.deals(created_by);
CREATE INDEX idx_deals_packet_id ON public.deals(packet_id);
CREATE INDEX idx_field_dictionary_section ON public.field_dictionary(section);
CREATE INDEX idx_templates_state_product ON public.templates(state, product_type);
CREATE INDEX idx_packets_state_product ON public.packets(state, product_type);
CREATE INDEX idx_deal_field_values_deal_id ON public.deal_field_values(deal_id);
CREATE INDEX idx_deal_field_values_field_key ON public.deal_field_values(field_key);

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE TRIGGER update_field_dictionary_updated_at
    BEFORE UPDATE ON public.field_dictionary
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_packets_updated_at
    BEFORE UPDATE ON public.packets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON public.templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deals_updated_at
    BEFORE UPDATE ON public.deals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deal_field_values_updated_at
    BEFORE UPDATE ON public.deal_field_values
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Function to generate deal numbers
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_deal_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    year_prefix TEXT;
    next_seq INTEGER;
BEGIN
    year_prefix := 'DL-' || TO_CHAR(NOW(), 'YYYY') || '-';
    
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(deal_number FROM 9) AS INTEGER)
    ), 0) + 1
    INTO next_seq
    FROM public.deals
    WHERE deal_number LIKE year_prefix || '%';
    
    RETURN year_prefix || LPAD(next_seq::TEXT, 4, '0');
END;
$$;