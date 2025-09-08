-- Add review assignment and escalation fields to requirements table
ALTER TABLE public.requirements 
ADD COLUMN assigned_reviewer_id UUID REFERENCES users(id),
ADD COLUMN escalated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN escalation_reason TEXT,
ADD COLUMN review_priority TEXT DEFAULT 'normal' CHECK (review_priority IN ('low', 'normal', 'high', 'urgent'));

-- Create review history table for audit trail
CREATE TABLE public.review_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id),
  action TEXT NOT NULL CHECK (action IN ('assigned', 'approved', 'rejected', 'escalated', 'commented')),
  comment TEXT,
  old_status TEXT,
  new_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on review_history
ALTER TABLE public.review_history ENABLE ROW LEVEL SECURITY;

-- Create policy for review history - users can view history for their tenant
CREATE POLICY "Users can view review history for their tenant" 
ON public.review_history 
FOR SELECT 
USING (EXISTS (
  SELECT 1 
  FROM requirements r
  JOIN project_subs ps ON ps.id = r.project_sub_id
  JOIN projects p ON p.id = ps.project_id
  JOIN users u ON u.tenant_id = p.tenant_id
  WHERE r.id = review_history.requirement_id 
    AND u.id = auth.uid()
));

-- Create policy for creating review history - users can create for their tenant
CREATE POLICY "Users can create review history for their tenant" 
ON public.review_history 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 
  FROM requirements r
  JOIN project_subs ps ON ps.id = r.project_sub_id
  JOIN projects p ON p.id = ps.project_id
  JOIN users u ON u.tenant_id = p.tenant_id
  WHERE r.id = review_history.requirement_id 
    AND u.id = auth.uid()
    AND u.role IN ('owner', 'admin', 'staff')
));

-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_on_approval BOOLEAN DEFAULT true,
  email_on_rejection BOOLEAN DEFAULT true,
  email_on_assignment BOOLEAN DEFAULT true,
  email_on_escalation BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on notification preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own notification preferences
CREATE POLICY "Users can manage their own notification preferences" 
ON public.notification_preferences 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create function to auto-assign reviewers based on workload
CREATE OR REPLACE FUNCTION public.auto_assign_reviewer(tenant_id_param UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reviewer_id UUID;
BEGIN
  -- Find reviewer with least active reviews in the tenant
  SELECT u.id INTO reviewer_id
  FROM users u
  LEFT JOIN (
    SELECT assigned_reviewer_id, COUNT(*) as active_count
    FROM requirements r
    JOIN project_subs ps ON ps.id = r.project_sub_id
    JOIN projects p ON p.id = ps.project_id
    WHERE r.status = 'in_review' 
      AND r.assigned_reviewer_id IS NOT NULL
      AND p.tenant_id = tenant_id_param
    GROUP BY assigned_reviewer_id
  ) active_reviews ON u.id = active_reviews.assigned_reviewer_id
  WHERE u.tenant_id = tenant_id_param
    AND u.role IN ('owner', 'admin', 'staff')
  ORDER BY COALESCE(active_reviews.active_count, 0) ASC
  LIMIT 1;
  
  RETURN reviewer_id;
END;
$$;

-- Create function to track review history automatically
CREATE OR REPLACE FUNCTION public.track_review_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Track status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.review_history (
      requirement_id,
      reviewer_id,
      action,
      old_status,
      new_status
    ) VALUES (
      NEW.id,
      COALESCE(NEW.reviewed_by, auth.uid()),
      CASE 
        WHEN NEW.status = 'valid' THEN 'approved'
        WHEN NEW.status = 'missing' AND OLD.status = 'in_review' THEN 'rejected'
        ELSE 'updated'
      END,
      OLD.status,
      NEW.status
    );
  END IF;
  
  -- Track reviewer assignment
  IF OLD.assigned_reviewer_id IS DISTINCT FROM NEW.assigned_reviewer_id AND NEW.assigned_reviewer_id IS NOT NULL THEN
    INSERT INTO public.review_history (
      requirement_id,
      reviewer_id,
      action
    ) VALUES (
      NEW.id,
      NEW.assigned_reviewer_id,
      'assigned'
    );
  END IF;
  
  -- Track escalation
  IF OLD.escalated IS DISTINCT FROM NEW.escalated AND NEW.escalated = true THEN
    INSERT INTO public.review_history (
      requirement_id,
      reviewer_id,
      action,
      comment
    ) VALUES (
      NEW.id,
      COALESCE(auth.uid(), NEW.assigned_reviewer_id),
      'escalated',
      NEW.escalation_reason
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for review history tracking
CREATE TRIGGER track_review_history_trigger
  AFTER UPDATE ON public.requirements
  FOR EACH ROW
  EXECUTE FUNCTION public.track_review_history();

-- Add trigger for updated_at on notification preferences
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();