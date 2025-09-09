import { useEffect } from 'react';
import { telemetry } from '@/lib/telemetry';
import { useAppAuth } from './useAppAuth';

// Hook to integrate telemetry across the application
export function useTelemetryIntegration() {
  const { profile } = useAppAuth();

  useEffect(() => {
    if (!profile) return;

    // Track page views and user sessions
    const trackPageView = () => {
      telemetry.track('PageView', {
        page: window.location.pathname,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }, profile.id, profile.tenant_id);
    };

    // Track initial page view
    trackPageView();

    // Track navigation changes
    const handlePopState = () => trackPageView();
    window.addEventListener('popstate', handlePopState);

    // Track user activity
    let lastActivity = Date.now();
    const trackActivity = () => {
      const now = Date.now();
      if (now - lastActivity > 60000) { // 1 minute threshold
        telemetry.track('UserActive', {
          session_duration: now - lastActivity,
          page: window.location.pathname
        }, profile.id, profile.tenant_id);
      }
      lastActivity = now;
    };

    const activityEvents = ['click', 'keydown', 'scroll', 'mousemove'];
    activityEvents.forEach(event => {
      document.addEventListener(event, trackActivity, { passive: true });
    });

    return () => {
      window.removeEventListener('popstate', handlePopState);
      activityEvents.forEach(event => {
        document.removeEventListener(event, trackActivity);
      });
    };
  }, [profile]);

  return {
    trackEvent: (eventType: string, properties?: Record<string, any>) => {
      telemetry.track(eventType, properties, profile?.id, profile?.tenant_id);
    },
    trackRequirementStatusChanged: (requirementId: string, oldStatus: string, newStatus: string) => {
      telemetry.trackRequirementStatusChanged(requirementId, oldStatus, newStatus, profile?.id, profile?.tenant_id);
    },
    trackSubcontractorActivated: (subcontractorId: string) => {
      telemetry.trackSubcontractorActivated(subcontractorId, profile?.id, profile?.tenant_id);
    },
    trackSubcontractorDeactivated: (subcontractorId: string) => {
      telemetry.trackSubcontractorDeactivated(subcontractorId, profile?.id, profile?.tenant_id);
    },
    trackComplianceFlagsChanged: (subcontractorId: string, changes: Record<string, boolean>) => {
      telemetry.trackComplianceFlagsChanged(subcontractorId, changes, profile?.id, profile?.tenant_id);
    },
    trackDocumentUploaded: (requirementId: string, documentId: string, fileSize: number, mimeType: string) => {
      telemetry.trackDocumentUploaded(requirementId, documentId, fileSize, mimeType, profile?.id, profile?.tenant_id);
    },
    trackReviewCompleted: (requirementId: string, documentId: string, decision: 'approved' | 'rejected') => {
      telemetry.trackReviewCompleted(requirementId, documentId, decision, profile?.id, profile?.tenant_id);
    }
  };
}