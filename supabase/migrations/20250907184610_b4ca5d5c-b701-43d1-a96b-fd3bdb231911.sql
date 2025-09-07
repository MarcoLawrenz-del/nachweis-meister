-- Add RLS policies for Marco1 table (case-sensitive)
CREATE POLICY "Users can view their own Marco1 records" 
ON public."Marco1" 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own Marco1 records" 
ON public."Marco1" 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Marco1 records" 
ON public."Marco1" 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Marco1 records" 
ON public."Marco1" 
FOR DELETE 
USING (auth.uid() = user_id);