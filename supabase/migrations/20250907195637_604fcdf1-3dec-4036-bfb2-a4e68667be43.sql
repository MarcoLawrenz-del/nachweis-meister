-- Create storage policies for document uploads
-- Ensure documents bucket exists and is private for security
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for document access
CREATE POLICY "Users can view documents for their tenant"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'documents' 
  AND EXISTS (
    SELECT 1 FROM documents d
    JOIN requirements r ON r.id = d.requirement_id
    JOIN project_subs ps ON ps.id = r.project_sub_id
    JOIN projects p ON p.id = ps.project_id
    JOIN users u ON u.tenant_id = p.tenant_id
    WHERE d.file_url = storage.objects.name 
    AND u.id = auth.uid()
  )
);

CREATE POLICY "Users can upload documents for their tenant"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update documents for their tenant"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'documents' 
  AND EXISTS (
    SELECT 1 FROM documents d
    JOIN requirements r ON r.id = d.requirement_id
    JOIN project_subs ps ON ps.id = r.project_sub_id
    JOIN projects p ON p.id = ps.project_id
    JOIN users u ON u.tenant_id = p.tenant_id
    WHERE d.file_url = storage.objects.name 
    AND u.id = auth.uid()
    AND u.role IN ('owner', 'admin', 'staff')
  )
);

CREATE POLICY "Users can delete documents for their tenant"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'documents' 
  AND EXISTS (
    SELECT 1 FROM documents d
    JOIN requirements r ON r.id = d.requirement_id
    JOIN project_subs ps ON ps.id = r.project_sub_id
    JOIN projects p ON p.id = ps.project_id
    JOIN users u ON u.tenant_id = p.tenant_id
    WHERE d.file_url = storage.objects.name 
    AND u.id = auth.uid()
    AND u.role IN ('owner', 'admin')
  )
);