-- Trigger für automatische Review-History Tracking
CREATE TRIGGER track_requirement_review_history
  AFTER UPDATE ON public.requirements
  FOR EACH ROW
  EXECUTE FUNCTION public.track_review_history();