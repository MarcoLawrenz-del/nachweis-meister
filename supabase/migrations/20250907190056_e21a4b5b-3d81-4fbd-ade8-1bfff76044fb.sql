-- RLS Policies for subcontractors
CREATE POLICY "Users can view their tenant subcontractors" 
ON public.subcontractors FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.tenant_id = subcontractors.tenant_id 
        AND users.id = auth.uid()
    )
);

CREATE POLICY "Users can create subcontractors for their tenant" 
ON public.subcontractors FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.tenant_id = subcontractors.tenant_id 
        AND users.id = auth.uid()
        AND users.role IN ('owner', 'admin', 'staff')
    )
);

CREATE POLICY "Users can update their tenant subcontractors" 
ON public.subcontractors FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.tenant_id = subcontractors.tenant_id 
        AND users.id = auth.uid()
        AND users.role IN ('owner', 'admin', 'staff')
    )
);

CREATE POLICY "Users can delete their tenant subcontractors" 
ON public.subcontractors FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.tenant_id = subcontractors.tenant_id 
        AND users.id = auth.uid()
        AND users.role IN ('owner', 'admin')
    )
);

-- RLS Policies for project_subs
CREATE POLICY "Users can view project_subs for their tenant" 
ON public.project_subs FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.users u ON u.tenant_id = p.tenant_id
        WHERE p.id = project_subs.project_id 
        AND u.id = auth.uid()
    )
);

CREATE POLICY "Users can create project_subs for their tenant" 
ON public.project_subs FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.users u ON u.tenant_id = p.tenant_id
        WHERE p.id = project_subs.project_id 
        AND u.id = auth.uid()
        AND u.role IN ('owner', 'admin', 'staff')
    )
);

CREATE POLICY "Users can update project_subs for their tenant" 
ON public.project_subs FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.users u ON u.tenant_id = p.tenant_id
        WHERE p.id = project_subs.project_id 
        AND u.id = auth.uid()
        AND u.role IN ('owner', 'admin', 'staff')
    )
);

CREATE POLICY "Users can delete project_subs for their tenant" 
ON public.project_subs FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.users u ON u.tenant_id = p.tenant_id
        WHERE p.id = project_subs.project_id 
        AND u.id = auth.uid()
        AND u.role IN ('owner', 'admin')
    )
);

-- RLS Policies for document_types (public read-only)
CREATE POLICY "Everyone can view document types" 
ON public.document_types FOR SELECT 
USING (true);

-- RLS Policies for requirements
CREATE POLICY "Users can view requirements for their tenant" 
ON public.requirements FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.project_subs ps
        JOIN public.projects p ON p.id = ps.project_id
        JOIN public.users u ON u.tenant_id = p.tenant_id
        WHERE ps.id = requirements.project_sub_id 
        AND u.id = auth.uid()
    )
);

CREATE POLICY "Users can create requirements for their tenant" 
ON public.requirements FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.project_subs ps
        JOIN public.projects p ON p.id = ps.project_id
        JOIN public.users u ON u.tenant_id = p.tenant_id
        WHERE ps.id = requirements.project_sub_id 
        AND u.id = auth.uid()
        AND u.role IN ('owner', 'admin', 'staff')
    )
);

CREATE POLICY "Users can update requirements for their tenant" 
ON public.requirements FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.project_subs ps
        JOIN public.projects p ON p.id = ps.project_id
        JOIN public.users u ON u.tenant_id = p.tenant_id
        WHERE ps.id = requirements.project_sub_id 
        AND u.id = auth.uid()
        AND u.role IN ('owner', 'admin', 'staff')
    )
);

-- RLS Policies for documents
CREATE POLICY "Users can view documents for their tenant" 
ON public.documents FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.requirements r
        JOIN public.project_subs ps ON ps.id = r.project_sub_id
        JOIN public.projects p ON p.id = ps.project_id
        JOIN public.users u ON u.tenant_id = p.tenant_id
        WHERE r.id = documents.requirement_id 
        AND u.id = auth.uid()
    )
);

CREATE POLICY "Users can create documents for their tenant" 
ON public.documents FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.requirements r
        JOIN public.project_subs ps ON ps.id = r.project_sub_id
        JOIN public.projects p ON p.id = ps.project_id
        JOIN public.users u ON u.tenant_id = p.tenant_id
        WHERE r.id = documents.requirement_id 
        AND u.id = auth.uid()
    )
);

CREATE POLICY "Users can update documents for their tenant" 
ON public.documents FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.requirements r
        JOIN public.project_subs ps ON ps.id = r.project_sub_id
        JOIN public.projects p ON p.id = ps.project_id
        JOIN public.users u ON u.tenant_id = p.tenant_id
        WHERE r.id = documents.requirement_id 
        AND u.id = auth.uid()
        AND u.role IN ('owner', 'admin', 'staff')
    )
);

-- Add update triggers for timestamps
CREATE TRIGGER update_subcontractors_updated_at
    BEFORE UPDATE ON public.subcontractors
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_requirements_updated_at
    BEFORE UPDATE ON public.requirements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();