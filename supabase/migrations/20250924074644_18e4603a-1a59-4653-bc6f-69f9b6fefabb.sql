-- Create contractor_requirements table for storing snapshots
CREATE TABLE IF NOT EXISTS public.contractor_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_id TEXT NOT NULL,
  docs JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for fast contractor lookups
CREATE INDEX IF NOT EXISTS idx_contractor_requirements_contractor_id 
ON public.contractor_requirements(contractor_id);

-- Add index for fast ordering by creation date
CREATE INDEX IF NOT EXISTS idx_contractor_requirements_created_at 
ON public.contractor_requirements(created_at DESC);

-- Enable RLS
ALTER TABLE public.contractor_requirements ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (needed for resolve-magic-link function)
CREATE POLICY "Public read access for contractor requirements" 
ON public.contractor_requirements 
FOR SELECT 
USING (true);

-- Create policy for admin write access
CREATE POLICY "Admin users can manage contractor requirements" 
ON public.contractor_requirements 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('owner', 'admin', 'staff')
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('owner', 'admin', 'staff')
  )
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_contractor_requirements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contractor_requirements_updated_at
  BEFORE UPDATE ON public.contractor_requirements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contractor_requirements_updated_at();