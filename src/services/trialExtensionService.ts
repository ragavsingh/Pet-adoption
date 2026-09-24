import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { isUUID } from '../utils/authMode';
import { TrialExtensionRequest } from '../types/adoptionRequest';
import { adoptionService } from './adoptionService';
import { emailNotificationService } from './emailNotificationService';
import { realtimeSync } from './realtimeSync';

export const trialExtensionService = {
  /**
   * Request a 3, 7, or 14-day extension for an active Foster-to-Own trial.
   * Real mode: invokes database RPC `adopter_request_trial_extension`.
   * Demo mode: updates local storage demo trial.
   */
  async requestExtension(
    trialId: string,
    requestedDays: 3 | 7 | 14,
    reason?: string
  ): Promise<TrialExtensionRequest> {
    if (isSupabaseConfigured() && isUUID(trialId)) {
      let targetTrialId = trialId;

      const { data: directTrial } = await (supabase as any)
        .from('foster_trials')
        .select('id')
        .eq('id', trialId)
        .maybeSingle();

      if (!directTrial) {
        const { data: linkedTrial } = await (supabase as any)
          .from('foster_trials')
          .select('id')
          .eq('adoption_request_id', trialId)
          .maybeSingle();

        if (linkedTrial) {
          targetTrialId = linkedTrial.id;
        }
      }

      const { data, error } = await (supabase as any).rpc('adopter_request_trial_extension', {
        p_trial_id: targetTrialId,
        p_requested_days: requestedDays,
        p_reason: reason || null,
      });

      if (error) {
        console.error('[trialExtensionService] Error submitting extension request:', error);
        throw new Error(error.message || 'Failed to submit trial extension request.');
      }

      // Dispatch background transactional email to provider (non-blocking)
      emailNotificationService.dispatchEmail('trial_extension_requested', targetTrialId);

      // Instant cross-component & cross-tab synchronization
      realtimeSync.notifyChange('foster_trial_updated', targetTrialId);
      realtimeSync.notifyChange('adoption_request_updated', targetTrialId);
      realtimeSync.notifyChange('notification_received');

      return {
        id: data?.extension_id,
        trialId: targetTrialId,
        requestedDays,
        reason,
        requestedAt: new Date().toISOString(),
        status: 'pending',
      };
    }

    // Demo Mode fallback
    await adoptionService.requestTrialExtension(trialId, requestedDays, reason);
    realtimeSync.notifyChange('foster_trial_updated', trialId);
    realtimeSync.notifyChange('adoption_request_updated', trialId);
    realtimeSync.notifyChange('notification_received');
    return {
      requestedDays,
      reason,
      requestedAt: new Date().toISOString(),
      status: 'pending',
    };
  },

  /**
   * Retrieves extension history for a trial.
   */
  async getExtensionsForTrial(trialId: string): Promise<TrialExtensionRequest[]> {
    if (isSupabaseConfigured() && isUUID(trialId)) {
      try {
        const { data, error } = await (supabase as any)
          .from('trial_extension_requests')
          .select('*')
          .eq('trial_id', trialId)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          return data.map((row) => ({
            id: row.id,
            trialId: row.trial_id,
            requestedDays: row.requested_days,
            reason: row.reason,
            requestedAt: row.created_at,
            status: row.status,
            reviewedBy: row.reviewed_by,
            reviewedAt: row.reviewed_at,
            providerResponse: row.provider_response,
          }));
        }
      } catch (err) {
        console.warn('[trialExtensionService] Error loading extensions:', err);
      }
    }

    return [];
  },

  /**
   * Approves a trial extension request as the pet's provider.
   * Real mode: invokes database RPC `provider_approve_trial_extension`.
   * Demo mode: updates demo request/trial in localStorage.
   */
  async approveExtension(
    extensionOrRequestId: string,
    responseNote?: string
  ): Promise<any> {
    if (isSupabaseConfigured() && isUUID(extensionOrRequestId)) {
      const passkey =
        (typeof window !== 'undefined'
          ? sessionStorage.getItem('pet_admin_session_passkey') ||
            localStorage.getItem('pet_admin_session_passkey')
          : null) || '';

      const { data, error } = await (supabase as any).rpc('provider_approve_trial_extension', {
        p_identifier: extensionOrRequestId,
        p_response_note: responseNote || null,
        p_passkey: passkey || undefined,
      });

      if (error) {
        console.error('[trialExtensionService] Error approving extension:', error);
        throw new Error(error.message || 'Failed to approve trial extension.');
      }

      // Dispatch background transactional email to adopter (non-blocking)
      emailNotificationService.dispatchEmail('trial_extension_approved', extensionOrRequestId);

      realtimeSync.notifyChange('foster_trial_updated', extensionOrRequestId);
      realtimeSync.notifyChange('adoption_request_updated', extensionOrRequestId);
      realtimeSync.notifyChange('notification_received');

      return data;
    }

    // Demo Mode fallback
    await adoptionService.respondToTrialExtension(extensionOrRequestId, true);
    realtimeSync.notifyChange('foster_trial_updated', extensionOrRequestId);
    realtimeSync.notifyChange('adoption_request_updated', extensionOrRequestId);
    realtimeSync.notifyChange('notification_received');
    return { success: true, status: 'approved' };
  },

  /**
   * Declines/rejects a trial extension request as the pet's provider.
   * Real mode: invokes database RPC `provider_reject_trial_extension`.
   * Demo mode: updates demo request/trial in localStorage.
   */
  async rejectExtension(
    extensionOrRequestId: string,
    reason?: string
  ): Promise<any> {
    if (isSupabaseConfigured() && isUUID(extensionOrRequestId)) {
      const passkey =
        (typeof window !== 'undefined'
          ? sessionStorage.getItem('pet_admin_session_passkey') ||
            localStorage.getItem('pet_admin_session_passkey')
          : null) || '';

      const { data, error } = await (supabase as any).rpc('provider_reject_trial_extension', {
        p_identifier: extensionOrRequestId,
        p_reason: reason || null,
        p_passkey: passkey || undefined,
      });

      if (error) {
        console.error('[trialExtensionService] Error rejecting extension:', error);
        throw new Error(error.message || 'Failed to decline trial extension.');
      }

      // Dispatch background transactional email to adopter (non-blocking)
      emailNotificationService.dispatchEmail('trial_extension_rejected', extensionOrRequestId);

      realtimeSync.notifyChange('foster_trial_updated', extensionOrRequestId);
      realtimeSync.notifyChange('adoption_request_updated', extensionOrRequestId);
      realtimeSync.notifyChange('notification_received');

      return data;
    }

    // Demo Mode fallback
    await adoptionService.respondToTrialExtension(extensionOrRequestId, false);
    realtimeSync.notifyChange('foster_trial_updated', extensionOrRequestId);
    realtimeSync.notifyChange('adoption_request_updated', extensionOrRequestId);
    realtimeSync.notifyChange('notification_received');
    return { success: true, status: 'declined' };
  },

  /**
   * Convenience dispatcher for approving or declining an extension request.
   */
  async respondToExtension(
    extensionOrRequestId: string,
    approved: boolean,
    responseNote?: string
  ): Promise<any> {
    if (approved) {
      return this.approveExtension(extensionOrRequestId, responseNote);
    }
    return this.rejectExtension(extensionOrRequestId, responseNote);
  },
};
