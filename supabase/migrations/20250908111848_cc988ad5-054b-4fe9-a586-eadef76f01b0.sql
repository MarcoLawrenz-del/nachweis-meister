-- Drop conflicting policies first
DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view documents for their tenant" ON storage.objects;
DROP POLICY IF EXISTS "Service role access for uploads" ON storage.objects;

-- Create better storage policies for document uploads
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid() IS NOT NULL
);

-- Allow users to view documents by checking against the documents table
CREATE POLICY "Users can access their tenant documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' 
  AND EXISTS (
    SELECT 1 FROM documents d
    JOIN requirements r ON r.id = d.requirement_id
    JOIN project_subs ps ON ps.id = r.project_sub_id
    JOIN projects p ON p.id = ps.project_id
    JOIN users u ON u.tenant_id = p.tenant_id
    WHERE d.file_url LIKE '%' || objects.name || '%'
      AND u.id = auth.uid()
  )
);

-- Update documents bucket to be public for easier access
UPDATE storage.buckets SET public = true WHERE id = 'documents';