import { Pet, PetStatus, PetSpecies, PetSize, PetGender, VaccinationStatus, SterilizationStatus } from '../types/pet';
import { DEMO_PETS } from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { petImageService } from './petImageService';
import { realtimeSync } from './realtimeSync';

const STORAGE_KEY = 'pet_adoption_pets_v3';

// ==============================================================================
// 1. LOCAL DEMO STORAGE HELPERS
// ==============================================================================
function loadDemoPets(): Pet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= DEMO_PETS.length) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[petService] Failed to load pets from storage', e);
  }
  saveDemoPets(DEMO_PETS);
  return DEMO_PETS;
}

function saveDemoPets(pets: Pet[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pets));
  } catch (e) {
    console.warn('[petService] Failed to save pets to storage', e);
  }
}

// ==============================================================================
// 2. HELPER UTILITIES
// ==============================================================================
import { isRealMode, isUUID } from '../utils/authMode';
import { toPetDatabaseUUID } from '../utils/petIdMapper';
import { resolveUserAvatar } from '../utils/avatarUtils';
export { isUUID };

function normalizeStatus(dbStatus: string): PetStatus {
  switch (dbStatus?.toLowerCase()) {
    case 'available':
      return 'Available';
    case 'pending':
    case 'adoption pending':
      return 'Adoption Pending';
    case 'trial':
    case 'adoption requested':
      return 'Adoption Requested';
    case 'adopted':
      return 'Adopted';
    case 'paused':
      return 'Paused';
    case 'draft':
      return 'Draft';
    case 'unavailable':
    case 'archived':
      return 'Unavailable';
    default:
      return 'Available';
  }
}

// ==============================================================================
// 3. DATABASE ADAPTER (mapPetFromDatabase)
// ==============================================================================
export function mapPetFromDatabase(
  row: any,
  imagesList?: string[],
  providerProfile?: any,
  userProfile?: any
): Pet {
  // Extract images: first from joined relation, then parameter, then fallback
  let images: string[] = [];
  if (Array.isArray(row.pet_images) && row.pet_images.length > 0) {
    const sortedImages = [...row.pet_images].sort(
      (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
    );
    images = sortedImages.map((img: any) => img.image_url);
  } else if (imagesList && imagesList.length > 0) {
    images = imagesList;
  }

  if (images.length === 0) {
    images = [
      row.species?.toLowerCase() === 'cat'
        ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=1200'
        : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1200',
    ];
  }

  // Location string: "Locality, City" or "City"
  const location = row.locality ? `${row.locality}, ${row.city}` : row.city || 'Mumbai';

  // Personality tags
  const tags: string[] = [];
  if (Array.isArray(row.temperament)) tags.push(...row.temperament);
  if (Array.isArray(row.personality)) tags.push(...row.personality);
  const personalityTags = tags.length > 0 ? Array.from(new Set(tags)) : ['Friendly', 'Loving'];

  // Stats
  const rawStats = typeof row.stats === 'object' && row.stats !== null ? row.stats : {};
  const stats = {
    energy: typeof rawStats.energy === 'number' ? rawStats.energy : 70,
    friendliness: typeof rawStats.friendliness === 'number' ? rawStats.friendliness : 90,
    trainability: typeof rawStats.trainability === 'number' ? rawStats.trainability : 75,
    independence: typeof rawStats.independence === 'number' ? rawStats.independence : 50,
  };

  // Provider insight
  const rawInsight = typeof row.provider_insight === 'object' && row.provider_insight !== null ? row.provider_insight : {};
  const providerInsight = {
    personality: rawInsight.personality || 'Affectionate, gentle, and eager to bond.',
    habits: rawInsight.habits || 'Enjoys resting near human companionship.',
    likes: rawInsight.likes || 'Treats, gentle head pats, and calm walks.',
    dislikes: rawInsight.dislikes || 'Sudden loud noises.',
    behavior: rawInsight.behavior || row.training_information || 'House trained and responsive to voice cues.',
    specialCare: rawInsight.specialCare || 'Standard routine grooming and regular meals.',
    dailyRoutine: rawInsight.dailyRoutine || 'Morning walk, quiet midday rest, evening playtime and dinner.',
  };

  // Provider info from join
  const joinedProfile = row.profiles || userProfile;
  const joinedProvider = row.provider_profiles || providerProfile;

  const provider = {
    id: row.provider_id,
    name: joinedProfile?.full_name || joinedProvider?.organization_name || 'Pet Care Provider',
    title: joinedProvider?.provider_type === 'shelter' ? 'Verified Shelter' : 'Verified Pet Provider',
    location: joinedProfile?.city
      ? `${joinedProfile.locality ? `${joinedProfile.locality}, ` : ''}${joinedProfile.city}`
      : (joinedProvider?.city || 'Mumbai'),
    verified: joinedProvider?.verification_status === 'verified',
    avatar: resolveUserAvatar({
      avatar: joinedProfile?.profile_image_url,
      name: joinedProfile?.full_name || joinedProvider?.organization_name || 'Pet Care Provider',
      email: joinedProfile?.email,
    }),
    about: joinedProvider?.description || joinedProfile?.bio || 'Dedicated rescue foster caregiver.',
    phone: joinedProfile?.phone || undefined,
  };

  // Capitalized species, gender, size
  const species = (row.species?.charAt(0).toUpperCase() + row.species?.slice(1).toLowerCase()) as PetSpecies;
  const gender = (row.gender?.charAt(0).toUpperCase() + row.gender?.slice(1).toLowerCase()) as PetGender;
  const size = (row.size?.charAt(0).toUpperCase() + row.size?.slice(1).toLowerCase()) as PetSize;

  return {
    id: row.id,
    name: row.name,
    species: ['Dog', 'Cat', 'Other'].includes(species) ? species : 'Dog',
    breed: row.breed,
    age: row.age,
    gender: ['Male', 'Female'].includes(gender) ? gender : 'Male',
    size: ['Small', 'Medium', 'Large'].includes(size) ? size : 'Medium',
    location,
    images,
    personalityTags,
    stats,
    goodWithChildren: Boolean(row.good_with_children),
    goodWithDogs: Boolean(row.good_with_dogs),
    goodWithCats: Boolean(row.good_with_cats),
    apartmentFriendly: Boolean(row.apartment_friendly),
    vaccination: (row.vaccination_status || 'Fully Vaccinated') as VaccinationStatus,
    sterilization: (row.sterilization_status || 'Sterilized') as SterilizationStatus,
    healthInfo: row.health_information || 'Routine health checkups up to date.',
    specialNeeds: row.special_needs || undefined,
    description: row.description || '',
    providerInsight,
    provider,
    status: normalizeStatus(row.adoption_status),
    createdAt: row.created_at || new Date().toISOString(),
  };
}

// ==============================================================================
// 4. FILTER INTERFACE & LOCAL FILTER HELPER
// ==============================================================================
export interface PetFilterOptions {
  search?: string;
  species?: string;
  breed?: string;
  ageGroup?: string;
  gender?: string;
  size?: string;
  location?: string;
  energyLevel?: string;
  goodWithChildren?: boolean;
  goodWithDogs?: boolean;
  goodWithCats?: boolean;
  apartmentFriendly?: boolean;
  status?: PetStatus | 'All' | string;
  sortBy?: 'newest' | 'name' | 'age';
}

function filterPetsLocally(list: Pet[], filters?: PetFilterOptions): Pet[] {
  let result = [...list];
  if (!filters) return result;

  if (filters.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.breed.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.personalityTags.some((t) => t.toLowerCase().includes(q))
    );
  }

  if (filters.species && filters.species !== 'All') {
    result = result.filter((p) => p.species.toLowerCase() === filters.species!.toLowerCase());
  }

  if (filters.gender && filters.gender !== 'All') {
    result = result.filter((p) => p.gender.toLowerCase() === filters.gender!.toLowerCase());
  }

  if (filters.size && filters.size !== 'All') {
    result = result.filter((p) => p.size.toLowerCase() === filters.size!.toLowerCase());
  }

  if (filters.location && filters.location !== 'All') {
    result = result.filter((p) => p.location.toLowerCase().includes(filters.location!.toLowerCase()));
  }

  if (filters.goodWithChildren) {
    result = result.filter((p) => p.goodWithChildren);
  }
  if (filters.goodWithDogs) {
    result = result.filter((p) => p.goodWithDogs);
  }
  if (filters.goodWithCats) {
    result = result.filter((p) => p.goodWithCats);
  }
  if (filters.apartmentFriendly) {
    result = result.filter((p) => p.apartmentFriendly);
  }

  if (filters.status && filters.status !== 'All') {
    const target = filters.status.toLowerCase();
    if (target === 'available') {
      result = result.filter((p) => p.status === 'Available');
    } else if (target === 'adoption pending' || target === 'pending') {
      result = result.filter((p) => p.status === 'Adoption Pending' || p.status === 'Adoption Requested');
    } else if (target === 'adopted') {
      result = result.filter((p) => p.status === 'Adopted');
    } else {
      result = result.filter((p) => p.status.toLowerCase() === target);
    }
  }

  if (filters.sortBy === 'newest') {
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (filters.sortBy === 'name') {
    result.sort((a, b) => a.name.localeCompare(b.name));
  }

  return result;
}

// ==============================================================================
// 5. PET SERVICE (DUAL-MODE + DATABASE INTEGRATION)
// ==============================================================================
export const petService = {
  /**
   * Retrieves pets matching filters.
   * In real mode: queries Supabase `public.pets` with joined images and provider info.
   * Gracefully falls back to demo pets if Supabase contains no records or is unconfigured.
   */
  async getAllPets(filters?: PetFilterOptions): Promise<Pet[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = (supabase as any)
          .from('pets')
          .select(`
            *,
            pet_images ( image_url, display_order, is_primary ),
            profiles!provider_id ( full_name, phone, city, locality, profile_image_url ),
            provider_profiles!provider_id ( organization_name, provider_type, verification_status, description, city, locality )
          `);

        // Text search
        if (filters?.search && filters.search.trim()) {
          const q = filters.search.trim();
          query = query.or(`name.ilike.%${q}%,breed.ilike.%${q}%,city.ilike.%${q}%,description.ilike.%${q}%`);
        }

        // Species
        if (filters?.species && filters.species !== 'All') {
          query = query.ilike('species', filters.species);
        }

        // Gender
        if (filters?.gender && filters.gender !== 'All') {
          query = query.ilike('gender', filters.gender);
        }

        // Size
        if (filters?.size && filters.size !== 'All') {
          query = query.ilike('size', filters.size);
        }

        // Location
        if (filters?.location && filters.location !== 'All') {
          query = query.or(`city.ilike.%${filters.location}%,locality.ilike.%${filters.location}%`);
        }

        // Compatibility
        if (filters?.goodWithChildren) query = query.eq('good_with_children', true);
        if (filters?.goodWithDogs) query = query.eq('good_with_dogs', true);
        if (filters?.goodWithCats) query = query.eq('good_with_cats', true);
        if (filters?.apartmentFriendly) query = query.eq('apartment_friendly', true);

        // Status (Only pets marked Available appear in normal discovery; in-trial and adopted pets are excluded by default)
        if (filters?.status && filters.status !== 'All') {
          const target = filters.status.toLowerCase();
          if (target === 'available') {
            query = query.in('adoption_status', ['available', 'Available']);
          } else if (target === 'adoption pending' || target === 'pending') {
            query = query.in('adoption_status', ['pending', 'Adoption Pending', 'trial', 'adoption requested']);
          } else if (target === 'adopted') {
            query = query.in('adoption_status', ['adopted', 'Adopted']);
          } else {
            query = query.or(`adoption_status.eq.${target},adoption_status.eq.${filters.status}`);
          }
        } else {
          // When All is requested, exclude drafts and archived
          query = query.not('adoption_status', 'in', '("draft","Draft","archived","Unavailable")');
        }

        // Sorting
        if (filters?.sortBy === 'name') {
          query = query.order('name', { ascending: true });
        } else {
          query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query;

        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map((row: any) => mapPetFromDatabase(row));
        }

        // Fallback: If join query failed, try simple select with profiles only
        if (error) {
          console.warn('[petService] Joined getAllPets query failed, trying resilient fallback:', error.message);
          let fbQuery = (supabase as any)
            .from('pets')
            .select(`
              *,
              pet_images ( image_url, display_order, is_primary ),
              profiles!provider_id ( full_name, phone, city, locality, profile_image_url )
            `);

          if (filters?.status && filters.status !== 'All') {
            const target = filters.status.toLowerCase();
            if (target === 'available') {
              fbQuery = fbQuery.in('adoption_status', ['available', 'Available']);
            } else if (target === 'adoption pending' || target === 'pending') {
              fbQuery = fbQuery.in('adoption_status', ['pending', 'Adoption Pending', 'trial', 'adoption requested']);
            } else if (target === 'adopted') {
              fbQuery = fbQuery.in('adoption_status', ['adopted', 'Adopted']);
            }
          } else {
            fbQuery = fbQuery.not('adoption_status', 'in', '("draft","Draft","archived","Unavailable")');
          }

          if (filters?.sortBy === 'name') {
            fbQuery = fbQuery.order('name', { ascending: true });
          } else {
            fbQuery = fbQuery.order('created_at', { ascending: false });
          }

          const { data: fbData, error: fbError } = await fbQuery;
          if (!fbError && Array.isArray(fbData) && fbData.length > 0) {
            return fbData.map((row: any) => mapPetFromDatabase(row));
          }
        }

        // If Supabase has zero pet listings yet, fall back to demo pets so discovery is never empty
        if (!error && Array.isArray(data) && data.length === 0 && !filters?.search && (!filters?.species || filters.species === 'All') && (!filters?.status || filters.status === 'Available')) {
          return filterPetsLocally(loadDemoPets(), filters);
        }
      } catch (err) {
        console.warn('[petService] Exception querying Supabase pets:', err);
      }
    }

    // Demo Mode fallback
    return filterPetsLocally(loadDemoPets(), filters);
  },

  /**
   * Retrieves a single pet by ID.
   * If UUID: checks Supabase database.
   * If demo ID or not found in database: checks local demo pets.
   */
  async getPetById(id: string): Promise<Pet | null> {
    const targetId = toPetDatabaseUUID(id);
    if (isSupabaseConfigured() && isUUID(targetId)) {
      try {
        const { data, error } = await (supabase as any)
          .from('pets')
          .select(`
            *,
            pet_images ( image_url, display_order, is_primary ),
            profiles!provider_id ( full_name, phone, city, locality, profile_image_url ),
            provider_profiles!provider_id ( organization_name, provider_type, verification_status, description, city, locality )
          `)
          .eq('id', targetId)
          .single();

        if (!error && data) {
          return mapPetFromDatabase(data);
        }

        // Resilient fallback 1: If joined provider_profiles has issues, query with profiles only
        if (error) {
          console.warn(`[petService] Full join query failed for pet ${targetId}, trying resilient fallback:`, error.message);
          const { data: fbData, error: fbError } = await (supabase as any)
            .from('pets')
            .select(`
              *,
              pet_images ( image_url, display_order, is_primary ),
              profiles!provider_id ( full_name, phone, city, locality, profile_image_url )
            `)
            .eq('id', targetId)
            .single();

          if (!fbError && fbData) {
            let providerProfile: any = null;
            if (fbData.provider_id) {
              try {
                const { data: pp } = await (supabase as any)
                  .from('provider_profiles')
                  .select('*')
                  .eq('id', fbData.provider_id)
                  .maybeSingle();
                providerProfile = pp;
              } catch (_) {}
            }
            return mapPetFromDatabase(fbData, undefined, providerProfile);
          }

          // Resilient fallback 2: Basic select * from pets
          const { data: basicData, error: basicError } = await (supabase as any)
            .from('pets')
            .select('*')
            .eq('id', targetId)
            .single();

          if (!basicError && basicData) {
            return mapPetFromDatabase(basicData);
          }
        }
      } catch (err) {
        console.warn(`[petService] Failed to load pet ${id} from Supabase:`, err);
      }
    }

    // Demo lookup (by exact ID, target UUID, or matching name)
    const list = loadDemoPets();
    const cleanId = (id || '').toLowerCase().trim();
    return (
      list.find(
        (p) =>
          p.id === id ||
          p.id === targetId ||
          p.name.toLowerCase() === cleanId ||
          `pet_${p.name.toLowerCase()}` === cleanId
      ) || null
    );
  },

  /**
   * Returns featured pets for the homepage.
   */
  async getFeaturedPets(): Promise<Pet[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await (supabase as any)
          .from('pets')
          .select(`
            *,
            pet_images ( image_url, display_order, is_primary ),
            profiles!provider_id ( full_name, phone, city, locality, profile_image_url ),
            provider_profiles!provider_id ( organization_name, provider_type, verification_status, description, city, locality )
          `)
          .in('adoption_status', ['available', 'Available'])
          .order('created_at', { ascending: false })
          .limit(4);

        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map((row: any) => mapPetFromDatabase(row));
        }
      } catch (err) {
        console.warn('[petService] Failed to load featured pets from Supabase:', err);
      }
    }

    const demoList = loadDemoPets();
    return demoList.filter((p) => p.status === 'Available').slice(0, 4);
  },

  /**
   * Retrieves pets belonging to a specific provider.
   * In real mode: queries Supabase where provider_id = providerId.
   * In demo mode: returns demo provider's listings.
   */
  async getProviderPets(providerId: string): Promise<Pet[]> {
    if (isRealMode() && isUUID(providerId)) {
      try {
        const { data, error } = await (supabase as any)
          .from('pets')
          .select(`
            *,
            pet_images ( image_url, display_order, is_primary ),
            profiles!provider_id ( full_name, phone, city, locality, profile_image_url ),
            provider_profiles!provider_id ( organization_name, provider_type, verification_status, description, city, locality )
          `)
          .eq('provider_id', providerId)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          return data.map((row: any) => mapPetFromDatabase(row));
        }

        if (error) {
          console.warn('[petService] Error loading provider pets from Supabase:', error.message);
        }
      } catch (err) {
        console.warn('[petService] Exception loading provider pets from Supabase:', err);
      }
    }

    // Demo provider fallback
    const list = loadDemoPets();
    return list.filter((p) => p.provider.id === providerId || providerId === 'prv_sarah');
  },

  /**
   * Creates a new pet listing.
   * In real mode: verifies provider session via auth.uid(), inserts into `public.pets`
   * and `public.pet_images`, returning the created pet.
   */
  async createPet(petData: Partial<Pet>): Promise<Pet> {
    if (isRealMode()) {
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData.user;

      if (!authUser) {
        throw new Error('Authentication required to create a pet listing.');
      }

      // Verify provider role
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('role')
        .eq('id', authUser.id)
        .single();

      if (profile && profile.role !== 'provider' && profile.role !== 'admin') {
        throw new Error('Unauthorized: Only registered pet providers can list animals.');
      }

      // Parse location
      const locParts = (petData.location || 'Mumbai').split(',').map((s) => s.trim());
      const locality = locParts.length > 1 ? locParts[0] : null;
      const city = locParts.length > 1 ? locParts[1] : locParts[0];

      // Prepare database insert
      const insertPayload = {
        provider_id: authUser.id, // Strictly trusted auth.uid()
        name: petData.name?.trim() || 'Unnamed Pet',
        species: petData.species || 'Dog',
        breed: petData.breed?.trim() || 'Mixed Breed',
        breed_type: 'Purebred',
        age: petData.age?.trim() || '1 year',
        gender: petData.gender || 'Male',
        size: petData.size || 'Medium',
        city: city || 'Mumbai',
        locality,
        description: petData.description?.trim() || 'A loving companion looking for a forever home.',
        temperament: petData.personalityTags || ['Friendly', 'Playful'],
        personality: petData.personalityTags || ['Friendly', 'Playful'],
        energy_level: 'Medium',
        good_with_children: petData.goodWithChildren ?? true,
        good_with_dogs: petData.goodWithDogs ?? true,
        good_with_cats: petData.goodWithCats ?? true,
        apartment_friendly: petData.apartmentFriendly ?? true,
        training_information: petData.providerInsight?.behavior || 'Responds to basic voice cues.',
        health_information: petData.healthInfo || 'Health checkups up to date.',
        vaccination_status: petData.vaccination || 'Fully Vaccinated',
        sterilization_status: petData.sterilization || 'Sterilized',
        special_needs: petData.specialNeeds?.trim() || null,
        adoption_status: petData.status ? petData.status.toLowerCase() : 'available',
        stats: petData.stats || { energy: 70, friendliness: 90, trainability: 75, independence: 50 },
        provider_insight: petData.providerInsight || {},
      };

      const { data: createdRow, error: insertError } = await (supabase as any)
        .from('pets')
        .insert(insertPayload)
        .select()
        .single();

      if (insertError) {
        console.error('[petService] Error creating pet in Supabase:', insertError);
        throw insertError;
      }

      // Persist photos into `public.pet_images`
      if (petData.images && petData.images.length > 0) {
        await petImageService.savePetImages(createdRow.id, petData.images);
      }

      const refreshed = await this.getPetById(createdRow.id);
      const resultPet = refreshed || mapPetFromDatabase(createdRow, petData.images);
      realtimeSync.notifyChange('pet_updated', resultPet.id, resultPet);
      return resultPet;
    }

    // Demo Mode implementation
    const list = loadDemoPets();
    const newPet: Pet = {
      id: `pet_${Date.now()}`,
      name: petData.name || 'Unnamed Pet',
      species: petData.species || 'Dog',
      breed: petData.breed || 'Mixed Breed',
      age: petData.age || '1 year',
      gender: petData.gender || 'Male',
      size: petData.size || 'Medium',
      location: petData.location || 'Mumbai',
      images: petData.images && petData.images.length > 0 
        ? petData.images 
        : ['https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1200'],
      personalityTags: petData.personalityTags || ['Friendly', 'Playful'],
      stats: petData.stats || { energy: 70, friendliness: 90, trainability: 75, independence: 50 },
      goodWithChildren: petData.goodWithChildren ?? true,
      goodWithDogs: petData.goodWithDogs ?? true,
      goodWithCats: petData.goodWithCats ?? true,
      apartmentFriendly: petData.apartmentFriendly ?? true,
      vaccination: petData.vaccination || 'Fully Vaccinated',
      sterilization: petData.sterilization || 'Sterilized',
      healthInfo: petData.healthInfo || 'Healthy, checked by vet.',
      specialNeeds: petData.specialNeeds || '',
      description: petData.description || 'A loving companion looking for a forever home.',
      providerInsight: petData.providerInsight || {
        personality: 'Gentle and loving.',
        habits: 'Loves curling up in cozy corners.',
        likes: 'Treats, gentle pats, walks.',
        dislikes: 'Sudden loud sounds.',
        behavior: 'Well-mannered indoors.',
        specialCare: 'Regular routine.',
        dailyRoutine: 'Morning and evening walks with midday rest.',
      },
      provider: petData.provider ? {
        ...petData.provider,
        avatar: resolveUserAvatar(petData.provider),
      } : {
        id: 'prv_sarah',
        name: "Sarah D'Souza",
        title: 'Verified Pet Provider',
        location: 'Mumbai',
        verified: true,
        avatar: resolveUserAvatar({ name: "Sarah D'Souza", email: "sarah@example.com" }),
        about: 'Certified rescue foster caregiver.',
      },
      status: petData.status || 'Available',
      createdAt: new Date().toISOString(),
    };

    list.unshift(newPet);
    saveDemoPets(list);
    realtimeSync.notifyChange('pet_updated', newPet.id, newPet);
    return newPet;
  },

  /**
   * Updates an existing pet listing.
   * In real mode: RLS enforces provider ownership.
   */
  async updatePet(id: string, updates: Partial<Pet>): Promise<Pet> {
    if (isRealMode() && isUUID(id)) {
      const updatePayload: any = {};
      if (updates.name !== undefined) updatePayload.name = updates.name.trim();
      if (updates.breed !== undefined) updatePayload.breed = updates.breed.trim();
      if (updates.age !== undefined) updatePayload.age = updates.age.trim();
      if (updates.species !== undefined) updatePayload.species = updates.species;
      if (updates.gender !== undefined) updatePayload.gender = updates.gender;
      if (updates.size !== undefined) updatePayload.size = updates.size;
      if (updates.description !== undefined) updatePayload.description = updates.description.trim();
      if (updates.healthInfo !== undefined) updatePayload.health_information = updates.healthInfo;
      if (updates.specialNeeds !== undefined) updatePayload.special_needs = updates.specialNeeds;
      if (updates.vaccination !== undefined) updatePayload.vaccination_status = updates.vaccination;
      if (updates.sterilization !== undefined) updatePayload.sterilization_status = updates.sterilization;
      if (updates.goodWithChildren !== undefined) updatePayload.good_with_children = updates.goodWithChildren;
      if (updates.goodWithDogs !== undefined) updatePayload.good_with_dogs = updates.goodWithDogs;
      if (updates.goodWithCats !== undefined) updatePayload.good_with_cats = updates.goodWithCats;
      if (updates.apartmentFriendly !== undefined) updatePayload.apartment_friendly = updates.apartmentFriendly;
      if (updates.stats !== undefined) updatePayload.stats = updates.stats;
      if (updates.providerInsight !== undefined) updatePayload.provider_insight = updates.providerInsight;

      if (updates.location !== undefined) {
        const locParts = updates.location.split(',').map((s) => s.trim());
        updatePayload.locality = locParts.length > 1 ? locParts[0] : null;
        updatePayload.city = locParts.length > 1 ? locParts[1] : locParts[0];
      }

      // Execute update via Supabase (RLS ensures provider ownership)
      const { error } = await (supabase as any)
        .from('pets')
        .update(updatePayload)
        .eq('id', id);

      if (error) {
        console.error(`[petService] Error updating pet ${id}:`, error);
        throw error;
      }

      if (updates.images && updates.images.length > 0) {
        await petImageService.savePetImages(id, updates.images);
      }

      const refreshed = await this.getPetById(id);
      if (!refreshed) throw new Error('Failed to retrieve updated pet listing');
      return refreshed;
    }

    // Demo Mode
    const list = loadDemoPets();
    const index = list.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Pet not found');

    const updated = { ...list[index], ...updates };
    list[index] = updated;
    saveDemoPets(list);
    return updated;
  },

  /**
   * Updates pet listing status.
   * Real mode allows provider-safe status toggles (Available <-> Paused).
   */
  async updatePetStatus(id: string, status: PetStatus): Promise<void> {
    const targetId = toPetDatabaseUUID(id);
    if (isSupabaseConfigured() && isUUID(targetId)) {
      const dbStatus =
        status === 'Available'
          ? 'available'
          : status === 'Paused'
          ? 'paused'
          : status === 'Adoption Pending'
          ? 'pending'
          : status === 'Adoption Requested'
          ? 'trial'
          : status === 'Adopted'
          ? 'adopted'
          : status.toLowerCase();

      try {
        const { error } = await (supabase as any)
          .from('pets')
          .update({ adoption_status: dbStatus, updated_at: new Date().toISOString() })
          .eq('id', targetId);

        if (error) {
          console.error(`[petService] Error updating status for pet ${id}:`, error);
        }
      } catch (err) {
        console.warn(`[petService] Exception updating pet status in Supabase:`, err);
      }
    }

    // Always update demo storage too with broad matching
    const list = loadDemoPets();
    const cleanId = (id || '').toLowerCase().trim();
    const pet = list.find(
      (p) =>
        p.id === id ||
        p.id === targetId ||
        toPetDatabaseUUID(p.id) === targetId ||
        p.name.toLowerCase() === cleanId ||
        `pet_${p.name.toLowerCase()}` === cleanId
    );
    if (pet) {
      pet.status = status;
      if (status === 'Adopted') {
        pet.adoptionDate = new Date().toISOString().split('T')[0];
      }
      saveDemoPets(list);
    }

    realtimeSync.notifyChange('pet_updated', targetId, { id: targetId, status });
  },

  /**
   * Deletes a pet listing.
   * Real mode deletes from PostgreSQL (RLS enforces provider ownership).
   */
  async deletePet(id: string): Promise<void> {
    if (isRealMode() && isUUID(id)) {
      const { error } = await (supabase as any)
        .from('pets')
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`[petService] Error deleting pet ${id}:`, error);
        throw error;
      }
    }

    // Always synchronize local demo list and broadcast update
    const targetUuid = toPetDatabaseUUID(id);
    let list = loadDemoPets();
    list = list.filter((p) => p.id !== id && p.id !== targetUuid);
    saveDemoPets(list);

    realtimeSync.notifyChange('pet_updated', id, { id, status: 'Unavailable' });
  },

  /**
   * Synchronously updates the provider information across all locally stored / demo pets
   * belonging to a given provider ID.
   */
  syncProviderMetadataInPets(
    providerId: string,
    updates: { name?: string; avatar?: string; location?: string; organizationName?: string; about?: string }
  ): void {
    try {
      const list = loadDemoPets();
      let changed = false;
      const updatedList = list.map((pet) => {
        if (pet.provider.id === providerId) {
          changed = true;
          return {
            ...pet,
            provider: {
              ...pet.provider,
              ...(updates.name ? { name: updates.name } : {}),
              ...(updates.avatar ? { avatar: updates.avatar } : {}),
              ...(updates.location ? { location: updates.location } : {}),
              ...(updates.organizationName ? { title: updates.organizationName } : {}),
              ...(updates.about ? { about: updates.about } : {}),
            },
          };
        }
        return pet;
      });

      if (changed) {
        saveDemoPets(updatedList);
        realtimeSync.notifyChange('pet_updated', 'provider_sync', null);
      }
    } catch (e) {
      console.warn('[petService] syncProviderMetadataInPets failed', e);
    }
  },

  resetDemoPets(): void {
    saveDemoPets(DEMO_PETS);
  },
};
