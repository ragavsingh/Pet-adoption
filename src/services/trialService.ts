import { supabase } from '../lib/supabase';
import { isRealMode, isUUID } from '../utils/authMode';
import { Trial, TrialStatus, TrialExtensionRequest } from '../types/adoptionRequest';
import { calculateTrialCountdown, TrialCountdownData } from '../components/common/TrialCountdown';

/**
 * Derives dynamic Foster-to-Own trial status from real dates and extension state.
 */
export function deriveTrialStatus(trial: Trial, countdown: TrialCountdownData): TrialStatus {
  if (trial.status === 'Adoption Completed') {
    return 'Adoption Completed';
  }
  if (trial.extensionRequested || trial.extension?.status === 'pending') {
    return 'Extension Requested';
  }
  if (trial.extension?.status === 'approved') {
    return 'Trial Extended';
  }
  if (countdown.isExpired) {
    return 'Trial Expired';
  }
  if (countdown.isEndingSoon) {
    return 'Ending Soon';
  }
  if (countdown.isUpcoming) {
    return 'Trial Starting';
  }
  return 'Trial Active';
}

/**
 * Maps a database row from public.foster_trials to frontend Trial interface.
 */
export function mapTrialFromDatabase(row: any): Trial {
  const startDate = row.start_date;
  const endDate = row.end_date;
  const countdown = calculateTrialCountdown(startDate, endDate);

  // Parse notes from journal_entries
  let notes: string[] = [];
  if (Array.isArray(row.journal_entries)) {
    notes = row.journal_entries.map((j: any) =>
      typeof j === 'string' ? j : j.entry || `Day ${j.day || 1}: ${j.note || ''}`
    );
  }

  // Parse latest extension request if joined
  let latestExt: TrialExtensionRequest | undefined;
  if (Array.isArray(row.trial_extension_requests) && row.trial_extension_requests.length > 0) {
    const sorted = [...row.trial_extension_requests].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const top = sorted[0];
    latestExt = {
      id: top.id,
      trialId: top.trial_id,
      requestedDays: top.requested_days,
      reason: top.reason,
      requestedAt: top.created_at,
      status: top.status,
      reviewedBy: top.reviewed_by,
      reviewedAt: top.reviewed_at,
      providerResponse: top.provider_response,
    };
  } else if (row.status === 'extension_requested') {
    latestExt = {
      trialId: row.id,
      requestedDays: 3,
      reason: 'Adopter requested additional trial bonding time.',
      requestedAt: row.updated_at || row.created_at || new Date().toISOString(),
      status: 'pending',
    };
  }

  const isExtRequested = latestExt?.status === 'pending' || row.status === 'extension_requested';

  const baseTrial: Trial = {
    id: row.id,
    petId: row.pet_id,
    adopterId: row.adopter_id,
    providerId: row.provider_id,
    adoptionRequestId: row.adoption_request_id,
    startDate,
    endDate,
    totalDays: countdown.totalDays,
    currentDay: countdown.currentDay,
    extensionRequested: isExtRequested,
    extension: latestExt,
    notes,
  };

  baseTrial.status = deriveTrialStatus(baseTrial, countdown);
  return baseTrial;
}

export const trialService = {
  /**
   * Retrieves the active foster trial for an adopter or provider.
   */
  async getActiveTrialForUser(userId: string, role: 'adopter' | 'provider'): Promise<Trial | null> {
    if (isRealMode() && isUUID(userId)) {
      try {
        const userCol = role === 'adopter' ? 'adopter_id' : 'provider_id';
        const { data, error } = await (supabase as any)
          .from('foster_trials')
          .select(`
            *,
            trial_extension_requests (*)
          `)
          .eq(userCol, userId)
          .in('status', [
            'upcoming', 'active', 'ending_soon', 'extension_requested', 'trial_extended', 'ready_for_official',
            'Trial Starting', 'Trial Active', 'Ending Soon', 'Extension Requested', 'Trial Extended', 'Ready to Make Official'
          ])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          return mapTrialFromDatabase(data);
        }
      } catch (err) {
        console.warn('[trialService] Error loading active trial from Supabase:', err);
      }
    }

    return null;
  },

  /**
   * Retrieves a foster trial by ID.
   */
  async getTrialById(trialId: string): Promise<Trial | null> {
    if (isRealMode() && isUUID(trialId)) {
      try {
        const { data, error } = await (supabase as any)
          .from('foster_trials')
          .select(`
            *,
            trial_extension_requests (*)
          `)
          .eq('id', trialId)
          .single();

        if (!error && data) {
          return mapTrialFromDatabase(data);
        }
      } catch (err) {
        console.warn(`[trialService] Error fetching trial ${trialId}:`, err);
      }
    }

    return null;
  },

  /**
   * Retrieves the active foster trial for a pet.
   */
  async getTrialForPet(petId: string): Promise<Trial | null> {
    if (isRealMode() && isUUID(petId)) {
      try {
        const { data, error } = await (supabase as any)
          .from('foster_trials')
          .select(`
            *,
            trial_extension_requests (*)
          `)
          .eq('pet_id', petId)
          .in('status', [
            'upcoming', 'active', 'ending_soon', 'extension_requested', 'trial_extended', 'ready_for_official',
            'Trial Starting', 'Trial Active', 'Ending Soon', 'Extension Requested', 'Trial Extended', 'Ready to Make Official'
          ])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          return mapTrialFromDatabase(data);
        }
      } catch (err) {
        console.warn(`[trialService] Error fetching trial for pet ${petId}:`, err);
      }
    }

    return null;
  },

  /**
   * Records a journal observation into the foster trial.
   */
  async addJournalEntry(trialId: string, entry: string): Promise<void> {
    const trimmed = (entry || '').trim();
    if (!trimmed) return;

    if (isRealMode() && isUUID(trialId)) {
      const { error } = await (supabase as any).rpc('add_trial_journal_entry', {
        p_trial_id: trialId,
        p_entry: trimmed,
      });

      if (error) {
        console.error('[trialService] Error adding journal entry via RPC:', error);
        throw new Error(error.message || 'Failed to save journal note.');
      }
      return;
    }

    // Demo Mode handled in FosterTrialCard local state
  },

  calculateTrialCountdown,
  deriveTrialStatus,
};
