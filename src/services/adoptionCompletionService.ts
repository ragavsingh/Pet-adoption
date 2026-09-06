import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { isRealMode, isUUID } from '../utils/authMode';
import { AdoptionRecord, AdoptionCompletionResult } from '../types/adoption';
import { adoptionService } from './adoptionService';
import { emailNotificationService } from './emailNotificationService';

function mapAdoptionRecordFromDatabase(row: any): AdoptionRecord {
  let petImage = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800';
  if (row.pets?.pet_images && Array.isArray(row.pets.pet_images) && row.pets.pet_images.length > 0) {
    const sorted = [...row.pets.pet_images].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    petImage = sorted[0].image_url;
  }

  const adopterName = row.adopter_profile?.full_name || 'Adopter';
  const providerName = row.provider_profile?.full_name || 'Rescue Provider';
  const providerLocation = row.provider_profile?.city
    ? `${row.provider_profile.locality ? `${row.provider_profile.locality}, ` : ''}${row.provider_profile.city}`
    : 'Sanctuary';

  return {
    id: row.id,
    petId: row.pet_id,
    adopterId: row.adopter_id,
    providerId: row.provider_id,
    adoptionRequestId: row.adoption_request_id,
    adoptionDate: row.adoption_date || row.created_at,
    status: row.status || 'completed',
    certificateNumber: row.certificate_number,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    petName: row.pets?.name || 'Pet',
    petBreed: row.pets?.breed || 'Companion',
    petImage,
    adopterName,
    providerName,
    providerLocation,
  };
}

export const adoptionCompletionService = {
  /**
   * Finalizes a Foster-to-Own trial and makes the adoption official.
   * Real mode: Executes atomic PostgreSQL RPC `adopter_complete_adoption`.
   * Demo mode: Simulates official adoption completion and certificate generation in local storage.
   */
  async makeAdoptionOfficial(
    trialOrRequestId: string,
    notes?: string
  ): Promise<AdoptionCompletionResult> {
    if (isSupabaseConfigured() && isUUID(trialOrRequestId)) {
      const { data, error } = await (supabase as any).rpc('adopter_complete_adoption', {
        p_identifier: trialOrRequestId,
        p_notes: notes || null,
      });

      if (error) {
        console.error('[adoptionCompletionService] Error completing adoption via RPC:', error);
        throw new Error(error.message || 'Failed to finalize adoption. Please try again.');
      }

      // Dispatch background transactional email (non-blocking)
      emailNotificationService.dispatchEmail('adoption_completed', data?.adoption_id || trialOrRequestId);

      return {
        success: Boolean(data?.success),
        alreadyCompleted: Boolean(data?.already_completed),
        adoptionId: data?.adoption_id,
        petId: data?.pet_id,
        certificateNumber: data?.certificate_number,
        adoptionDate: data?.adoption_date || new Date().toISOString(),
        status: data?.status || 'completed',
      };
    }

    // Demo Mode Simulation
    await adoptionService.makeAdoptionOfficial(trialOrRequestId);
    const certNum = 'PA-DEMO-' + Date.now().toString().slice(-6);

    return {
      success: true,
      alreadyCompleted: false,
      adoptionId: `adp_${Date.now()}`,
      petId: 'pet_bruno',
      certificateNumber: certNum,
      adoptionDate: new Date().toISOString(),
      status: 'completed',
    };
  },

  /**
   * Retrieves an official adoption record for a given pet.
   */
  async getAdoptionRecordByPetId(petId: string): Promise<AdoptionRecord | null> {
    if (isSupabaseConfigured() && isUUID(petId)) {
      try {
        // Try the SECURITY DEFINER RPC first to bypass RLS restrictions for official certificate viewing
        const { data: rpcData, error: rpcError } = await (supabase as any).rpc(
          'get_adoption_record_by_pet_id',
          { p_pet_id: petId }
        );

        if (!rpcError && rpcData) {
          return mapAdoptionRecordFromDatabase(rpcData);
        }

        // Fallback to direct table query
        const { data, error } = await (supabase as any)
          .from('adoptions')
          .select(`
            *,
            pets (
              id, name, breed,
              pet_images ( image_url, display_order )
            ),
            adopter_profile:profiles!adopter_id ( id, full_name ),
            provider_profile:profiles!provider_id ( id, full_name, city, locality )
          `)
          .eq('pet_id', petId)
          .eq('status', 'completed')
          .order('adoption_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          return mapAdoptionRecordFromDatabase(data);
        }
      } catch (err) {
        console.warn(`[adoptionCompletionService] Error loading adoption for pet ${petId}:`, err);
      }
    }

    // Demo Mode fallback for Bruno
    if (petId === 'pet_bruno') {
      return {
        id: 'adp_bruno_demo',
        petId: 'pet_bruno',
        adopterId: 'usr_raghav',
        providerId: 'prv_sarah',
        adoptionDate: new Date().toISOString(),
        status: 'completed',
        certificateNumber: 'PA-2026-BRUNO01',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        petName: 'Bruno',
        petBreed: 'Golden Retriever Mix',
        petImage: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=800',
        adopterName: 'Raghav Singh',
        providerName: "Sarah's Rescue Sanctuary",
        providerLocation: 'Bandra, Mumbai',
      };
    }

    return null;
  },

  /**
   * Retrieves all completed adoptions for a given user (as adopter or provider).
   */
  async getCompletedAdoptions(
    userId: string,
    role: 'adopter' | 'provider'
  ): Promise<AdoptionRecord[]> {
    if (isRealMode() && isUUID(userId)) {
      try {
        const queryCol = role === 'adopter' ? 'adopter_id' : 'provider_id';
        const { data, error } = await (supabase as any)
          .from('adoptions')
          .select(`
            *,
            pets (
              id, name, breed,
              pet_images ( image_url, display_order )
            ),
            adopter_profile:profiles!adopter_id ( id, full_name ),
            provider_profile:profiles!provider_id ( id, full_name, city, locality )
          `)
          .eq(queryCol, userId)
          .eq('status', 'completed')
          .order('adoption_date', { ascending: false });

        if (!error && Array.isArray(data)) {
          return data.map(mapAdoptionRecordFromDatabase);
        }
      } catch (err) {
        console.warn('[adoptionCompletionService] Error loading adoptions for user:', err);
      }
    }

    return [];
  },
};
