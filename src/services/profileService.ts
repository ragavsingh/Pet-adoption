import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User, UserRole, AdopterProfile, ProviderProfile } from '../types/user';
import { DEMO_ADOPTER, DEMO_PROVIDER } from '../data/mockData';
import { Database } from '../lib/database.types';
import { resolveUserAvatar, isDummyPlaceholderPhoto } from '../utils/avatarUtils';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type AdopterProfileRow = Database['public']['Tables']['adopter_profiles']['Row'];
type ProviderProfileRow = Database['public']['Tables']['provider_profiles']['Row'];

/**
 * Utility to parse location strings (e.g. "Bandra West, Mumbai" or "Delhi")
 * into separate locality and city columns for PostgreSQL storage.
 */
function parseLocation(locationStr?: string): { city: string; locality: string | null } {
  if (!locationStr || !locationStr.trim()) {
    return { city: 'Mumbai', locality: null };
  }

  const parts = locationStr.split(',').map((p) => p.trim());
  if (parts.length >= 2) {
    return {
      locality: parts[0],
      city: parts[1],
    };
  }
  return {
    city: parts[0],
    locality: null,
  };
}

/**
 * Utility to format city and locality into a user-facing location string.
 */
function formatLocation(city?: string | null, locality?: string | null): string {
  if (locality && city) {
    return `${locality}, ${city}`;
  }
  return city || locality || 'India';
}

/**
 * Checks if a string is a placeholder or default generic name.
 */
export function isPlaceholderName(name?: string | null): boolean {
  if (!name || typeof name !== 'string') return true;
  const trimmed = name.trim().toLowerCase();
  return (
    trimmed === '' ||
    trimmed === 'new user' ||
    trimmed === 'member' ||
    trimmed === 'google user' ||
    trimmed === 'user' ||
    trimmed === 'undefined' ||
    trimmed === 'null' ||
    trimmed === 'anonymous'
  );
}

/**
 * Logically extracts the user's best human-readable name using priority hierarchy:
 * 1. Customized DB name (if not a generic placeholder)
 * 2. OAuth full_name or name from Google metadata
 * 3. OAuth given_name + family_name
 * 4. OAuth identity_data full_name/name
 * 5. Formatted email handle (e.g. "raghav.singh" -> "Raghav Singh")
 * 6. "Adopter"
 */
export function extractBestName(profileName?: string | null, authUser?: any): string {
  if (profileName && !isPlaceholderName(profileName)) {
    return profileName.trim();
  }

  const meta = authUser?.user_metadata || {};
  const oauthFullName = meta.full_name || meta.name;
  if (oauthFullName && !isPlaceholderName(oauthFullName)) {
    return oauthFullName.trim();
  }

  if (meta.given_name) {
    const combined = `${meta.given_name} ${meta.family_name || ''}`.trim();
    if (combined && !isPlaceholderName(combined)) {
      return combined;
    }
  }

  // Identity data fallback from OAuth provider
  const identityData = authUser?.identities?.[0]?.identity_data;
  if (identityData) {
    const idName = identityData.full_name || identityData.name;
    if (idName && !isPlaceholderName(idName)) {
      return idName.trim();
    }
  }

  // Format email handle as a clean capitalized name (e.g. "raghav.singh@..." -> "Raghav Singh")
  const email = authUser?.email || '';
  if (email && email.includes('@')) {
    const handle = email.split('@')[0];
    const cleaned = handle
      .replace(/[._-]/g, ' ')
      .replace(/\d+/g, '')
      .trim();

    if (cleaned.length >= 2) {
      return cleaned
        .split(' ')
        .filter(Boolean)
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
    return handle.charAt(0).toUpperCase() + handle.slice(1);
  }

  return 'Adopter';
}

export const profileService = {
  /**
   * Load the application profile for an authenticated Supabase user ID.
   * Merges base profile, adopter profile, or provider profile.
   * Gracefully falls back to auth metadata if profile row has not yet synced.
   */
  async loadUserProfile(userId: string, authUser?: any): Promise<User | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    try {
      // 1. Fetch base profile from public.profiles
      const { data: rawProfile, error: profileError } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.warn('Could not fetch user profile:', profileError.message);
      }

      const profile = rawProfile as ProfileRow | null;

      // Determine trusted role strictly from database (Zero-Trust Security)
      // Never allow client metadata to grant 'admin'
      let role: UserRole = 'adopter';
      if (profile?.role === 'admin') {
        role = 'admin';
      } else if (profile?.role === 'provider') {
        role = 'provider';
      } else if (profile?.role === 'adopter') {
        role = 'adopter';
      } else if (authUser?.user_metadata?.role === 'provider') {
        // Safe onboarding fallback for new providers during initial trigger sync
        role = 'provider';
      }

      // Logically resolve best name and avatar
      const name = extractBestName(profile?.full_name, authUser);
      const email = profile?.email || authUser?.email || '';
      
      // Google OAuth avatar sources
      const googleAvatar =
        authUser?.user_metadata?.avatar_url ||
        authUser?.user_metadata?.picture ||
        authUser?.identities?.[0]?.identity_data?.avatar_url ||
        authUser?.identities?.[0]?.identity_data?.picture;

      // Discard any unwanted placeholder/dummy stranger photos in database
      const validDbAvatar = (profile?.profile_image_url && !isDummyPlaceholderPhoto(profile.profile_image_url))
        ? profile.profile_image_url
        : null;

      const chosenAvatar = validDbAvatar || googleAvatar;
      const avatar = resolveUserAvatar({
        avatar: chosenAvatar,
        name,
        email,
      });

      // If database has a placeholder name, missing avatar, or a dummy photo, sync real Google/resolved avatar immediately
      if (
        isSupabaseConfigured() &&
        (isPlaceholderName(profile?.full_name) || !profile?.profile_image_url || isDummyPlaceholderPhoto(profile?.profile_image_url)) &&
        name &&
        !isPlaceholderName(name)
      ) {
        (supabase as any)
          .from('profiles')
          .update({
            full_name: name,
            profile_image_url: avatar,
          })
          .eq('id', userId)
          .then(() => {})
          .catch((err: any) => console.warn('Background profile sync notice:', err?.message));
      }

      const userObject: User = {
        id: userId,
        name,
        email,
        role,
        avatar,
      };

      // 2. Fetch specialized role profiles
      if (role === 'adopter') {
        const { data: rawAdopter } = await (supabase as any)
          .from('adopter_profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        const adopterData = rawAdopter as AdopterProfileRow | null;

        if (adopterData) {
          userObject.adopterProfile = {
            id: userId,
            name,
            email,
            phone: profile?.phone || '',
            location: formatLocation(profile?.city, profile?.locality),
            avatar,
            homeType: (adopterData.housing_type as any) || 'Apartment',
            workType: (adopterData.work_type as any) || 'Hybrid',
            timeAway: (adopterData.time_away as any) || 'Under 4 hours',
            activityLevel: (adopterData.activity_level as any) || 'Moderate',
            children: (adopterData.children as any) || 'None',
            existingPets: (adopterData.existing_pets as any) || 'None',
            petExperience: (adopterData.experience_with_pets as any) || 'Moderate experience',
            preferredPetType: adopterData.preferred_pet_types?.[0] || 'Dog',
            preferredSize: adopterData.preferred_size?.[0] || 'Medium',
            preferredAge: 'Young adult (1-3 years)',
            whyTheyWantToAdopt: adopterData.why_they_want_to_adopt || 'Looking for a loving pet companion',
            profileCompletion: adopterData.profile_completion || 30,
          };
        } else {
          // Provide baseline adopter profile from auth state
          userObject.adopterProfile = {
            ...DEMO_ADOPTER,
            id: userId,
            name,
            email,
            phone: profile?.phone || '',
            location: formatLocation(profile?.city, profile?.locality),
            avatar,
            profileCompletion: 25,
          };
        }
      } else if (role === 'provider') {
        const { data: rawProvider } = await (supabase as any)
          .from('provider_profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        const providerData = rawProvider as ProviderProfileRow | null;

        if (providerData) {
          userObject.providerProfile = {
            id: userId,
            name,
            organizationName: providerData.organization_name || undefined,
            email,
            phone: profile?.phone || '',
            location: formatLocation(providerData.city || profile?.city, providerData.locality || profile?.locality),
            avatar,
            verified: providerData.verification_status === 'verified',
            about: providerData.description || 'Dedicated pet caregiver and shelter organization.',
            activeListingsCount: providerData.active_listings_count || 0,
            successfulAdoptionsCount: providerData.successful_adoptions_count || 0,
          };
        } else {
          userObject.providerProfile = {
            id: userId,
            name,
            email,
            phone: profile?.phone || '',
            location: formatLocation(profile?.city, profile?.locality),
            avatar,
            organizationName: undefined,
            about: '',
            activeListingsCount: 0,
            successfulAdoptionsCount: 0,
            verified: false,
          };
        }
      }

      return userObject;
    } catch (err) {
      console.error('Error in profileService.loadUserProfile:', err);
      return null;
    }
  },

  /**
   * Update adopter profile in Supabase:
   * Synchronizes both public.profiles and public.adopter_profiles under auth.uid().
   */
  async updateAdopterProfile(userId: string, updates: Partial<AdopterProfile>): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) return { success: true };

    try {
      const { city, locality } = parseLocation(updates.location);

      // 1. Update base user profile
      const { error: baseError } = await (supabase as any)
        .from('profiles')
        .update({
          full_name: updates.name,
          phone: updates.phone,
          city,
          locality,
          profile_image_url: updates.avatar,
        })
        .eq('id', userId);

      if (baseError) {
        console.warn('Error updating base profile:', baseError.message);
      }

      // 2. Upsert adopter profile record
      const { error: adopterError } = await (supabase as any)
        .from('adopter_profiles')
        .upsert({
          id: userId,
          housing_type: updates.homeType,
          work_type: updates.workType,
          time_away: updates.timeAway,
          activity_level: updates.activityLevel,
          children: updates.children,
          existing_pets: updates.existingPets,
          experience_with_pets: updates.petExperience,
          preferred_pet_types: updates.preferredPetType ? [updates.preferredPetType] : undefined,
          preferred_size: updates.preferredSize ? [updates.preferredSize] : undefined,
          why_they_want_to_adopt: updates.whyTheyWantToAdopt,
          profile_completion: updates.profileCompletion,
        });

      if (adopterError) {
        throw adopterError;
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update adopter profile.' };
    }
  },

  /**
   * Update provider profile in Supabase:
   * Synchronizes public.profiles and public.provider_profiles under auth.uid().
   * Note: Does NOT modify verification_status or role.
   */
  async updateProviderProfile(userId: string, updates: Partial<ProviderProfile>): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) return { success: true };

    try {
      const { city, locality } = parseLocation(updates.location);

      // 1. Update base user profile
      const baseUpdatePayload: any = {
        full_name: updates.name,
        phone: updates.phone,
        city,
        locality,
      };
      if (updates.avatar !== undefined) {
        baseUpdatePayload.profile_image_url = updates.avatar;
      }

      const { error: baseError } = await (supabase as any)
        .from('profiles')
        .update(baseUpdatePayload)
        .eq('id', userId);

      if (baseError) {
        console.warn('Error updating base profile:', baseError.message);
      }

      // 2. Upsert provider profile record (verification_status is untouched)
      const { error: providerError } = await (supabase as any)
        .from('provider_profiles')
        .upsert({
          id: userId,
          organization_name: updates.organizationName,
          description: updates.about,
          city,
          locality,
        });

      if (providerError) {
        throw providerError;
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update provider profile.' };
    }
  },
};
