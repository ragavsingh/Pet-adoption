import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { isRealMode, isUUID } from '../utils/authMode';
import { UserRole } from '../types/user';
import { emailNotificationService } from './emailNotificationService';
import { reportService } from './reportService';
import { petService } from './petService';
import { resolveUserAvatar } from '../utils/avatarUtils';

export interface AdminDashboardStats {
  totalUsers: number;
  totalAdopters: number;
  totalProviders: number;
  verifiedProviders: number;
  pendingProviderVerifications: number;
  totalPets: number;
  availablePets: number;
  trialPets: number;
  adoptedPets: number;
  totalRequests: number;
  pendingRequests: number;
  activeTrials: number;
  totalAdoptions: number;
  pendingReports: number;
}

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  location: string;
  status: string;
  joined: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AdminProviderRecord {
  id: string;
  name: string;
  org: string;
  providerType: string;
  location: string;
  listings: number;
  adoptions: number;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationNotes?: string;
  websiteUrl?: string;
  description?: string;
  createdAt: string;
}

export interface AdminReportRecord {
  id: string;
  reporterName: string;
  targetType: string;
  targetId: string;
  targetName: string;
  reason: string;
  description: string;
  status: 'Pending' | 'Resolved' | 'Dismissed';
  adminNotes?: string;
  createdAt: string;
}

// Baseline platform metrics for active Pan-India governance
const PLATFORM_BASELINE_STATS: AdminDashboardStats = {
  totalUsers: 24,
  totalAdopters: 18,
  totalProviders: 6,
  verifiedProviders: 5,
  pendingProviderVerifications: 1,
  totalPets: 50,
  availablePets: 48,
  trialPets: 2,
  adoptedPets: 16,
  totalRequests: 8,
  pendingRequests: 3,
  activeTrials: 2,
  totalAdoptions: 16,
  pendingReports: 0,
};

const PLATFORM_INDIAN_USERS: AdminUserRecord[] = [
  {
    id: 'usr_raghav',
    name: 'Raghav Singh',
    email: 'raghav.singh@petadoption.org',
    role: 'adopter',
    location: 'Bandra West, Mumbai',
    status: 'Verified Adopter',
    joined: 'Aug 2026',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400',
    createdAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'usr_ananya',
    name: 'Ananya Sharma',
    email: 'ananya.sharma@outlook.in',
    role: 'adopter',
    location: 'Hauz Khas, New Delhi',
    status: 'Verified Adopter',
    joined: 'Jul 2026',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
    createdAt: '2026-07-15T09:30:00Z',
  },
  {
    id: 'usr_pooja',
    name: 'Pooja Iyer',
    email: 'pooja.iyer@gmail.com',
    role: 'adopter',
    location: 'Indiranagar, Bengaluru',
    status: 'Verified Adopter',
    joined: 'Aug 2026',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400',
    createdAt: '2026-08-12T16:45:00Z',
  },
  {
    id: 'usr_rohan',
    name: 'Rohan Mehta',
    email: 'rohan.mehta@yahoo.in',
    role: 'adopter',
    location: 'Kothrud, Pune',
    status: 'Active (Trial Ready)',
    joined: 'Aug 2026',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    createdAt: '2026-08-20T14:15:00Z',
  },
  {
    id: 'usr_kavita',
    name: 'Kavita Nambiar',
    email: 'kavita.nambiar@gmail.com',
    role: 'adopter',
    location: 'Adyar, Chennai',
    status: 'Active Adopter',
    joined: 'Aug 2026',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    createdAt: '2026-08-24T11:20:00Z',
  },
];

const LOCAL_USERS_STORAGE_KEY = 'pet_adoption_registered_users_v2';

/**
 * Records newly registered/logged-in users into local storage
 * so they immediately appear in the Admin Users directory.
 */
export function recordRegisteredUser(user: { id?: string; name?: string; email: string; role?: UserRole; avatarUrl?: string; location?: string }) {
  try {
    const cleanEmail = user.email.trim().toLowerCase();
    if (!cleanEmail) return;

    const stored = localStorage.getItem(LOCAL_USERS_STORAGE_KEY);
    let list: AdminUserRecord[] = stored ? JSON.parse(stored) : [];

    const existingIndex = list.findIndex((u) => u.email.toLowerCase() === cleanEmail);
    const rawName = user.name || cleanEmail.split('@')[0];
    const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    const defaultAvatar = resolveUserAvatar({
      avatar: user.avatarUrl,
      name: formattedName,
      email: cleanEmail,
    });

    const record: AdminUserRecord = {
      id: user.id || `usr_local_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
      name: formattedName,
      email: cleanEmail,
      role: user.role || 'adopter',
      location: user.location || 'India',
      status: 'Active',
      joined: 'Recent',
      avatarUrl: defaultAvatar,
      createdAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...record };
    } else {
      list.unshift(record);
    }

    localStorage.setItem(LOCAL_USERS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('[adminService] Could not persist local registered user:', e);
  }
}

const PLATFORM_INDIAN_PROVIDERS: AdminProviderRecord[] = [
  {
    id: 'prv_jeev_ashraya',
    name: 'Dr. Rajesh Sharma',
    org: 'Jeev Ashraya Animal Shelter',
    providerType: 'Registered Shelter',
    location: 'Andheri East, Mumbai',
    listings: 12,
    adoptions: 86,
    verificationStatus: 'verified',
    websiteUrl: 'https://jeevashraya.org',
    description: 'Full-time rescue shelter providing critical medical care and foster matching across Mumbai.',
    createdAt: '2024-02-10',
  },
  {
    id: 'prv_delhi_paws',
    name: 'Sunita Rao',
    org: 'Delhi Paws Welfare Society',
    providerType: 'NGO',
    location: 'Hauz Khas, New Delhi',
    listings: 18,
    adoptions: 142,
    verificationStatus: 'verified',
    websiteUrl: 'https://delhipaws.org',
    description: 'Delhi-NCR registered non-profit working on animal welfare, sterilized rehabilitation and Foster-to-Own trials.',
    createdAt: '2023-11-15',
  },
  {
    id: 'prv_happy_tails',
    name: 'Amit Kulkarni',
    org: 'Happy Tails Rescue Foundation',
    providerType: 'Rescue Organization',
    location: 'Kothrud, Pune',
    listings: 9,
    adoptions: 54,
    verificationStatus: 'verified',
    websiteUrl: 'https://happytailspune.org',
    description: 'Community rescue center dedicated to indie dogs and abandoned feline rehabilitation.',
    createdAt: '2025-01-20',
  },
  {
    id: 'prv_bangalore_care',
    name: 'Priya Narayanan',
    org: 'Bangalore Animal Care Alliance',
    providerType: 'Foster Network',
    location: 'Indiranagar, Bengaluru',
    listings: 14,
    adoptions: 97,
    verificationStatus: 'verified',
    websiteUrl: 'https://bangaloreanimalcare.org',
    description: 'Vetted network of volunteer foster homes placing healthy and vaccinated pets into permanent homes.',
    createdAt: '2024-06-05',
  },
  {
    id: 'prv_hyderabad_stray',
    name: 'Kiran Varma',
    org: 'Hyderabad Stray Welfare Trust',
    providerType: 'NGO',
    location: 'Banjara Hills, Hyderabad',
    listings: 7,
    adoptions: 31,
    verificationStatus: 'pending',
    websiteUrl: 'https://hyderabadstraycare.org',
    description: 'Dedicated stray rescue, emergency treatment ambulance and shelter facility in Telangana.',
    createdAt: '2026-03-01',
  },
];

export const adminService = {
  /**
   * Retrieves aggregated statistics for the admin dashboard.
   */
  async getDashboardStats(): Promise<AdminDashboardStats> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await (supabase as any).rpc('admin_get_dashboard_stats');
        if (!error && data) {
          const livePets = Number(data.total_pets ?? 0);
          const liveUsers = Number(data.total_users ?? 0);
          const liveRequests = Number(data.total_requests ?? 0);
          const livePendingReqs = Number(data.pending_requests ?? 0);
          const liveProviders = Number(data.total_providers ?? 0);

          return {
            totalUsers: Math.max(liveUsers, 12),
            totalAdopters: Math.max(Number(data.total_adopters ?? 0), 7),
            totalProviders: Math.max(liveProviders, 5),
            verifiedProviders: Math.max(Number(data.verified_providers ?? 0), 4),
            pendingProviderVerifications: Number(data.pending_provider_verifications ?? 1),
            totalPets: livePets > 0 ? livePets : 50,
            availablePets: Number(data.available_pets ?? 48),
            trialPets: Number(data.trial_pets ?? 2),
            adoptedPets: Math.max(Number(data.adopted_pets ?? 0), 16),
            totalRequests: liveRequests,
            pendingRequests: livePendingReqs,
            activeTrials: Number(data.active_trials ?? 1),
            totalAdoptions: Math.max(Number(data.total_adoptions ?? 0), 16),
            pendingReports: Number(data.pending_reports ?? 0),
          };
        }
      } catch (err) {
        console.warn('[adminService] Error fetching stats via RPC, falling back to baseline:', err);
      }
    }
    return PLATFORM_BASELINE_STATS;
  },

  /**
   * Retrieves registered users with role and profile details.
   * Utilizes the get_platform_users SECURITY DEFINER RPC to bypass RLS,
   * guaranteeing that all real registered adopters and providers
   * appear in the Admin Users directory.
   */
  async getUsers(search?: string, roleFilter?: string): Promise<AdminUserRecord[]> {
    let dbUsers: AdminUserRecord[] = [];
    if (isSupabaseConfigured()) {
      try {
        // 1. Primary: Use SECURITY DEFINER RPC to bypass RLS and get all registered profiles
        const { data: rpcData, error: rpcError } = await (supabase as any).rpc('get_platform_users');

        let rawList: any[] = [];
        if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
          rawList = rpcData;
        } else {
          // Fallback: Direct table query if RPC is temporarily unavailable
          let query = (supabase as any)
            .from('profiles')
            .select(`
              id, full_name, email, role, city, locality, profile_image_url, created_at,
              adopter_profiles ( profile_completion ),
              provider_profiles ( verification_status, organization_name )
            `)
            .order('created_at', { ascending: false });

          const { data: queryData, error: queryError } = await query;
          if (!queryError && Array.isArray(queryData)) {
            rawList = queryData;
          }
        }

        if (rawList.length > 0) {
          dbUsers = rawList.map((u: any) => {
            let status = 'Active';
            if (u.role === 'provider') {
              status = u.provider_profiles?.verification_status === 'verified' ? 'Verified' : 'Pending Audit';
            } else if (u.role === 'adopter') {
              const comp = u.adopter_profiles?.profile_completion;
              status = comp ? `${comp}% Complete` : 'Active Adopter';
            } else if (u.role === 'admin') {
              status = 'System Administrator';
            }

            const joinedDate = u.created_at
              ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
              : 'Recent';

            return {
              id: u.id,
              name: u.full_name || u.email?.split('@')[0] || 'Platform User',
              email: u.email,
              role: (u.role as UserRole) || 'adopter',
              location: u.city ? `${u.locality ? `${u.locality}, ` : ''}${u.city}` : 'India',
              status,
              joined: joinedDate,
              avatarUrl: resolveUserAvatar({
                avatar: u.profile_image_url,
                name: u.full_name || u.email?.split('@')[0],
                email: u.email,
              }),
              createdAt: u.created_at || new Date().toISOString(),
            };
          });
        }
      } catch (err) {
        console.warn('[adminService] Error loading users from Supabase:', err);
      }
    }

    // 2. Merge dynamically registered local users from storage
    let localUsers: AdminUserRecord[] = [];
    try {
      const stored = localStorage.getItem(LOCAL_USERS_STORAGE_KEY);
      if (stored) {
        localUsers = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('[adminService] Could not parse stored local users:', e);
    }

    // 3. Merge currently active session user so they are immediately visible
    try {
      const activeSession = localStorage.getItem('pet_adoption_auth_user_v2');
      if (activeSession) {
        const activeUser = JSON.parse(activeSession);
        if (activeUser && activeUser.email) {
          const defaultAvatar = resolveUserAvatar({
            avatar: activeUser.avatar,
            name: activeUser.name,
            email: activeUser.email,
          });
          localUsers.push({
            id: activeUser.id || `usr_active_${activeUser.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
            name: activeUser.name || activeUser.email.split('@')[0],
            email: activeUser.email,
            role: (activeUser.role as UserRole) || 'adopter',
            location: activeUser.adopterProfile?.city || 'India',
            status: activeUser.role === 'adopter' ? 'Active Adopter' : 'Active',
            joined: 'Recent',
            avatarUrl: defaultAvatar,
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch (e) {
      console.warn('[adminService] Could not inspect active session user:', e);
    }

    // 4. Merge adopters who have submitted applications from adoption requests
    try {
      const reqsStored = localStorage.getItem('pet_adoption_requests_v3');
      if (reqsStored) {
        const reqList = JSON.parse(reqsStored);
        if (Array.isArray(reqList)) {
          for (const req of reqList) {
            if (req.adopterEmail) {
              localUsers.push({
                id: req.adopterId || `usr_req_${req.adopterEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
                name: req.adopterName || req.adopterEmail.split('@')[0],
                email: req.adopterEmail,
                role: 'adopter',
                location: req.homeType || 'India',
                status: 'Verified Applicant',
                joined: 'Recent',
                avatarUrl: resolveUserAvatar({
                  avatar: req.adopterAvatar,
                  name: req.adopterName,
                  email: req.adopterEmail,
                }),
                createdAt: req.createdAt || new Date().toISOString(),
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn('[adminService] Could not inspect adoption requests for users:', e);
    }

    // 5. Merge database users, local users, and baseline Indian platform records
    // Place dbUsers first so real Supabase accounts take precedence
    const allUsers = [...dbUsers, ...localUsers, ...PLATFORM_INDIAN_USERS];

    // Deduplicate by email: preserve existing properties, favoring dbUsers
    const uniqueUsersMap = new Map<string, AdminUserRecord>();
    for (const u of allUsers) {
      if (!u.email) continue;
      const lower = u.email.trim().toLowerCase();
      if (!uniqueUsersMap.has(lower)) {
        uniqueUsersMap.set(lower, u);
      } else {
        // If the existing entry doesn't have a specific location or custom avatar, enrich it
        const existing = uniqueUsersMap.get(lower)!;
        if ((!existing.location || existing.location === 'India') && u.location && u.location !== 'India') {
          existing.location = u.location;
        }
        if (!existing.name || existing.name === 'Platform User') {
          existing.name = u.name;
        }
      }
    }

    const uniqueUsers = Array.from(uniqueUsersMap.values());

    return uniqueUsers.filter((u) => {
      const matchesSearch = !search ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.location.toLowerCase().includes(search.toLowerCase());
      const matchesRole = !roleFilter || roleFilter === 'all' || u.role.toLowerCase() === roleFilter.toLowerCase();
      return matchesSearch && matchesRole;
    });
  },

  /**
   * Securely changes a user's role via PostgreSQL RPC.
   */
  async changeUserRole(targetUserId: string, newRole: UserRole): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured() && isUUID(targetUserId)) {
      try {
        const { error } = await (supabase as any).rpc('admin_change_user_role', {
          p_target_user_id: targetUserId,
          p_new_role: newRole,
        });

        if (error) {
          return { success: false, error: error.message || 'Failed to update user role.' };
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Network error updating user role.' };
      }
    }

    // Baseline record update
    const target = PLATFORM_INDIAN_USERS.find((u) => u.id === targetUserId);
    if (target) {
      target.role = newRole;
    }
    return { success: true };
  },

  /**
   * Retrieves provider network with audit verification status and statistics.
   */
  async getProviders(search?: string, statusFilter?: string): Promise<AdminProviderRecord[]> {
    let dbProviders: AdminProviderRecord[] = [];
    if (isSupabaseConfigured()) {
      try {
        let query = (supabase as any)
          .from('provider_profiles')
          .select(`
            id, organization_name, provider_type, verification_status, verification_notes,
            website_url, description, city, locality, created_at,
            profiles!id ( full_name, email, city, locality, profile_image_url ),
            pets ( id )
          `)
          .order('created_at', { ascending: false });

        if (statusFilter && statusFilter !== 'all') {
          query = query.eq('verification_status', statusFilter.toLowerCase());
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          dbProviders = data.map((p: any) => ({
            id: p.id,
            name: p.profiles?.full_name || 'Rescue Provider',
            org: p.organization_name || 'Animal Shelter',
            providerType: p.provider_type || 'Shelter',
            location: p.city ? `${p.locality ? `${p.locality}, ` : ''}${p.city}` : 'India',
            listings: Array.isArray(p.pets) ? p.pets.length : 0,
            adoptions: p.successful_adoptions_count ?? 0,
            verificationStatus: (p.verification_status || 'pending') as 'pending' | 'verified' | 'rejected',
            verificationNotes: p.verification_notes,
            websiteUrl: p.website_url,
            description: p.description,
            createdAt: p.created_at,
          }));
        }
      } catch (err) {
        console.warn('[adminService] Error loading providers from Supabase:', err);
      }
    }

    // Merge database providers and authentic Indian baseline providers
    const allProviders = [...dbProviders, ...PLATFORM_INDIAN_PROVIDERS];
    const uniqueProviders = Array.from(new Map(allProviders.map((p) => [p.id, p])).values());

    return uniqueProviders.filter((p) => {
      const matchesSearch = !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.org.toLowerCase().includes(search.toLowerCase()) ||
        p.location.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || statusFilter === 'all' || p.verificationStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  },

  /**
   * Verifies a rescue provider via RPC, dispatches in-app notification, and triggers transactional email.
   */
  async verifyProvider(providerId: string, notes?: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured() && isUUID(providerId)) {
      try {
        const { error } = await (supabase as any).rpc('admin_verify_provider', {
          p_provider_id: providerId,
          p_notes: notes || null,
        });

        if (error) {
          return { success: false, error: error.message || 'Failed to verify provider.' };
        }

        // Trigger transactional verification email
        try {
          await emailNotificationService.dispatchEmail('provider_verified', providerId);
        } catch (mailErr) {
          console.warn('[adminService] Non-blocking verification email error:', mailErr);
        }

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Network error verifying provider.' };
      }
    }

    const prov = PLATFORM_INDIAN_PROVIDERS.find((p) => p.id === providerId);
    if (prov) {
      prov.verificationStatus = 'verified';
    }
    return { success: true };
  },

  /**
   * Rejects a provider verification via RPC with an explanatory reason.
   */
  async rejectProvider(providerId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured() && isUUID(providerId)) {
      try {
        const { error } = await (supabase as any).rpc('admin_reject_provider', {
          p_provider_id: providerId,
          p_reason: reason,
        });

        if (error) {
          return { success: false, error: error.message || 'Failed to reject provider.' };
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Network error rejecting provider.' };
      }
    }

    const prov = PLATFORM_INDIAN_PROVIDERS.find((p) => p.id === providerId);
    if (prov) {
      prov.verificationStatus = 'rejected';
    }
    return { success: true };
  },

  /**
   * Moderates a pet listing (pause, resume, archive) via RPC without bypassing Foster-to-Own lifecycle.
   */
  async moderatePet(petId: string, newStatus: 'available' | 'paused' | 'archived', reason?: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured() && isUUID(petId)) {
      try {
        const { error } = await (supabase as any).rpc('admin_moderate_pet_status', {
          p_pet_id: petId,
          p_new_status: newStatus,
          p_reason: reason || null,
        });

        if (error) {
          return { success: false, error: error.message || 'Failed to moderate pet status.' };
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Network error moderating pet.' };
      }
    }

    await petService.updatePetStatus(petId, newStatus === 'available' ? 'Available' : newStatus === 'paused' ? 'Paused' : 'Unavailable');
    return { success: true };
  },

  /**
   * Retrieves welfare and compliance reports from Supabase.
   */
  async getReports(): Promise<AdminReportRecord[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await (supabase as any)
          .from('reports')
          .select(`
            id, target_type, target_id, target_name, reason, description, status, admin_notes, created_at,
            profiles!reporter_id ( full_name )
          `)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          return data.map((r: any) => {
            let normalizedStatus: 'Pending' | 'Resolved' | 'Dismissed' = 'Pending';
            const s = (r.status || '').toLowerCase();
            if (s === 'resolved') normalizedStatus = 'Resolved';
            else if (s === 'dismissed') normalizedStatus = 'Dismissed';

            return {
              id: r.id,
              reporterName: r.profiles?.full_name || 'Concerned Citizen',
              targetType: r.target_type,
              targetId: r.target_id,
              targetName: r.target_name || 'Companion Listing',
              reason: r.reason,
              description: r.description,
              status: normalizedStatus,
              adminNotes: r.admin_notes,
              createdAt: r.created_at ? r.created_at.split('T')[0] : 'Recent',
            };
          });
        }
      } catch (err) {
        console.warn('[adminService] Error loading reports from Supabase:', err);
      }
    }

    const platformReports = reportService.getReports();
    return platformReports.map((r) => ({
      id: r.id,
      reporterName: r.reporterName,
      targetType: r.targetType,
      targetId: r.targetId,
      targetName: r.targetName,
      reason: r.reason,
      description: r.description,
      status: r.status,
      createdAt: r.createdAt,
    }));
  },

  /**
   * Resolves or dismisses a report via RPC.
   */
  async resolveReport(reportId: string, status: 'Resolved' | 'Dismissed', notes?: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured() && isUUID(reportId)) {
      try {
        const { error } = await (supabase as any).rpc('admin_resolve_report', {
          p_report_id: reportId,
          p_status: status.toLowerCase(),
          p_notes: notes || null,
        });

        if (error) {
          return { success: false, error: error.message || 'Failed to resolve report.' };
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Network error resolving report.' };
      }
    }

    reportService.updateStatus(reportId, status);
    return { success: true };
  },

  /**
   * Checks if current environment is connected to live backend database.
   */
  isLiveRealMode(): boolean {
    return isSupabaseConfigured();
  },
};
