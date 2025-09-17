import { supabase } from '@/integrations/supabase/client';

export interface TelemetryEvent {
  event_type: string;
  user_id?: string;
  tenant_id?: string;
  properties?: Record<string, any>;
  timestamp: string;
}

class TelemetryService {
  private events: TelemetryEvent[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_DELAY = 5000; // 5 seconds

  track(eventType: string, properties?: Record<string, any>, userId?: string, tenantId?: string) {
    const event: TelemetryEvent = {
      event_type: eventType,
      user_id: userId,
      tenant_id: tenantId,
      properties,
      timestamp: new Date().toISOString(),
    };

    this.events.push(event);
    this.scheduleBatch();
  }

  private scheduleBatch() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    // Send immediately if batch is full, otherwise wait for delay
    if (this.events.length >= this.BATCH_SIZE) {
      this.flushEvents();
    } else {
      this.batchTimeout = setTimeout(() => {
        this.flushEvents();
      }, this.BATCH_DELAY);
    }
  }

  private async flushEvents() {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      // In demo mode, just log events instead of sending to database
      if (import.meta.env.VITE_DEMO_MODE === 'true') {
        console.group('📊 Telemetry Events (Demo Mode)');
        eventsToSend.forEach(event => {
          console.log(`${event.event_type}:`, event.properties);
        });
        console.groupEnd();
        return;
      }

      // For now, log events until analytics_events types are updated
      console.group('📊 Telemetry Events');
      eventsToSend.forEach(event => {
        console.log(`${event.event_type}:`, event.properties);
      });
      console.groupEnd();

      // TODO: Send to analytics table once types are updated
      // const { error } = await supabase
      //   .from('analytics_events')
      //   .insert(eventsToSend);

      const error = null; // Temporary
      if (error) {
        console.error('Failed to send telemetry events:', error);
        // Re-queue events for retry
        this.events.unshift(...eventsToSend);
      }
    } catch (error) {
      console.error('Telemetry flush error:', error);
    }

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }

  // Specific event tracking methods
  trackRequirementStatusChanged(
    requirementId: string,
    oldStatus: string,
    newStatus: string,
    userId?: string,
    tenantId?: string
  ) {
    this.track('RequirementStatusChanged', {
      requirement_id: requirementId,
      old_status: oldStatus,
      new_status: newStatus,
    }, userId, tenantId);
  }

  trackSubcontractorActivated(
    subcontractorId: string,
    userId?: string,
    tenantId?: string
  ) {
    this.track('SubActivated', {
      subcontractor_id: subcontractorId,
    }, userId, tenantId);
  }

  trackSubcontractorDeactivated(
    subcontractorId: string,
    userId?: string,
    tenantId?: string
  ) {
    this.track('SubDeactivated', {
      subcontractor_id: subcontractorId,
    }, userId, tenantId);
  }

  // legacy removed
  trackComplianceFlagsChanged() {}

  trackDocumentUploaded(
    requirementId: string,
    documentId: string,
    fileSize: number,
    mimeType: string,
    userId?: string,
    tenantId?: string
  ) {
    this.track('DocumentUploaded', {
      requirement_id: requirementId,
      document_id: documentId,
      file_size: fileSize,
      mime_type: mimeType,
    }, userId, tenantId);
  }

  trackReviewCompleted(
    requirementId: string,
    documentId: string,
    decision: 'approved' | 'rejected',
    reviewerId?: string,
    tenantId?: string
  ) {
    this.track('ReviewCompleted', {
      requirement_id: requirementId,
      document_id: documentId,
      decision,
    }, reviewerId, tenantId);
  }
}

// Export singleton instance
export const telemetry = new TelemetryService();