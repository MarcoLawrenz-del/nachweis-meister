-- Create projects table (add missing columns if not exist)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
        CREATE TABLE public.projects (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            code TEXT NOT NULL,
            address TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            UNIQUE(tenant_id, code)
        );
        
        ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view their tenant projects" 
        ON public.projects FOR SELECT 
        USING (
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE users.tenant_id = projects.tenant_id 
                AND users.id = auth.uid()
            )
        );

        CREATE POLICY "Users can create projects for their tenant" 
        ON public.projects FOR INSERT 
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE users.tenant_id = projects.tenant_id 
                AND users.id = auth.uid()
                AND users.role IN ('owner', 'admin')
            )
        );

        CREATE POLICY "Users can update their tenant projects" 
        ON public.projects FOR UPDATE 
        USING (
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE users.tenant_id = projects.tenant_id 
                AND users.id = auth.uid()
                AND users.role IN ('owner', 'admin')
            )
        );
    END IF;
END $$;

-- Create subcontractors table
CREATE TABLE public.subcontractors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    contact_name TEXT,
    contact_email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    country_code TEXT NOT NULL DEFAULT 'DE',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, contact_email)
);

-- Create project_subs (junction table)
CREATE TABLE public.project_subs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    subcontractor_id UUID NOT NULL REFERENCES public.subcontractors(id) ON DELETE CASCADE,
    overall_status TEXT NOT NULL DEFAULT 'pending' CHECK (overall_status IN ('pending', 'approved', 'rejected')),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(project_id, subcontractor_id)
);

-- Create document_types table
CREATE TABLE public.document_types (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name_de TEXT NOT NULL,
    description_de TEXT,
    required_by_default BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- Insert default document types
INSERT INTO public.document_types (code, name_de, description_de, sort_order) VALUES
('freistellungsbescheinigung', 'Freistellungsbescheinigung', 'Bescheinigung der Bundesagentur für Arbeit', 1),
('umsatzsteuer', 'Umsatzsteuer-Bescheinigung', 'Bescheinigung über die steuerliche Erfassung', 2),
('soka_bau', 'SOKA-BAU Bescheinigung', 'Sozialkassenbeitrag der Bauwirtschaft', 3),
('bg_bau', 'BG BAU Bescheinigung', 'Berufsgenossenschaft der Bauwirtschaft', 4),
('handwerksrolle', 'Handwerksrolle/Gewerbeschein', 'Nachweis der Gewerbeberechtigung', 5),
('a1_bescheinigung', 'A1-Bescheinigung', 'Bescheinigung über die anzuwendenden Rechtsvorschriften', 6),
('betriebshaftpflicht', 'Betriebshaftpflichtversicherung', 'Nachweis der Haftpflichtversicherung', 7);

-- Create requirements table
CREATE TABLE public.requirements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_sub_id UUID NOT NULL REFERENCES public.project_subs(id) ON DELETE CASCADE,
    document_type_id UUID NOT NULL REFERENCES public.document_types(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'missing' CHECK (status IN ('missing', 'in_review', 'valid', 'expiring', 'expired')),
    due_date DATE,
    last_reminded_at TIMESTAMP WITH TIME ZONE,
    escalated BOOLEAN NOT NULL DEFAULT false,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(project_sub_id, document_type_id)
);

-- Create documents table
CREATE TABLE public.documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    requirement_id UUID NOT NULL REFERENCES public.requirements(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    valid_from DATE,
    valid_to DATE,
    issuer TEXT,
    document_number TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_subs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;