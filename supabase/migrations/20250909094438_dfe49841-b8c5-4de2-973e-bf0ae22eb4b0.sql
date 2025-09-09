-- Create CRON job for processing reminders
-- This will process reminder jobs every hour

SELECT cron.schedule(
  'process-reminder-jobs',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://qvamzeepjzqndakhjpjg.supabase.co/functions/v1/process-reminder-jobs',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2YW16ZWVwanpxbmRha2hqcGpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNjYxODMsImV4cCI6MjA3Mjg0MjE4M30.j4IsZ4wvBePgh1moBRBCFFum0t8uGDTVRsNlNjYK3D8"}'::jsonb,
    body := '{"automated": true}'::jsonb
  );
  $$
);