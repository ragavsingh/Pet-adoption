import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { isRealMode, isUUID } from '../utils/authMode';

export type EmailEventType =
  | 'adoption_request_created'
  | 'adoption_request_approved'
  | 'adoption_request_rejected'
  | 'more_information_requested'
  | 'trial_started'
  | 'trial_extension_requested'
  | 'trial_extension_approved'
  | 'trial_extension_rejected'
  | 'adoption_completed'
  | 'provider_verified';

export const emailNotificationService = {
  /**
   * Securely triggers server-side transactional email dispatch for legitimate business events.
   * Strictly no-op in demo mode.
   * Client NEVER specifies recipient email or email content.
   */
  async dispatchEmail(eventType: EmailEventType, relatedEntityId: string): Promise<void> {
    if (!isRealMode() || !isUUID(relatedEntityId)) {
      // Demo accounts and demo workflows NEVER send transactional emails
      return;
    }

    try {
      // 1. Attempt Supabase Edge Function if cloud-deployed
      const { error: fnError } = await supabase.functions.invoke('send-transactional-email', {
        body: { event_type: eventType, related_entity_id: relatedEntityId },
      });

      if (!fnError) {
        return;
      }

      // 2. Fallback to local server API middleware
      const session = (await supabase.auth.getSession()).data.session;
      await fetch('/api/send-transactional-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({
          event_type: eventType,
          related_entity_id: relatedEntityId,
        }),
      });
    } catch (err) {
      // Non-blocking: background email dispatch notice (core database transaction is already committed)
      console.warn('[emailNotificationService] Background transactional email notice:', err);
    }
  },
};
