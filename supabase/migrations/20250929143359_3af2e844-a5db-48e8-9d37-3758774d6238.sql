-- Fix RLS security issues - Enable RLS on all tables that need it

-- Check which tables don't have RLS enabled but should
ALTER TABLE public.contractor_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.magic_links ENABLE ROW LEVEL SECURITY;