-- Add missing RLS policies for tenants table
CREATE POLICY "Users can update their own tenant" 
ON public.tenants 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.tenant_id = tenants.id 
    AND users.id = auth.uid()
    AND users.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Owners can delete their tenant" 
ON public.tenants 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.tenant_id = tenants.id 
    AND users.id = auth.uid()
    AND users.role = 'owner'
  )
);