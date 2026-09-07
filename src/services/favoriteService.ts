import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { isRealMode, isUUID } from '../utils/authMode';
import { toPetDatabaseUUID } from '../utils/petIdMapper';
import { Pet } from '../types/pet';
import { petService, mapPetFromDatabase } from './petService';

// ==============================================================================
// 1. HELPER UTILITIES (PER-USER LOCALSTORAGE ISOLATION)
// ==============================================================================

function getUserFavoritesKey(userId: string): string {
  return `pet_favorites_${userId}`;
}

export function getExcludedPetIdsForAdopter(userId: string): string[] {
  if (!userId) return [];
  const excluded: string[] = [];

  try {
    const raw = localStorage.getItem('pet_adoption_requests_v4');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((r: any) => {
          const isUser = r.adopterId === userId || r.adopter_id === userId;
          const status = (r.status || '').toLowerCase();
          const isApprovedOrCompleted =
            status === 'approved' ||
            status === 'trial' ||
            status === 'completed' ||
            Boolean(r.trial);

          if (isUser && isApprovedOrCompleted) {
            if (r.petId) {
              excluded.push(r.petId);
              excluded.push(toPetDatabaseUUID(r.petId));
            }
            if (r.pet_id) {
              excluded.push(r.pet_id);
              excluded.push(toPetDatabaseUUID(r.pet_id));
            }
          }
        });
      }
    }
  } catch (e) {
    console.warn('[favoriteService] Failed to check adoption requests for favorites filter', e);
  }

  // Default demo state: usr_raghav already has an approved foster trial for Bruno (pet_bruno)
  if (userId === 'usr_raghav') {
    if (!excluded.includes('pet_bruno')) excluded.push('pet_bruno');
    const brunoUUID = toPetDatabaseUUID('pet_bruno');
    if (!excluded.includes(brunoUUID)) excluded.push(brunoUUID);
  }

  return excluded;
}

function loadLocalFavorites(userId: string): string[] {
  if (!userId) return [];
  let favs: string[] = [];
  try {
    const raw = localStorage.getItem(getUserFavoritesKey(userId));
    if (raw) {
      favs = JSON.parse(raw);
    } else if (userId === 'usr_raghav') {
      // Default demo favorite ONLY for the demo adopter 'usr_raghav' (Available companion with no active trial)
      favs = ['pet_luna'];
    }
  } catch (e) {
    console.warn('[favoriteService] Failed to load favorites from storage', e);
  }

  // Automatically remove any pet where the user already has an active trial, approved request, or completed adoption
  const excluded = getExcludedPetIdsForAdopter(userId);
  const cleaned = favs.filter(
    (id) => !excluded.includes(id) && !excluded.includes(toPetDatabaseUUID(id))
  );

  if (cleaned.length !== favs.length || !localStorage.getItem(getUserFavoritesKey(userId))) {
    saveLocalFavorites(userId, cleaned);
  }

  return cleaned;
}

function saveLocalFavorites(userId: string, favs: string[]): void {
  if (!userId) return;
  try {
    localStorage.setItem(getUserFavoritesKey(userId), JSON.stringify(favs));
  } catch (e) {
    console.warn('[favoriteService] Failed to save favorites to storage', e);
  }
}

// ==============================================================================
// 2. FAVORITE SERVICE (DUAL-MODE + PER-USER ISOLATION)
// ==============================================================================
export const favoriteService = {
  /**
   * Synchronously checks if a pet is already part of the user's active trial or adopted family.
   */
  isPetInTrialOrAdopted(petId: string, userId?: string): boolean {
    if (!userId) return false;
    const excluded = getExcludedPetIdsForAdopter(userId);
    const targetPetId = toPetDatabaseUUID(petId);
    return excluded.includes(petId) || excluded.includes(targetPetId);
  },

  /**
   * Retrieves the list of favorited pet IDs for the current user.
   * If not logged in, returns empty array [].
   * In real mode: queries Supabase `public.favorites` for `adopter_id`.
   * In demo mode: loads from per-user localStorage.
   */
  async getFavorites(userId?: string): Promise<string[]> {
    let currentUserId = userId;

    if (!currentUserId && isRealMode()) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        currentUserId = authData.user?.id;
      } catch (err) {
        console.warn('[favoriteService] Exception resolving auth user:', err);
      }
    }

    // Crucial Privacy Check: Unauthenticated guests NEVER have favorites
    if (!currentUserId) {
      return [];
    }

    if (isRealMode() && isUUID(currentUserId)) {
      try {
        const { data, error } = await (supabase as any)
          .from('favorites')
          .select('pet_id')
          .eq('adopter_id', currentUserId);

        if (!error && Array.isArray(data)) {
          const excluded = getExcludedPetIdsForAdopter(currentUserId);
          return data
            .map((row: { pet_id: string }) => row.pet_id)
            .filter((id: string) => !excluded.includes(id));
        }

        if (error) {
          console.warn('[favoriteService] Error loading favorites from Supabase:', error.message);
        }
      } catch (err) {
        console.warn('[favoriteService] Exception querying favorites:', err);
      }
    }

    return loadLocalFavorites(currentUserId);
  },

  /**
   * Synchronous check against a known list of favorite IDs (O(1) memory lookup).
   */
  isFavorite(petId: string, currentFavs?: string[]): boolean {
    if (currentFavs) {
      return currentFavs.includes(petId);
    }
    return false;
  },

  /**
   * Adds a pet to the user's favorites.
   * In real mode: inserts into `public.favorites` with `adopter_id = auth.uid()`.
   * In demo mode: appends to user-specific localStorage.
   */
  async addFavorite(petId: string, userId?: string): Promise<void> {
    const targetPetId = toPetDatabaseUUID(petId);
    let currentUserId = userId;

    if (isRealMode()) {
      if (!currentUserId) {
        const { data: authData } = await supabase.auth.getUser();
        currentUserId = authData.user?.id;
      }

      if (!currentUserId) {
        throw new Error('Please log in to save pets to your favorites.');
      }

      if (this.isPetInTrialOrAdopted(petId, currentUserId) || this.isPetInTrialOrAdopted(targetPetId, currentUserId)) {
        throw new Error('This companion is already part of your active trial or adoption journey! ❤️');
      }

      if (isUUID(targetPetId)) {
        const { error } = await (supabase as any)
          .from('favorites')
          .upsert(
            {
              adopter_id: currentUserId,
              pet_id: targetPetId,
            },
            { onConflict: 'adopter_id,pet_id', ignoreDuplicates: true }
          );

        if (error) {
          console.error('[favoriteService] Error adding favorite to Supabase:', error);
          throw error;
        }
        return;
      }
    }

    if (!currentUserId) {
      throw new Error('Please log in to save pets to your favorites.');
    }

    if (this.isPetInTrialOrAdopted(petId, currentUserId) || this.isPetInTrialOrAdopted(targetPetId, currentUserId)) {
      throw new Error('This companion is already part of your active trial or adoption journey! ❤️');
    }

    // Demo Mode: per-user storage
    const favs = loadLocalFavorites(currentUserId);
    if (!favs.includes(petId)) {
      favs.push(petId);
      saveLocalFavorites(currentUserId, favs);
    }
  },

  /**
   * Removes a pet from the user's favorites.
   * In real mode: deletes from `public.favorites` where `adopter_id = auth.uid()`.
   * In demo mode: removes from user-specific localStorage.
   */
  async removeFavorite(petId: string, userId?: string): Promise<void> {
    const targetPetId = toPetDatabaseUUID(petId);
    let currentUserId = userId;

    if (isRealMode()) {
      if (!currentUserId) {
        const { data: authData } = await supabase.auth.getUser();
        currentUserId = authData.user?.id;
      }

      if (!currentUserId) {
        throw new Error('Please log in to manage your favorites.');
      }

      if (isUUID(targetPetId)) {
        const { error } = await (supabase as any)
          .from('favorites')
          .delete()
          .eq('adopter_id', currentUserId)
          .eq('pet_id', targetPetId);

        if (error) {
          console.error('[favoriteService] Error removing favorite from Supabase:', error);
          throw error;
        }
        return;
      }
    }

    if (!currentUserId) return;

    // Demo Mode: per-user storage
    let favs = loadLocalFavorites(currentUserId);
    favs = favs.filter((id) => id !== petId);
    saveLocalFavorites(currentUserId, favs);
  },

  /**
   * Toggles favorite status for a pet.
   * Returns `true` if the pet is now favorited, or `false` if removed.
   */
  async toggleFavorite(petId: string, isCurrentlyFavorite: boolean, userId?: string): Promise<boolean> {
    if (isCurrentlyFavorite) {
      await this.removeFavorite(petId, userId);
      return false;
    } else {
      await this.addFavorite(petId, userId);
      return true;
    }
  },

  /**
   * Loads full Pet objects for all favorited pets in a single efficient query.
   * Avoids N+1 requests.
   */
  async getFavoritePets(userId?: string): Promise<Pet[]> {
    let currentUserId = userId;

    if (!currentUserId && isRealMode()) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        currentUserId = authData.user?.id;
      } catch (err) {
        console.warn('[favoriteService] Exception resolving auth user:', err);
      }
    }

    // Unauthenticated visitors have NO favorites
    if (!currentUserId) return [];

    if (isRealMode() && isUUID(currentUserId)) {
      try {
        const { data, error } = await (supabase as any)
          .from('favorites')
          .select(`
            pet_id,
            pets (
              *,
              pet_images ( image_url, display_order, is_primary ),
              profiles!provider_id ( full_name, phone, city, locality, profile_image_url ),
              provider_profiles!provider_id ( organization_name, provider_type, verification_status, description, city, locality )
            )
          `)
          .eq('adopter_id', currentUserId);

        if (!error && Array.isArray(data)) {
          const excluded = getExcludedPetIdsForAdopter(currentUserId);
          return data
            .filter((item: any) => item.pets !== null && !excluded.includes(item.pets.id))
            .map((item: any) => mapPetFromDatabase(item.pets));
        }

        if (error) {
          console.warn('[favoriteService] Error loading favorite pets from Supabase:', error.message);
        }
      } catch (err) {
        console.warn('[favoriteService] Exception loading favorite pets:', err);
      }
    }

    // Demo Mode: match user's demo favorite IDs against loaded pets
    const userFavs = loadLocalFavorites(currentUserId);
    if (userFavs.length === 0) return [];
    const all = await petService.getAllPets();
    return all.filter((p) => userFavs.includes(p.id));
  },
};
