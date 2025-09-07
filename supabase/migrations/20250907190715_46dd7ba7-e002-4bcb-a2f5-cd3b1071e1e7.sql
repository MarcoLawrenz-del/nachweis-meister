-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false);

-- Storage policies for documents bucket
CREATE POLICY "Users can view documents for their tenant" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.requirements r
    JOIN public.project_subs ps ON ps.id = r.project_sub_id
    JOIN public.projects p ON p.id = ps.project_id
    JOIN public.users u ON u.tenant_id = p.tenant_id
    WHERE (storage.foldername(objects.name))[1] = r.id::text
    AND u.id = auth.uid()
  )
);

CREATE POLICY "Users can upload documents for their tenant" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.requirements r
    JOIN public.project_subs ps ON ps.id = r.project_sub_id
    JOIN public.projects p ON p.id = ps.project_id
    JOIN public.users u ON u.tenant_id = p.tenant_id
    WHERE (storage.foldername(objects.name))[1] = r.id::text
    AND u.id = auth.uid()
  )
);

CREATE POLICY "Users can update documents for their tenant" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.requirements r
    JOIN public.project_subs ps ON ps.id = r.project_sub_id
    JOIN public.projects p ON p.id = ps.project_id
    JOIN public.users u ON u.tenant_id = p.tenant_id
    WHERE (storage.foldername(objects.name))[1] = r.id::text
    AND u.id = auth.uid()
  )
);

CREATE POLICY "Users can delete documents for their tenant" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.requirements r
    JOIN public.project_subs ps ON ps.id = r.project_sub_id
    JOIN public.projects p ON p.id = ps.project_id
    JOIN public.users u ON u.tenant_id = p.tenant_id
    WHERE (storage.foldername(objects.name))[1] = r.id::text
    AND u.id = auth.uid()
    AND u.role IN ('owner', 'admin', 'staff')
  )
);