-- Create storage policies for document uploads
-- Allow authenticated users to upload documents
CREATE POLICY "Users can upload documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid() IS NOT NULL
);

-- Allow users to view documents for their tenant
CREATE POLICY "Users can view documents for their tenant" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' 
  AND EXISTS (
    SELECT 1 FROM documents d
    JOIN requirements r ON r.id = d.requirement_id
    JOIN project_subs ps ON ps.id = r.project_sub_id
    JOIN projects p ON p.id = ps.project_id
    JOIN users u ON u.tenant_id = p.tenant_id
    WHERE d.file_url LIKE '%' || name || '%'
      AND u.id = auth.uid()
  )
);

-- Allow service role access for public uploads via edge functions
CREATE POLICY "Service role access for uploads" ON storage.objects
FOR ALL USING (bucket_id = 'documents');

-- Update documents bucket to be public for easier access
UPDATE storage.buckets SET public = true WHERE id = 'documents';