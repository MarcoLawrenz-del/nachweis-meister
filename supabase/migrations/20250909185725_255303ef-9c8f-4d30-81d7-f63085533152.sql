-- Create analytics_events table for telemetry
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  tenant_id UUID REFERENCES public.tenants(id),
  properties JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create analytics events for their tenant"
ON public.analytics_events
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.tenant_id = analytics_events.tenant_id
    AND users.id = auth.uid()
    AND users.role IN ('owner', 'admin', 'staff')
  )
);

CREATE POLICY "Users can view analytics events for their tenant"
ON public.analytics_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.tenant_id = analytics_events.tenant_id
    AND users.id = auth.uid()
  )
);

-- Create function to get tenant KPIs
CREATE OR REPLACE FUNCTION public.get_tenant_kpis(tenant_id UUID)
RETURNS TABLE (
  total_subcontractors INTEGER,
  active_subcontractors INTEGER,
  inactive_subcontractors INTEGER,
  total_requirements INTEGER,
  missing_requirements INTEGER,
  submitted_requirements INTEGER,
  in_review_requirements INTEGER,
  valid_requirements INTEGER,
  rejected_requirements INTEGER,
  expiring_requirements INTEGER,
  expired_requirements INTEGER,
  compliance_rate NUMERIC,
  last_updated TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH subcontractor_stats AS (
    SELECT
      COUNT(*)::INTEGER as total_subs,
      COUNT(CASE WHEN s.status = 'active' THEN 1 END)::INTEGER as active_subs,
      COUNT(CASE WHEN s.status = 'inactive' THEN 1 END)::INTEGER as inactive_subs
    FROM subcontractors s
    WHERE s.tenant_id = get_tenant_kpis.tenant_id
  ),
  requirement_stats AS (
    SELECT
      COUNT(r.*)::INTEGER as total_reqs,
      COUNT(CASE WHEN r.status = 'missing' THEN 1 END)::INTEGER as missing_reqs,
      COUNT(CASE WHEN r.status = 'submitted' THEN 1 END)::INTEGER as submitted_reqs,
      COUNT(CASE WHEN r.status = 'in_review' THEN 1 END)::INTEGER as in_review_reqs,
      COUNT(CASE WHEN r.status = 'valid' THEN 1 END)::INTEGER as valid_reqs,
      COUNT(CASE WHEN r.status = 'rejected' THEN 1 END)::INTEGER as rejected_reqs,
      COUNT(CASE WHEN r.status = 'expiring' THEN 1 END)::INTEGER as expiring_reqs,
      COUNT(CASE WHEN r.status = 'expired' THEN 1 END)::INTEGER as expired_reqs
    FROM requirements r
    JOIN project_subs ps ON ps.id = r.project_sub_id
    JOIN projects p ON p.id = ps.project_id
    WHERE p.tenant_id = get_tenant_kpis.tenant_id
  )
  SELECT
    ss.total_subs as total_subcontractors,
    ss.active_subs as active_subcontractors,
    ss.inactive_subs as inactive_subcontractors,
    rs.total_reqs as total_requirements,
    rs.missing_reqs as missing_requirements,
    rs.submitted_reqs as submitted_requirements,
    rs.in_review_reqs as in_review_requirements,
    rs.valid_reqs as valid_requirements,
    rs.rejected_reqs as rejected_requirements,
    rs.expiring_reqs as expiring_requirements,
    rs.expired_reqs as expired_requirements,
    CASE 
      WHEN rs.total_reqs > 0 THEN ROUND((rs.valid_reqs::NUMERIC / rs.total_reqs::NUMERIC) * 100, 1)
      ELSE 0
    END as compliance_rate,
    now() as last_updated
  FROM subcontractor_stats ss, requirement_stats rs;
END;
$$;

-- Create indexes for better performance
CREATE INDEX idx_analytics_events_tenant_id ON public.analytics_events(tenant_id);
CREATE INDEX idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_timestamp ON public.analytics_events(timestamp);

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_tenant_kpis(UUID) TO authenticated;