import {
  AdoptionRequest,
  AdoptionRequestStatus,
  TrialStatus,
  TimelineEvent,
  Trial,
  AdoptionVerification,
  getDefaultVerification,
  AdoptionCertificateSummary,
} from '../types/adoptionRequest';
import { INITIAL_ADOPTION_REQUESTS } from '../data/mockData';
import { petService } from './petService';
import { notificationService } from './notificationService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { mapTrialFromDatabase } from './trialService';
import { trialExtensionService } from './trialExtensionService';
import { emailNotificationService } from './emailNotificationService';
import { realtimeSync } from './realtimeSync';
import { favoriteService } from './favoriteService';
import { getAdminPath } from '../utils/adminSecurity';

const STORAGE_KEY = 'pet_adoption_requests_v4';

export function formatTitleCase(str?: string | null): string {
  if (!str || !str.trim()) return '';
  return str
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// ==============================================================================
// 1. HELPER UTILITIES
// ==============================================================================
import { isRealMode, isUUID } from '../utils/authMode';
import { toPetDatabaseUUID, getSeededUUIDForPet } from '../utils/petIdMapper';
export { isUUID };

export function normalizeRequestStatus(dbStatus: string): AdoptionRequestStatus {
  switch (dbStatus?.toLowerCase()) {
    case 'pending':
      return 'Pending';
    case 'under_review':
    case 'under review':
      return 'Under Review';
    case 'more_information_required':
    case 'more information required':
      return 'More Information Required';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'cancelled':
    case 'withdrawn':
      return 'Cancelled';
    case 'completed':
      return 'Completed';
    default:
      return 'Pending';
  }
}

// ==============================================================================
// 2. TIMELINE & DATABASE ADAPTER (mapAdoptionRequestFromDatabase)
// ==============================================================================
export function buildSynchronizedTimeline(
  existingTimeline: TimelineEvent[] | undefined,
  status: AdoptionRequestStatus,
  createdDateStr: string,
  updatedDateStr?: string
): TimelineEvent[] {
  const createdDate = new Date(createdDateStr || Date.now()).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const updatedDate = updatedDateStr
    ? new Date(updatedDateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : createdDate;

  const isApproved = status === 'Approved';
  const isCompleted = status === 'Completed';
  const isUnderReview = status === 'Under Review' || status === 'More Information Required';
  const isRejected = status === 'Rejected';

  return [
    {
      step: 1,
      status: 'Pending',
      title: 'Request Sent',
      date: createdDate,
      description: 'Adoption request submitted with verified applicant profile.',
      completed: true,
      current: status === 'Pending',
    },
    {
      step: 2,
      status: 'Under Review',
      title: 'Under Review',
      date: isUnderReview ? updatedDate : isApproved || isCompleted ? createdDate : 'Pending',
      description: 'Application and home lifestyle compatibility verified.',
      completed: isUnderReview || isApproved || isCompleted,
      current: isUnderReview,
    },
    {
      step: 3,
      status: 'Approved',
      title: isRejected ? 'Application Declined' : 'Decision & Foster Trial',
      date: isApproved || isCompleted ? updatedDate : isRejected ? updatedDate : 'Pending',
      description: isRejected
        ? 'Application was reviewed and criteria not met at this time.'
        : 'Foster-to-Own trial period initiated and active.',
      completed: isApproved || isCompleted || isRejected,
      current: isApproved,
    },
    {
      step: 4,
      status: 'Completed',
      title: 'Adoption Completed',
      date: isCompleted ? updatedDate : isApproved ? '14-Day Trial Active' : 'Pending',
      description: isCompleted
        ? 'Official adoption finalized and certificate issued.'
        : 'Official adoption finalized upon successful completion of bonding trial.',
      completed: isCompleted,
      current: isCompleted,
    },
  ];
}

export function mapAdoptionRequestFromDatabase(row: any): AdoptionRequest {
  const status = normalizeRequestStatus(row.status);

  // Extract pet photo
  let petImage = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800';
  if (row.pets?.pet_images && Array.isArray(row.pets.pet_images) && row.pets.pet_images.length > 0) {
    const sorted = [...row.pets.pet_images].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    petImage = sorted[0].image_url;
  }

  // Provider details from joins (RPC 'provider', table join 'provider_profile', or 'provider_details')
  const providerProfile = row.provider || row.provider_profile || row.provider_details;
  const providerDetails = row.provider_details;
  const rawProviderName = providerProfile?.full_name || providerDetails?.organization_name || row.provider_name;
  const providerName = rawProviderName ? formatTitleCase(rawProviderName) : 'Pet Care Provider';
  const providerLocation = providerProfile?.city
    ? `${providerProfile.locality ? `${formatTitleCase(providerProfile.locality)}, ` : ''}${formatTitleCase(providerProfile.city)}`
    : 'Mumbai';

  // Adopter details from joins (RPC 'adopter', table join 'adopter_profile', or 'profiles')
  const adopterProfile = row.adopter || row.adopter_profile || row.profiles;
  const rawAdopterName = adopterProfile?.full_name || row.adopter_name;
  const adopterName = rawAdopterName ? formatTitleCase(rawAdopterName) : 'Adopter';
  const adopterEmail = adopterProfile?.email || row.adopter_email || '';
  const adopterPhone = adopterProfile?.phone || row.adopter_phone || '';
  const adopterLocation = adopterProfile?.city
    ? `${adopterProfile.locality ? `${formatTitleCase(adopterProfile.locality)}, ` : ''}${formatTitleCase(adopterProfile.city)}`
    : (row.home_type ? `${row.home_type}` : 'India');
  const adopterAvatar = adopterProfile?.profile_image_url || undefined;

  // Timeline events reconstruction - dynamically synchronized with current status
  const timeline: TimelineEvent[] = buildSynchronizedTimeline(
    row.timeline,
    status,
    row.created_at,
    row.updated_at
  );

  // Parse joined foster trial if present
  let trial: Trial | undefined;
  const rawTrial = Array.isArray(row.foster_trials) ? row.foster_trials[0] : row.foster_trials;
  if (rawTrial && rawTrial.start_date && rawTrial.end_date) {
    trial = mapTrialFromDatabase(rawTrial);
  } else if (status === 'Approved') {
    // Generate active trial fallback so adopter FosterTrialCard renders immediately
    const start = new Date(row.updated_at || row.created_at || Date.now());
    const end = new Date(start);
    end.setDate(start.getDate() + 14);
    trial = {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      currentDay: 1,
      totalDays: 14,
      notes: [
        'Day 1: Platform Administration approved application. 14-day Foster-to-Own bonding trial active.',
      ],
    };
  }

  // If request is officially completed, guarantee trial reflects completion and resolves pending extensions
  if (status === 'Completed' && trial) {
    trial.status = 'Adoption Completed';
    trial.extensionRequested = false;
    if (trial.extension && trial.extension.status === 'pending') {
      trial.extension.status = 'approved';
      trial.extension.providerResponse = 'Adoption officially finalized.';
    }
  }

  // Verification reconstruction - strictly enforces consistency with status
  let verification: AdoptionVerification =
    row.verification ||
    getDefaultVerification({
      status,
      adopterName,
      adopterEmail,
      homeType: row.home_type,
      existingPets: row.existing_pets,
      children: row.children,
      petExperience: row.pet_experience,
      timeAvailable: row.time_available,
      whyTheyWantToAdopt: row.why_they_want_to_adopt,
      confirmedAccurate: Boolean(row.confirmed_accurate),
      updatedAt: row.updated_at,
    });

  // Guarantee step 1 contact check dynamically reflects actual applicant profile
  if (verification?.steps?.[0]?.checks?.[0]) {
    verification.steps[0].checks[0].description = `${adopterName} (${adopterEmail || 'Verified Email'})`;
  }

  // Guarantee: An Approved or Completed request is ALWAYS 100% Level 4 completed
  if (
    (status === 'Approved' || status === 'Completed') &&
    (verification.percentage < 100 || verification.level < 4)
  ) {
    verification = {
      ...verification,
      level: 4,
      percentage: 100,
      statusTitle: 'Level 4: Fully Approved & Foster-to-Own Trial Active',
      lastUpdated: row.updated_at || new Date().toISOString(),
      steps: verification.steps.map((s) => ({
        ...s,
        completed: true,
        checks: s.checks.map((c) => ({ ...c, checked: true })),
      })),
    };
  }

  // Parse joined official adoption certificate record if present
  let adoption: AdoptionCertificateSummary | undefined;
  const rawAdoption = row.adoption;
  if (rawAdoption && rawAdoption.certificate_number) {
    adoption = {
      id: rawAdoption.id,
      certificateNumber: rawAdoption.certificate_number,
      adoptionDate: rawAdoption.adoption_date,
      status: rawAdoption.status || 'completed',
      notes: rawAdoption.notes,
    };
  } else if (status === 'Completed') {
    // Generate clean certificate fallback if completed
    adoption = {
      certificateNumber: `PA-2026-${row.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`,
      adoptionDate: row.updated_at || row.created_at || new Date().toISOString(),
      status: 'completed',
    };
  }

  return {
    id: row.id,
    petId: row.pet_id,
    petName: row.pets?.name || 'Pet',
    petBreed: row.pets?.breed || 'Companion',
    petImage,
    providerId: row.provider_id,
    providerName,
    providerLocation,
    adopterId: row.adopter_id,
    adopterName,
    adopterEmail,
    adopterPhone,
    adopterLocation,
    adopterAvatar: adopterAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    message: row.message || '',
    homeType: row.home_type || 'Apartment',
    existingPets: row.existing_pets || 'None',
    children: row.children || 'None',
    petExperience: row.pet_experience || 'Lifelong pet owner',
    timeAvailable: row.time_available || 'Home daily',
    whyTheyWantToAdopt: row.why_they_want_to_adopt || '',
    confirmedAccurate: Boolean(row.confirmed_accurate),
    status,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    reviewNotes: row.provider_notes || undefined,
    trial,
    timeline,
    verification,
    adoption,
  };
}

// ==============================================================================
// 3. DEMO STORAGE & TRIAL HELPERS
// ==============================================================================
function getDynamicRelativeTrial() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 1); // Started 1-2 days ago (Day 2 today)

  const end = new Date(start);
  end.setDate(start.getDate() + 14); // 14-day total trial

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
    totalDays: 14,
    currentDay: 2,
    notes: [
      'Day 1: Bruno arrived and explored the living room happily. Ate his evening dinner with gusto.',
      'Day 2: Morning trot along the promenade went wonderfully, very gentle and attentive on leash.',
    ],
  };
}

function loadRequests(): AdoptionRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((r: AdoptionRequest) => {
          const status = r.status;
          let verification = r.verification || getDefaultVerification(r);
          if (
            (status === 'Approved' || status === 'Completed') &&
            (verification.percentage < 100 || verification.level < 4)
          ) {
            verification = {
              ...verification,
              level: 4,
              percentage: 100,
              statusTitle: 'Level 4: Fully Approved & Foster-to-Own Trial Active',
              steps: verification.steps.map((s) => ({
                ...s,
                completed: true,
                checks: s.checks.map((c) => ({ ...c, checked: true })),
              })),
            };
          }
          const timeline = buildSynchronizedTimeline(
            r.timeline,
            status,
            r.createdAt,
            r.updatedAt
          );
          let trial = r.trial;
          if (status === 'Completed' && trial) {
            trial = {
              ...trial,
              status: 'Adoption Completed',
              extensionRequested: false,
              extension: trial.extension
                ? {
                    ...trial.extension,
                    status: trial.extension.status === 'pending' ? 'approved' : trial.extension.status,
                    providerResponse: trial.extension.providerResponse || 'Adoption officially finalized.',
                  }
                : undefined,
            };
          }
          return {
            ...r,
            trial,
            timeline,
            verification,
          };
        });
      }
    }
  } catch (e) {
    console.warn('[adoptionService] Failed to load requests from storage', e);
  }

  // Deep clone initial requests and dynamically adjust Bruno's active trial dates
  const initial = (JSON.parse(JSON.stringify(INITIAL_ADOPTION_REQUESTS)) as AdoptionRequest[]).map((r) => ({
    ...r,
    verification: r.verification || getDefaultVerification(r),
  }));
  const brunoReq = initial.find((r) => r.id === 'req_bruno_01');
  if (brunoReq && brunoReq.trial) {
    const dyn = getDynamicRelativeTrial();
    brunoReq.trial.startDate = dyn.startDate;
    brunoReq.trial.endDate = dyn.endDate;
    brunoReq.trial.totalDays = dyn.totalDays;
    brunoReq.trial.currentDay = dyn.currentDay;
    brunoReq.trial.notes = dyn.notes;
    brunoReq.status = 'Approved';
    brunoReq.verification = getDefaultVerification(brunoReq);
  }

  saveRequests(initial);
  return initial;
}

function saveRequests(requests: AdoptionRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  } catch (e) {
    console.warn('[adoptionService] Failed to save requests to storage', e);
  }
}

// ==============================================================================
// 4. ADOPTION SERVICE (DUAL-MODE + DATABASE INTEGRATION)
// ==============================================================================
export const adoptionService = {
  async getAllRequests(): Promise<AdoptionRequest[]> {
    if (isSupabaseConfigured()) {
      try {
        // 1. First try the high-performance security definer RPC with session passkey
        const passkey = typeof window !== 'undefined' ? sessionStorage.getItem('pet_admin_session_passkey') : null;
        const { data: rpcData, error: rpcError } = await (supabase as any).rpc('get_platform_adoption_requests', {
          p_passkey: passkey || undefined,
        });
        if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
          const dbRequests = rpcData.map(mapAdoptionRequestFromDatabase);
          const demoRequests = loadRequests();
          const merged = [...dbRequests];
          for (const demo of demoRequests) {
            if (!merged.some((r) => r.id === demo.id)) {
              merged.push(demo);
            }
          }
          saveRequests(merged);
          return merged;
        }

        // 2. Direct table query fallback
        const { data, error } = await (supabase as any)
          .from('adoption_requests')
          .select(`
            *,
            pets (
              id, name, breed, species, city, locality,
              pet_images ( image_url, display_order, is_primary )
            ),
            adopter_profile:profiles!adopter_id ( id, full_name, email, phone, city, locality, profile_image_url ),
            provider_profile:profiles!provider_id ( id, full_name, email, phone, city, locality, profile_image_url ),
            provider_details:provider_profiles!provider_id ( organization_name, city, locality ),
            foster_trials ( id, start_date, end_date, status, journal_entries, trial_extension_requests (*) )
          `)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          const dbRequests = data.map(mapAdoptionRequestFromDatabase);
          const demoRequests = loadRequests();
          const merged = [...dbRequests];
          for (const demo of demoRequests) {
            if (!merged.some((r) => r.id === demo.id)) {
              merged.push(demo);
            }
          }
          saveRequests(merged);
          return merged;
        }
      } catch (err) {
        console.warn('[adoptionService] Error loading all requests from Supabase:', err);
      }
    }
    return loadRequests();
  },

  async getRequestById(id: string): Promise<AdoptionRequest | null> {
    if (isSupabaseConfigured() && isUUID(id)) {
      try {
        let targetId = id;

        const requestSelect = `
          *,
          pets (
            id, name, breed, species, city, locality,
            pet_images ( image_url, display_order, is_primary )
          ),
          adopter_profile:profiles!adopter_id ( id, full_name, email, phone, city, locality, profile_image_url ),
          provider_profile:profiles!provider_id ( id, full_name, email, phone, city, locality, profile_image_url ),
          provider_details:provider_profiles!provider_id ( organization_name, city, locality ),
          foster_trials ( id, start_date, end_date, status, journal_entries, trial_extension_requests (*) )
        `;

        let { data, error } = await (supabase as any)
          .from('adoption_requests')
          .select(requestSelect)
          .eq('id', targetId)
          .maybeSingle();

        // If not found directly, check if id is a foster_trial id
        if (!data) {
          const { data: trialRow } = await (supabase as any)
            .from('foster_trials')
            .select('adoption_request_id')
            .eq('id', targetId)
            .maybeSingle();

          if (trialRow?.adoption_request_id) {
            targetId = trialRow.adoption_request_id;
            const res = await (supabase as any)
              .from('adoption_requests')
              .select(requestSelect)
              .eq('id', targetId)
              .maybeSingle();
            data = res.data;
          }
        }

        // If not found, check if id is an adoption id
        if (!data) {
          const { data: adRow } = await (supabase as any)
            .from('adoptions')
            .select('adoption_request_id')
            .eq('id', targetId)
            .maybeSingle();

          if (adRow?.adoption_request_id) {
            targetId = adRow.adoption_request_id;
            const res = await (supabase as any)
              .from('adoption_requests')
              .select(requestSelect)
              .eq('id', targetId)
              .maybeSingle();
            data = res.data;
          }
        }

        if (!error && data) {
          return mapAdoptionRequestFromDatabase(data);
        }
      } catch (err) {
        console.warn(`[adoptionService] Error fetching request ${id} from Supabase:`, err);
      }
    }

    // Demo lookup
    const all = loadRequests();
    return all.find((r) => r.id === id || r.trial?.id === id || r.petId === id) || null;
  },

  async getRequestsForUser(userId: string, role: 'adopter' | 'provider'): Promise<AdoptionRequest[]> {
    if (isRealMode() && isUUID(userId)) {
      try {
        const queryCol = role === 'adopter' ? 'adopter_id' : 'provider_id';
        const { data, error } = await (supabase as any)
          .from('adoption_requests')
          .select(`
            *,
            pets (
              id, name, breed, species, city, locality,
              pet_images ( image_url, display_order, is_primary )
            ),
            adopter_profile:profiles!adopter_id ( id, full_name, email, phone, city, locality, profile_image_url ),
            provider_profile:profiles!provider_id ( id, full_name, email, phone, city, locality, profile_image_url ),
            provider_details:provider_profiles!provider_id ( organization_name, city, locality ),
            foster_trials ( id, start_date, end_date, status, journal_entries, trial_extension_requests (*) )
          `)
          .eq(queryCol, userId)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          return data.map(mapAdoptionRequestFromDatabase);
        }

        if (error) {
          console.warn('[adoptionService] Error fetching user requests:', error.message);
        }
      } catch (err) {
        console.warn('[adoptionService] Exception loading requests for user:', err);
      }
    }

    // Demo Mode fallback
    if (!userId) return [];
    const all = loadRequests();
    if (role === 'adopter') {
      return all.filter((r) => r.adopterId === userId);
    }
    return all.filter((r) => r.providerId === userId);
  },

  async getTrialForPet(petId: string): Promise<AdoptionRequest | null> {
    const targetPetId = toPetDatabaseUUID(petId);
    if (isSupabaseConfigured() && isUUID(targetPetId)) {
      try {
        const { data, error } = await (supabase as any)
          .from('adoption_requests')
          .select(`
            *,
            pets (
              id, name, breed, species, city, locality,
              pet_images ( image_url, display_order, is_primary )
            ),
            adopter_profile:profiles!adopter_id ( id, full_name, email, phone, city, locality, profile_image_url ),
            provider_profile:profiles!provider_id ( id, full_name, email, phone, city, locality, profile_image_url ),
            provider_details:provider_profiles!provider_id ( organization_name, city, locality ),
            foster_trials ( id, start_date, end_date, status, journal_entries, trial_extension_requests (*) )
          `)
          .eq('pet_id', targetPetId)
          .in('status', ['approved', 'Approved'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          const mapped = mapAdoptionRequestFromDatabase(data);
          if (mapped.trial) return mapped;
        }
      } catch (err) {
        console.warn(`[adoptionService] Error getting trial for pet ${petId}:`, err);
      }
    }

    const all = loadRequests();
    return (
      all.find(
        (r) =>
          (r.petId === petId || r.petId === targetPetId) &&
          r.status === 'Approved' &&
          !!r.trial
      ) || null
    );
  },

  /**
   * Submits a new adoption request.
   * Real mode: verifies pet eligibility and provider ownership from PostgreSQL,
   * enforces auth.uid() identity, and prevents duplicate active applications.
   */
  async createRequest(
    data: Omit<AdoptionRequest, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'timeline'>
  ): Promise<AdoptionRequest> {
    if (isRealMode()) {
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData.user;

      if (!authUser) {
        throw new Error('Authentication required to submit an adoption application.');
      }

      // 1. Verify pet eligibility & resolve trusted provider_id from database
      const targetPetId = toPetDatabaseUUID(data.petId);

      let { data: petRow, error: petError } = await (supabase as any)
        .from('pets')
        .select('id, name, provider_id, adoption_status')
        .eq('id', targetPetId)
        .maybeSingle();

      // Fallback: If not found by targetPetId, try resolving by petName or seeded mapping
      if (!petRow && data.petName) {
        const fallbackUUID = getSeededUUIDForPet(data.petName);
        if (fallbackUUID) {
          const { data: fbRow } = await (supabase as any)
            .from('pets')
            .select('id, name, provider_id, adoption_status')
            .eq('id', fallbackUUID)
            .maybeSingle();
          if (fbRow) petRow = fbRow;
        }
        if (!petRow) {
          const { data: nameRow } = await (supabase as any)
            .from('pets')
            .select('id, name, provider_id, adoption_status')
            .ilike('name', data.petName.trim())
            .limit(1)
            .maybeSingle();
          if (nameRow) petRow = nameRow;
        }
      }

      if (!petRow) {
        throw new Error('Selected pet listing not found.');
      }

      const prohibitedStatuses = ['trial', 'adopted', 'archived', 'unavailable', 'draft'];
      if (prohibitedStatuses.includes(petRow.adoption_status.toLowerCase())) {
        if (petRow.adoption_status.toLowerCase() === 'trial') {
          throw new Error('This pet is currently in a Foster-to-Own bonding trial and is not accepting new adoption requests.');
        }
        throw new Error(`This pet is currently marked as ${petRow.adoption_status} and is not accepting new adoption requests.`);
      }

      // 2. Prevent duplicate active adoption requests for the same pet
      const { data: existingActive, error: activeCheckError } = await (supabase as any)
        .from('adoption_requests')
        .select('id, status')
        .eq('adopter_id', authUser.id)
        .eq('pet_id', petRow.id)
        .in('status', ['pending', 'under_review', 'approved', 'more_information_required', 'Pending', 'Under Review', 'Approved']);

      if (!activeCheckError && Array.isArray(existingActive) && existingActive.length > 0) {
        throw new Error(`You already have an active application submitted for ${petRow.name}. Please check your Applications page to track its progress.`);
      }

      // 3. Build initial timeline
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const timeline: TimelineEvent[] = [
        {
          step: 1,
          status: 'Pending',
          title: 'Request Sent',
          date: formattedDate,
          description: 'Adoption request submitted to provider.',
          completed: true,
          current: true,
        },
        {
          step: 2,
          status: 'Under Review',
          title: 'Under Review',
          date: 'Pending',
          description: 'Provider will review your application and lifestyle fit.',
          completed: false,
          current: false,
        },
        {
          step: 3,
          status: 'Approved',
          title: 'Decision & Foster Trial',
          date: 'Pending',
          description: 'Foster-to-Own trial period initiated.',
          completed: false,
          current: false,
        },
        {
          step: 4,
          status: 'Completed',
          title: 'Adoption Completed',
          date: 'Pending',
          description: 'Official adoption finalized and certificate issued.',
          completed: false,
          current: false,
        },
      ];

      // 4. Insert into public.adoption_requests
      const insertPayload = {
        pet_id: petRow.id,
        adopter_id: authUser.id, // Strictly trusted auth.uid()
        provider_id: petRow.provider_id, // Strictly trusted from pet in DB
        status: 'pending',
        message: data.message.trim(),
        home_type: data.homeType,
        existing_pets: data.existingPets,
        children: data.children,
        pet_experience: data.petExperience,
        time_available: data.timeAvailable,
        why_they_want_to_adopt: data.whyTheyWantToAdopt,
        confirmed_accurate: Boolean(data.confirmedAccurate),
        timeline,
      };

      const { data: createdRow, error: insertError } = await (supabase as any)
        .from('adoption_requests')
        .insert(insertPayload)
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error(`An active adoption application for ${petRow.name} already exists.`);
        }
        console.error('[adoptionService] Error creating adoption request:', insertError);
        throw new Error(insertError.message || 'Could not submit adoption request.');
      }

      // Dispatch background transactional email to provider (non-blocking)
      emailNotificationService.dispatchEmail('adoption_request_created', createdRow.id);

      const refreshed = await this.getRequestById(createdRow.id);
      const finalResult = refreshed || mapAdoptionRequestFromDatabase(createdRow);

      // Always synchronize to local demo storage so Demo Role Switcher users see it instantly!
      try {
        const local = loadRequests();
        saveRequests([finalResult, ...local.filter((r) => r.id !== finalResult.id)]);

        // Dispatch local notification to admin
        notificationService.addNotification({
          userId: 'usr_admin',
          type: 'request_received',
          title: `New Adoption Request: ${finalResult.petName}`,
          message: `${finalResult.adopterName} submitted an adoption application for ${finalResult.petName}. Review details and verify steps.`,
          link: getAdminPath('requests'),
          petName: finalResult.petName,
          petImage: finalResult.petImage,
        });
      } catch (e) {
        console.warn('Failed to sync to local requests:', e);
      }

      realtimeSync.notifyChange('adoption_request_created', finalResult.id, finalResult);
      return finalResult;
    }

    // Demo Mode implementation
    const all = loadRequests();
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const newRequest: AdoptionRequest = {
      ...data,
      id: `req_${Date.now()}`,
      status: 'Pending',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      timeline: [
        {
          step: 1,
          status: 'Pending',
          title: 'Request Sent',
          date: formattedDate,
          description: 'Adoption request submitted to provider.',
          completed: true,
          current: true,
        },
        {
          step: 2,
          status: 'Under Review',
          title: 'Under Review',
          date: 'Pending',
          description: 'Provider will review your application and lifestyle fit.',
          completed: false,
          current: false,
        },
        {
          step: 3,
          status: 'Approved',
          title: 'Decision & Foster Trial',
          date: 'Pending',
          description: 'Foster-to-Own trial period initiated.',
          completed: false,
          current: false,
        },
        {
          step: 4,
          status: 'Completed',
          title: 'Adoption Completed',
          date: 'Pending',
          description: 'Official adoption finalized and certificate issued.',
          completed: false,
          current: false,
        },
      ],
    };

    all.unshift(newRequest);
    saveRequests(all);

    // Demo notification for provider
    notificationService.addNotification({
      userId: data.providerId,
      type: 'request_received',
      title: 'New Adoption Request',
      message: `Your pet ${data.petName} received a new adoption request from ${data.adopterName}.`,
      link: `/provider/requests/${newRequest.id}`,
      petName: data.petName,
      petImage: data.petImage,
    });

    // Demo notification for admin
    notificationService.addNotification({
      userId: 'usr_admin',
      type: 'request_received',
      title: `New Adoption Request: ${data.petName}`,
      message: `${data.adopterName} submitted an adoption application for ${data.petName}. Review details and verify steps.`,
      link: getAdminPath('requests'),
      petName: data.petName,
      petImage: data.petImage,
    });

    realtimeSync.notifyChange('adoption_request_created', newRequest.id, newRequest);
    return newRequest;
  },

  /**
   * Withdraws/cancels an adoption request by the applicant adopter.
   */
  async withdrawRequest(id: string): Promise<void> {
    const targetId = id;
    let targetPetId: string | undefined;

    if (isSupabaseConfigured() && isUUID(targetId)) {
      try {
        const { data: req } = await (supabase as any)
          .from('adoption_requests')
          .select('id, pet_id, status')
          .eq('id', targetId)
          .single();

        if (req?.pet_id) targetPetId = req.pet_id;

        await (supabase as any)
          .from('adoption_requests')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetId);

        if (targetPetId) {
          await petService.updatePetStatus(targetPetId, 'Available');
        }
      } catch (err) {
        console.warn('[adoptionService] Error withdrawing request in Supabase:', err);
      }
    }

    // Demo Mode & Local State
    const all = loadRequests();
    const match = all.find((r) => r.id === id);
    if (match) {
      match.status = 'Cancelled';
      match.updatedAt = new Date().toISOString();
      saveRequests(all);
      if (match.petId) {
        targetPetId = targetPetId || match.petId;
        await petService.updatePetStatus(match.petId, 'Available');
      }
    }

    realtimeSync.notifyChange('adoption_request_updated', id);
    if (targetPetId) {
      realtimeSync.notifyChange('pet_updated', targetPetId);
    }
  },


  /**
   * Comprehensive Platform Admin Request Management & Verification
   * Can approve, reject, or update step-wise verification percentage and level.
   */
  async adminManageRequest(
    requestId: string,
    action: 'approve' | 'reject' | 'update_verification',
    notes?: string,
    verification?: AdoptionVerification
  ): Promise<AdoptionRequest> {
    const isDbUUID = isUUID(requestId);

    // Update local storage representation first or find existing
    const all = loadRequests();
    const index = all.findIndex((r) => r.id === requestId);
    const existingReq = index !== -1 ? all[index] : null;

    // Check existing status from local state or DB
    let currentStatus = existingReq?.status;
    if (!currentStatus && isDbUUID && isSupabaseConfigured()) {
      try {
        const { data: dbRow } = await (supabase as any)
          .from('adoption_requests')
          .select('status')
          .eq('id', requestId)
          .maybeSingle();
        if (dbRow?.status) {
          const raw = dbRow.status.toLowerCase();
          currentStatus = raw === 'cancelled'
            ? 'Cancelled'
            : raw === 'approved'
            ? 'Approved'
            : raw === 'completed'
            ? 'Completed'
            : raw === 'rejected'
            ? 'Rejected'
            : dbRow.status;
        }
      } catch (err) {
        console.warn('[adoptionService] Error checking request status:', err);
      }
    }

    const normalizedStatus = currentStatus?.toLowerCase();
    if (normalizedStatus === 'cancelled') {
      throw new Error('Cannot modify or approve an adoption application that has been cancelled by the applicant.');
    }
    if (normalizedStatus === 'completed') {
      throw new Error('Adoption has already been officially completed and finalized.');
    }
    if (normalizedStatus === 'rejected') {
      throw new Error('Cannot modify an adoption application that has been declined.');
    }
    if (normalizedStatus === 'approved' && (action === 'update_verification' || action === 'approve')) {
      throw new Error('Verification checklist is permanently locked once the application is approved.');
    }

    // 1. Calculate the final, mathematically sound verification object
    const finalVerification: AdoptionVerification = verification
      ? { ...verification }
      : existingReq?.verification
      ? { ...existingReq.verification }
      : getDefaultVerification(existingReq || {});

    if (action === 'approve') {
      finalVerification.level = 4;
      finalVerification.percentage = 100;
      finalVerification.statusTitle = 'Level 4: Fully Approved & Foster-to-Own Trial Active';
      finalVerification.lastUpdated = new Date().toISOString();
      finalVerification.steps = finalVerification.steps.map((s) => ({
        ...s,
        completed: true,
        checks: s.checks.map((c) => ({ ...c, checked: true })),
      }));
    } else if (action === 'update_verification' && verification) {
      if (verification.percentage >= 100) {
        finalVerification.level = 4;
        finalVerification.percentage = 100;
        finalVerification.statusTitle = 'Level 4: Fully Approved & Foster-to-Own Trial Active';
        finalVerification.steps = verification.steps.map((s) => ({
          ...s,
          completed: true,
          checks: s.checks.map((c) => ({ ...c, checked: true })),
        }));
      } else {
        finalVerification.level = verification.level;
        finalVerification.percentage = verification.percentage;
        finalVerification.statusTitle = verification.statusTitle;
        finalVerification.steps = verification.steps;
      }
      finalVerification.lastUpdated = new Date().toISOString();
    }

    const resolvedStatus: AdoptionRequestStatus =
      action === 'approve'
        ? 'Approved'
        : action === 'reject'
        ? 'Rejected'
        : finalVerification.percentage >= 100
        ? 'Approved'
        : existingReq?.status === 'Pending'
        ? 'Under Review'
        : existingReq?.status || 'Under Review';

    const syncedTimeline = buildSynchronizedTimeline(
      existingReq?.timeline,
      resolvedStatus,
      existingReq?.createdAt || new Date().toISOString(),
      new Date().toISOString()
    );

    // 2. Persist to Supabase Database (RPC + Direct Table Update)
    if (isSupabaseConfigured() && isDbUUID) {
      try {
        const { error: rpcError } = await (supabase as any).rpc('admin_manage_adoption_request', {
          p_request_id: requestId,
          p_action: action,
          p_notes: notes || null,
          p_verification: finalVerification,
        });

        if (rpcError) {
          console.warn('[adoptionService] admin_manage_adoption_request RPC warning:', rpcError);
        }

        // Direct table update ensures table columns (timeline, verification, status) are 100% in sync
        const dbStatus =
          resolvedStatus === 'Approved'
            ? 'approved'
            : resolvedStatus === 'Rejected'
            ? 'rejected'
            : 'under_review';

        await (supabase as any)
          .from('adoption_requests')
          .update({
            status: dbStatus,
            verification: finalVerification,
            timeline: syncedTimeline,
            provider_notes: notes || (resolvedStatus === 'Approved' ? 'Verified and approved by Platform Administration.' : undefined),
            reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', requestId);
      } catch (err) {
        console.warn('[adoptionService] Error synchronizing admin management to Supabase:', err);
      }
    }

    let updatedReq: AdoptionRequest;

    if (existingReq) {
      if (resolvedStatus === 'Approved') {
        existingReq.status = 'Approved';
        existingReq.reviewNotes = notes || 'Approved by Platform Administration';
        existingReq.updatedAt = new Date().toISOString();
        existingReq.verification = finalVerification;
        existingReq.timeline = syncedTimeline;

        const endTrial = new Date();
        endTrial.setDate(endTrial.getDate() + 14);
        existingReq.trial = {
          startDate: new Date().toISOString().split('T')[0],
          endDate: endTrial.toISOString().split('T')[0],
          currentDay: 1,
          totalDays: 14,
          notes: ['Day 1: Platform Administration approved application. 14-day Foster-to-Own trial active.'],
        };

        await petService.updatePetStatus(existingReq.petId, 'Adoption Pending');
        if (existingReq.petId && existingReq.adopterId) {
          favoriteService.removeFavorite(existingReq.petId, existingReq.adopterId).catch(() => {});
          realtimeSync.notifyChange('favorite_removed', existingReq.petId, { adopterId: existingReq.adopterId, petId: existingReq.petId });
        }
      } else if (resolvedStatus === 'Rejected') {
        existingReq.status = 'Rejected';
        existingReq.reviewNotes = notes || 'Criteria not met at this time.';
        existingReq.updatedAt = new Date().toISOString();
        existingReq.verification = finalVerification;
        existingReq.timeline = syncedTimeline;
      } else {
        existingReq.status = resolvedStatus;
        existingReq.updatedAt = new Date().toISOString();
        existingReq.verification = finalVerification;
        existingReq.timeline = syncedTimeline;
      }
      updatedReq = existingReq;
      all[index] = existingReq;
      saveRequests(all);
    } else {
      updatedReq = {
        id: requestId,
        petId: '',
        petName: 'Companion',
        petBreed: '',
        petImage: '',
        providerId: '',
        providerName: '',
        providerLocation: '',
        adopterId: '',
        adopterName: '',
        adopterEmail: '',
        adopterPhone: '',
        adopterLocation: '',
        adopterAvatar: '',
        message: '',
        homeType: 'Apartment',
        existingPets: 'None',
        children: 'None',
        petExperience: 'Experienced',
        timeAvailable: 'Home daily',
        whyTheyWantToAdopt: '',
        confirmedAccurate: true,
        status: action === 'approve' ? 'Approved' : action === 'reject' ? 'Rejected' : 'Under Review',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        verification: finalVerification,
        timeline: [],
      };
      all.unshift(updatedReq);
      saveRequests(all);
    }

    // Add local notifications
    if (action === 'approve') {
      notificationService.addNotification({
        userId: updatedReq.adopterId,
        type: 'request_approved',
        title: 'Adoption Request Approved! 🎉',
        message: `Your adoption request for ${updatedReq.petName} was approved by Platform Administration! 14-day Foster-to-Own trial started.`,
        link: `/adopter/requests/${updatedReq.id}`,
        petName: updatedReq.petName,
        petImage: updatedReq.petImage,
      });
      notificationService.addNotification({
        userId: 'usr_admin',
        type: 'request_approved',
        title: `Adoption Approved: ${updatedReq.petName}`,
        message: `You approved the adoption application for ${updatedReq.petName} submitted by ${updatedReq.adopterName}.`,
        link: getAdminPath('requests'),
        petName: updatedReq.petName,
        petImage: updatedReq.petImage,
      });
    }

    realtimeSync.notifyChange('adoption_request_updated', requestId, updatedReq);
    return updatedReq;
  },

  /**
   * Secure Provider Approval (Phase 10)
   * Real Mode: executes PostgreSQL RPC `provider_approve_adoption_request`.
   * Demo Mode: simulates 14-day Foster-to-Own bonding trial.
   */
  async approveRequest(requestId: string, notes?: string): Promise<AdoptionRequest> {
    if (isRealMode() && isUUID(requestId)) {
      const { data, error } = await (supabase as any).rpc('provider_approve_adoption_request', {
        p_request_id: requestId,
        p_notes: notes || null,
        p_cancel_competing: true,
      });

      if (error) {
        console.error('[adoptionService] Error approving request via RPC:', error);
        throw new Error(error.message || 'Failed to approve adoption request.');
      }

      // Dispatch background transactional emails (non-blocking)
      emailNotificationService.dispatchEmail('adoption_request_approved', requestId);
      if (data?.trial_id) {
        emailNotificationService.dispatchEmail('trial_started', data.trial_id);
      }

      const updated = await this.getRequestById(requestId);
      if (!updated) throw new Error('Adoption request approved, but failed to fetch updated record.');

      if (updated.petId && updated.adopterId) {
        favoriteService.removeFavorite(updated.petId, updated.adopterId).catch(() => {});
        realtimeSync.notifyChange('favorite_removed', updated.petId, { adopterId: updated.adopterId, petId: updated.petId });
      }

      realtimeSync.notifyChange('adoption_request_updated', requestId, updated);
      return updated;
    }

    // Demo Mode fallback
    const demoUpdated = await this.updateRequestStatus(
      requestId,
      'Approved',
      notes || 'Home environment pre-approved. Starting 14-day Foster-to-Own trial.'
    );
    realtimeSync.notifyChange('adoption_request_updated', requestId, demoUpdated);
    return demoUpdated;
  },

  /**
   * Secure Provider Rejection (Phase 10)
   * Real Mode: executes PostgreSQL RPC `provider_reject_adoption_request`.
   * Demo Mode: simulates rejection.
   */
  async rejectRequest(requestId: string, reason?: string): Promise<AdoptionRequest> {
    if (isRealMode() && isUUID(requestId)) {
      const { data, error } = await (supabase as any).rpc('provider_reject_adoption_request', {
        p_request_id: requestId,
        p_reason: reason || null,
      });

      if (error) {
        console.error('[adoptionService] Error rejecting request via RPC:', error);
        throw new Error(error.message || 'Failed to reject adoption request.');
      }

      // Dispatch background transactional email (non-blocking)
      emailNotificationService.dispatchEmail('adoption_request_rejected', requestId);

      const updated = await this.getRequestById(requestId);
      if (!updated) throw new Error('Adoption request rejected, but failed to fetch updated record.');
      realtimeSync.notifyChange('adoption_request_updated', requestId, updated);
      return updated;
    }

    // Demo Mode fallback
    const demoRejected = await this.updateRequestStatus(
      requestId,
      'Rejected',
      reason || 'Home conditions not fully suitable for this specific breed profile.'
    );
    realtimeSync.notifyChange('adoption_request_updated', requestId, demoRejected);
    return demoRejected;
  },

  /**
   * Secure Provider Request for More Information (Phase 10)
   * Real Mode: executes PostgreSQL RPC `provider_request_more_information`.
   * Demo Mode: simulates clarification request.
   */
  async requestMoreInfo(requestId: string, question: string): Promise<AdoptionRequest> {
    const trimmed = (question || '').trim();
    if (!trimmed) {
      throw new Error('A question or clarification message is required.');
    }

    if (isRealMode() && isUUID(requestId)) {
      const { data, error } = await (supabase as any).rpc('provider_request_more_information', {
        p_request_id: requestId,
        p_question: trimmed,
      });

      if (error) {
        console.error('[adoptionService] Error requesting more info via RPC:', error);
        throw new Error(error.message || 'Failed to send question to adopter.');
      }

      // Dispatch background transactional email (non-blocking)
      emailNotificationService.dispatchEmail('more_information_requested', requestId);

      const updated = await this.getRequestById(requestId);
      if (!updated) throw new Error('Clarification sent, but failed to fetch updated record.');
      realtimeSync.notifyChange('adoption_request_updated', requestId, updated);
      return updated;
    }

    // Demo Mode fallback
    const demoClarified = await this.updateRequestStatus(
      requestId,
      'More Information Required',
      `Provider Question: ${trimmed}`
    );
    realtimeSync.notifyChange('adoption_request_updated', requestId, demoClarified);
    return demoClarified;
  },

  async updateRequestStatus(
    id: string,
    status: AdoptionRequestStatus,
    reviewNote?: string
  ): Promise<AdoptionRequest> {
    if (isRealMode() && isUUID(id)) {
      if (status === 'Approved') {
        return this.approveRequest(id, reviewNote);
      }
      if (status === 'Rejected') {
        return this.rejectRequest(id, reviewNote);
      }
      if (status === 'More Information Required') {
        return this.requestMoreInfo(id, reviewNote || 'Additional details required.');
      }
      if (status === 'Cancelled') {
        await this.withdrawRequest(id);
        const updated = await this.getRequestById(id);
        if (!updated) throw new Error('Failed to retrieve updated request');
        realtimeSync.notifyChange('adoption_request_updated', id, updated);
        return updated;
      }

      const dbStatus = status === 'Under Review' ? 'under_review' : status.toLowerCase();
      const updatePayload: any = {
        status: dbStatus,
      };
      if (reviewNote) {
        updatePayload.provider_notes = reviewNote;
        updatePayload.reviewed_at = new Date().toISOString();
      }

      const { error } = await (supabase as any)
        .from('adoption_requests')
        .update(updatePayload)
        .eq('id', id);

      if (error) {
        console.error(`[adoptionService] Error updating status for request ${id}:`, error);
        throw error;
      }

      const updated = await this.getRequestById(id);
      if (!updated) throw new Error('Failed to retrieve updated request');
      realtimeSync.notifyChange('adoption_request_updated', id, updated);
      return updated;
    }

    // Demo Mode simulation
    const all = loadRequests();
    const index = all.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Request not found');

    const req = all[index];
    req.status = status;
    req.updatedAt = new Date().toISOString();
    if (reviewNote) req.reviewNotes = reviewNote;

    const formattedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if (status === 'More Information Required') {
      req.timeline[0].completed = true;
      req.timeline[1].completed = true;
      req.timeline[1].current = true;
      req.timeline[1].title = 'Clarification Requested';
      req.timeline[1].date = formattedDate;

      notificationService.addNotification({
        userId: req.adopterId,
        type: 'more_info_requested',
        title: 'Information Requested',
        message: `${req.providerName} requested additional details for ${req.petName}.`,
        link: `/adopter/requests/${req.id}`,
        petName: req.petName,
        petImage: req.petImage,
      });
    } else if (status === 'Under Review') {
      req.timeline[0].completed = true;
      req.timeline[1].completed = true;
      req.timeline[1].current = true;
      req.timeline[1].date = formattedDate;

      notificationService.addNotification({
        userId: req.adopterId,
        type: 'request_reviewing',
        title: 'Review in Progress',
        message: `${req.providerName} is reviewing your adoption request for ${req.petName}.`,
        link: `/adopter/requests/${req.id}`,
        petName: req.petName,
        petImage: req.petImage,
      });
    } else if (status === 'Approved') {
      req.timeline[0].completed = true;
      req.timeline[1].completed = true;
      req.timeline[1].current = false;
      req.timeline[2].completed = true;
      req.timeline[2].current = true;
      req.timeline[2].date = formattedDate;

      const endTrial = new Date();
      endTrial.setDate(endTrial.getDate() + 14);
      req.trial = {
        startDate: new Date().toISOString().split('T')[0],
        endDate: endTrial.toISOString().split('T')[0],
        currentDay: 1,
        totalDays: 14,
        notes: ['Day 1: Trial started. Welcome home!'],
      };

      notificationService.addNotification({
        userId: req.adopterId,
        type: 'request_approved',
        title: 'Adoption Request Approved ❤️',
        message: `Your adoption request for ${req.petName} was approved by ${req.providerName}! 14-day Foster-to-Own trial started.`,
        link: `/adopter/requests/${req.id}`,
        petName: req.petName,
        petImage: req.petImage,
      });

      await petService.updatePetStatus(req.petId, 'Adoption Pending');
      if (req.petId && req.adopterId) {
        favoriteService.removeFavorite(req.petId, req.adopterId).catch(() => {});
        realtimeSync.notifyChange('favorite_removed', req.petId, { adopterId: req.adopterId, petId: req.petId });
      }
    } else if (status === 'Completed') {
      req.timeline.forEach((t) => {
        t.completed = true;
        t.current = false;
      });
      req.timeline[3].current = true;
      req.timeline[3].date = formattedDate;

      await petService.updatePetStatus(req.petId, 'Adopted');
      if (req.petId && req.adopterId) {
        favoriteService.removeFavorite(req.petId, req.adopterId).catch(() => {});
        realtimeSync.notifyChange('favorite_removed', req.petId, { adopterId: req.adopterId, petId: req.petId });
      }

      notificationService.addNotification({
        userId: req.adopterId,
        type: 'adoption_completed',
        title: "IT'S OFFICIAL ❤️",
        message: `Congratulations! Your adoption of ${req.petName} is officially completed!`,
        link: `/adoption-success/${req.petId}`,
        petName: req.petName,
        petImage: req.petImage,
      });
    } else if (status === 'Rejected') {
      notificationService.addNotification({
        userId: req.adopterId,
        type: 'request_rejected',
        title: 'Request Update',
        message: `Your adoption request for ${req.petName} could not be approved at this time.`,
        link: `/adopter/requests/${req.id}`,
        petName: req.petName,
        petImage: req.petImage,
      });
    }

    all[index] = req;
    saveRequests(all);
    return req;
  },

  async requestTrialExtension(
    id: string,
    additionalDays: 3 | 7 | 14 = 7,
    reason?: string
  ): Promise<void> {
    if (isRealMode()) {
      await trialExtensionService.requestExtension(id, additionalDays, reason);
      return;
    }

    const all = loadRequests();
    const req = all.find((r) => r.id === id || r.trial?.id === id);
    if (req && req.trial) {
      req.trial.extensionRequested = true;
      req.trial.extension = {
        requestedDays: additionalDays,
        reason,
        requestedAt: new Date().toISOString(),
        status: 'pending',
      };
      if (!req.trial.notes) req.trial.notes = [];
      req.trial.notes.push(
        `Requested ${additionalDays} days extension from provider (${reason || 'for continued bonding'}).`
      );

      notificationService.addNotification({
        userId: req.providerId,
        type: 'request_received',
        title: 'Trial Extension Requested',
        message: `${req.adopterName} requested a ${additionalDays}-day trial extension for ${req.petName}.`,
        link: `/provider/requests/${req.id}`,
        petName: req.petName,
        petImage: req.petImage,
      });

      notificationService.addNotification({
        userId: 'usr_admin',
        type: 'request_received',
        title: 'Trial Extension Requested',
        message: `${req.adopterName} requested a ${additionalDays}-day trial extension for ${req.petName}. Review and approve in Admin Portal.`,
        link: getAdminPath('requests'),
        petName: req.petName,
        petImage: req.petImage,
      });

      saveRequests(all);
      realtimeSync.notifyChange('foster_trial_updated', req.id);
      realtimeSync.notifyChange('adoption_request_updated', req.id);
      realtimeSync.notifyChange('notification_received');
    }
  },

  async respondToTrialExtension(id: string, approved: boolean): Promise<void> {
    if (isRealMode()) {
      await trialExtensionService.respondToExtension(id, approved);
      return;
    }

    const all = loadRequests();
    const req = all.find((r) => r.id === id || r.trial?.id === id);
    if (req && req.trial && req.trial.extension) {
      const extDays = req.trial.extension.requestedDays;

      if (approved) {
        req.trial.extension.status = 'approved';
        req.trial.extensionRequested = false;

        const currentEnd = new Date(req.trial.endDate);
        currentEnd.setDate(currentEnd.getDate() + extDays);
        req.trial.endDate = currentEnd.toISOString().split('T')[0];
        req.trial.totalDays += extDays;

        if (!req.trial.notes) req.trial.notes = [];
        req.trial.notes.push(
          `Approved +${extDays} days extension. New trial end date: ${req.trial.endDate}.`
        );

        notificationService.addNotification({
          userId: req.adopterId,
          type: 'request_approved',
          title: 'Trial Extension Approved! 🎉',
          message: `Your +${extDays} days trial extension for ${req.petName} was approved.`,
          link: `/adopter/requests/${req.id}`,
          petName: req.petName,
          petImage: req.petImage,
        });

        notificationService.addNotification({
          userId: 'usr_admin',
          type: 'request_approved',
          title: 'Trial Extension Approved',
          message: `Trial extension (+${extDays} days) approved for ${req.petName}. New end date: ${req.trial.endDate}.`,
          link: getAdminPath('requests'),
          petName: req.petName,
          petImage: req.petImage,
        });
      } else {
        req.trial.extension.status = 'declined';
        req.trial.extensionRequested = false;

        if (!req.trial.notes) req.trial.notes = [];
        req.trial.notes.push(`Trial extension request declined.`);

        notificationService.addNotification({
          userId: req.adopterId,
          type: 'request_rejected',
          title: 'Trial Extension Declined',
          message: `Your extension request for ${req.petName} was declined. Please continue bonding and prepare for the final decision.`,
          link: `/adopter/requests/${req.id}`,
          petName: req.petName,
          petImage: req.petImage,
        });

        notificationService.addNotification({
          userId: 'usr_admin',
          type: 'request_rejected',
          title: 'Trial Extension Declined',
          message: `Trial extension request for ${req.petName} was declined.`,
          link: getAdminPath('requests'),
          petName: req.petName,
          petImage: req.petImage,
        });
      }

      saveRequests(all);
      realtimeSync.notifyChange('foster_trial_updated', req.id);
      realtimeSync.notifyChange('adoption_request_updated', req.id);
      realtimeSync.notifyChange('notification_received');
    }
  },

  async makeAdoptionOfficial(id: string, notes?: string): Promise<void> {
    const targetId = id;
    if (isSupabaseConfigured() && isUUID(targetId)) {
      const { data, error } = await (supabase as any).rpc('adopter_complete_adoption', {
        p_identifier: targetId,
        p_notes: notes || null,
      });

      if (error) {
        console.error('[adoptionService] Error completing adoption via RPC:', error);
        throw new Error(error.message || 'Failed to finalize adoption. Please try again.');
      }

      const petId = data?.pet_id;
      if (petId) {
        await petService.updatePetStatus(petId, 'Adopted');
        favoriteService.removeFavorite(petId).catch(() => {});
        realtimeSync.notifyChange('pet_updated', petId);
        realtimeSync.notifyChange('pet_status_updated', petId);
        realtimeSync.notifyChange('favorite_removed', petId);
      }
      // Guarantee trial extension requests in database are marked resolved
      if (isSupabaseConfigured() && isUUID(targetId)) {
        try {
          await (supabase as any)
            .from('trial_extension_requests')
            .update({
              status: 'rejected',
              provider_notes: 'Adoption completed officially early by foster parent.',
              resolved_at: new Date().toISOString(),
            })
            .eq('trial_id', targetId)
            .eq('status', 'pending');
        } catch (_) {}
      }

      realtimeSync.notifyChange('adoption_request_updated', targetId);
      realtimeSync.notifyChange('foster_trial_updated', targetId);
      realtimeSync.notifyChange('notification_received');
      realtimeSync.notifyChange('all');
      return;
    }

    const all = loadRequests();
    const req = all.find((r) => r.id === id || r.trial?.id === id);
    if (req) {
      req.status = 'Completed';
      if (req.trial) {
        req.trial.status = 'Adoption Completed';
        req.trial.extensionRequested = false;
        if (req.trial.extension && req.trial.extension.status === 'pending') {
          req.trial.extension.status = 'approved';
          req.trial.extension.providerResponse = 'Adoption officially finalized.';
        }
      }
      if (req.petId) {
        await petService.updatePetStatus(req.petId, 'Adopted');
        favoriteService.removeFavorite(req.petId).catch(() => {});
        realtimeSync.notifyChange('pet_updated', req.petId);
        realtimeSync.notifyChange('pet_status_updated', req.petId);
        realtimeSync.notifyChange('favorite_removed', req.petId);
      }
      if (Array.isArray(req.timeline)) {
        req.timeline = req.timeline.map((step) => {
          if (step.step === 4 || step.status === 'Completed') {
            return {
              ...step,
              completed: true,
              current: true,
              date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              description: 'Official adoption finalized and certificate issued.',
            };
          }
          return { ...step, current: false };
        });
      }
      // Cancel competing requests for this same pet in demo mode (aligns with DB RPC)
      all.forEach((other) => {
        if (other.id !== req.id && other.petId === req.petId) {
          if (other.status === 'Pending' || other.status === 'Under Review' || other.status === 'Approved') {
            other.status = 'Cancelled';
            other.reviewNotes = (other.reviewNotes ? other.reviewNotes + ' ' : '') + '[System: Pet was officially adopted by foster parent.]';
          }
        }
      });
      saveRequests(all);
    }
    realtimeSync.notifyChange('adoption_request_updated', id);
    realtimeSync.notifyChange('foster_trial_updated', id);
    realtimeSync.notifyChange('notification_received');
    realtimeSync.notifyChange('all');
  },
};


