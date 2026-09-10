import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, AdopterProfile, ProviderProfile } from '../types/user';
import { DEMO_ADOPTER, DEMO_PROVIDER } from '../data/mockData';
import { authService, SignUpParams } from '../services/authService';
import { profileService } from '../services/profileService';
import { isSupabaseConfigured } from '../lib/supabase';
import { recordRegisteredUser } from '../services/adminService';
import { AUTH_MODE_STORAGE_KEY, AUTH_USER_STORAGE_KEY } from '../utils/authMode';
import { resolveUserAvatar, isDummyPlaceholderPhoto } from '../utils/avatarUtils';

export type AuthMode = 'demo' | 'supabase';

interface AuthContextValue {
  user: User | null;
  role: UserRole | 'guest';
  isAuthenticated: boolean;
  isLoading: boolean;
  authMode: AuthMode;

  // Real Supabase Authentication Methods
  realLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  realLoginWithGoogle: (redirectTo?: string) => Promise<{ error?: string }>;
  realLoginWithOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  realVerifyOtp: (email: string, token: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  realResendOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  realSignup: (params: SignUpParams) => Promise<{ success: boolean; requiresEmailConfirmation?: boolean; error?: string }>;
  realLogout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;

  // Demo Authentication & Switcher Methods (Preserved 100% Intact)
  login: (email: string, targetRole?: UserRole) => void;
  signup: (name: string, email: string, targetRole: UserRole) => void;
  logout: () => void;
  switchRole: (role: UserRole | 'guest') => void;
  updateAdopterProfile: (updates: Partial<AdopterProfile>) => Promise<void> | void;
  updateProviderProfile: (updates: Partial<ProviderProfile>) => Promise<void> | void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_STORAGE_KEY = AUTH_USER_STORAGE_KEY;
const AUTH_MODE_KEY = AUTH_MODE_STORAGE_KEY;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authMode, setAuthMode] = useState<AuthMode>(() => {
    return (localStorage.getItem(AUTH_MODE_KEY) as AuthMode) || 'demo';
  });

  const [isLoading, setIsLoading] = useState(true);

  // Initialize user state from storage, defaulting to null (unauthenticated) for fresh visitors.
  // NEVER default to Raghav or any demo persona on unauthenticated loads or failed logins!
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) {
          // If the cached user still holds a random Unsplash placeholder photo, clean it immediately
          if (isDummyPlaceholderPhoto(parsed.avatar)) {
            parsed.avatar = resolveUserAvatar(parsed);
            if (parsed.adopterProfile) {
              parsed.adopterProfile.avatar = parsed.avatar;
            }
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Auth load error', e);
    }
    return null;
  });

  // Sync user state to localStorage for persistence
  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      recordRegisteredUser({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatar,
      });
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  // Sync auth mode to localStorage
  useEffect(() => {
    localStorage.setItem(AUTH_MODE_KEY, authMode);
  }, [authMode]);

  // Cross-tab authentication synchronization (instant multi-tab logout and session update)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === AUTH_STORAGE_KEY) {
        if (!e.newValue) {
          // User logged out in another tab
          setUser(null);
          setAuthMode('demo');
        } else {
          // User profile updated in another tab
          try {
            const parsed = JSON.parse(e.newValue);
            if (parsed && parsed.email) {
              setUser(parsed);
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Real Supabase session restoration and event subscription
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      if (!isSupabaseConfigured()) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const { data } = await authService.getSession();
        if (data.session?.user && isMounted) {
          const profile = await profileService.loadUserProfile(data.session.user.id, data.session.user);
          if (profile && isMounted) {
            setUser(profile);
            setAuthMode('supabase');
          }
        } else if (authMode === 'supabase' && isMounted) {
          // Stored auth mode indicated real Supabase, but no active session was returned
          setUser(null);
          setAuthMode('demo');
        }
      } catch (err) {
        console.warn('Error restoring Supabase session:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initSession();

    // Listen to real auth events
    const { data: authListener } = authService.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await profileService.loadUserProfile(session.user.id, session.user);
        if (profile && isMounted) {
          setUser(profile);
          setAuthMode('supabase');
        }
      } else if (event === 'SIGNED_OUT') {
        if (authMode === 'supabase' && isMounted) {
          setUser(null);
          setAuthMode('demo');
        }
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [authMode]);

  // ==========================================
  // REAL SUPABASE AUTHENTICATION METHODS
  // ==========================================

  const realLogin = async (email: string, password: string): Promise<{ success: boolean; error?: string; role?: UserRole }> => {
    setIsLoading(true);
    const result = await authService.signIn(email, password);

    if (!result.success || !result.user) {
      setIsLoading(false);
      // HARD SECURITY RULE: Never fall back to Raghav or any demo persona on failed authentication!
      setUser(null);
      return { success: false, error: result.error };
    }

    // Fetch authorized role from PostgreSQL database
    const profile = await profileService.loadUserProfile(result.user.id, result.user);
    if (!profile) {
      setIsLoading(false);
      setUser(null);
      return { success: false, error: 'Failed to load user profile from database.' };
    }

    setUser(profile);
    setAuthMode('supabase');
    setIsLoading(false);

    return {
      success: true,
      role: profile.role,
    };
  };

  const realLoginWithGoogle = async (redirectTo?: string): Promise<{ error?: string }> => {
    setIsLoading(true);
    const result = await authService.signInWithGoogle(redirectTo);
    if (result.error) {
      setIsLoading(false);
      return { error: result.error };
    }
    // Redirection is handled by the browser to Supabase Google OAuth provider
    return {};
  };

  const realLoginWithOtp = async (email: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const result = await authService.signInWithOtp(email);
    setIsLoading(false);
    return result;
  };

  const realVerifyOtp = async (email: string, token: string): Promise<{ success: boolean; error?: string; role?: UserRole }> => {
    setIsLoading(true);
    const result = await authService.verifyOtp(email, token);

    if (!result.success || !result.user) {
      setIsLoading(false);
      // HARD SECURITY RULE: Never fall back to Raghav on failed OTP verification!
      setUser(null);
      return { success: false, error: result.error };
    }

    // Fetch authoritative role from PostgreSQL database
    const profile = await profileService.loadUserProfile(result.user.id, result.user);
    if (!profile) {
      setIsLoading(false);
      setUser(null);
      return { success: false, error: 'Failed to load user profile from database.' };
    }

    setUser(profile);
    setAuthMode('supabase');
    setIsLoading(false);

    return {
      success: true,
      role: profile.role,
    };
  };

  const realResendOtp = async (email: string): Promise<{ success: boolean; error?: string }> => {
    return authService.resendOtp(email);
  };

  const realSignup = async (params: SignUpParams): Promise<{ success: boolean; requiresEmailConfirmation?: boolean; error?: string }> => {
    setIsLoading(true);
    const result = await authService.signUp(params);

    if (!result.success) {
      setIsLoading(false);
      return { success: false, error: result.error };
    }

    // Immediately record newly created user so admin console sees it in real time
    recordRegisteredUser({
      id: result.user?.id,
      name: params.fullName,
      email: params.email,
      role: params.role,
      location: params.city,
    });

    if (result.requiresEmailConfirmation) {
      setIsLoading(false);
      return {
        success: true,
        requiresEmailConfirmation: true,
      };
    }

    if (result.user) {
      const profile = await profileService.loadUserProfile(result.user.id, result.user);
      if (profile) {
        setUser(profile);
        setAuthMode('supabase');
      }
    }

    setIsLoading(false);
    return { success: true, requiresEmailConfirmation: false };
  };

  const realLogout = async () => {
    setIsLoading(true);
    try {
      sessionStorage.removeItem('pet_admin_session_auth_v2');
      sessionStorage.removeItem('pet_admin_session_passkey');
      sessionStorage.removeItem('pet_admin_explicit_locked');
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(AUTH_MODE_KEY);
    } catch {
      // Ignore in non-browser environments
    }
    await authService.signOut();
    setUser(null);
    setAuthMode('demo');
    setIsLoading(false);
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    return authService.resetPasswordForEmail(email);
  };

  const resetPassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    return authService.updateUserPassword(newPassword);
  };

  // ==========================================
  // DEMO ROLE SWITCHER & MOCK METHODS (PRESERVED)
  // ==========================================

  const switchRole = (newRole: UserRole | 'guest') => {
    // Explicitly revoke Supabase session to prevent auth token or session leakage into demo mode
    if (authMode === 'supabase') {
      authService.signOut().catch((err) => console.warn('Silent signout on demo role switch:', err));
    }

    setAuthMode('demo');

    if (newRole === 'guest') {
      setUser(null);
      return;
    }

    if (newRole === 'adopter') {
      setUser({
        id: 'usr_raghav',
        name: 'Raghav Singh',
        email: 'raghav.singh@example.com',
        role: 'adopter',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
        adopterProfile: DEMO_ADOPTER,
      });
    } else if (newRole === 'provider') {
      setUser({
        id: 'prv_sarah',
        name: "Sarah D'Souza",
        email: 'sarah.dsouza@example.com',
        role: 'provider',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
        providerProfile: DEMO_PROVIDER,
      });
    } else if (newRole === 'admin') {
      setUser({
        id: 'usr_admin',
        name: 'Adoption Admin',
        email: 'admin@petadoption.org',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
      });
    }
  };

  const login = (email: string, targetRole: UserRole = 'adopter') => {
    switchRole(targetRole);
  };

  const signup = (name: string, email: string, targetRole: UserRole) => {
    setAuthMode('demo');
    const defaultAvatar = resolveUserAvatar({ name, email });
    if (targetRole === 'adopter') {
      setUser({
        id: `usr_${Date.now()}`,
        name,
        email,
        role: 'adopter',
        avatar: defaultAvatar,
        adopterProfile: {
          ...DEMO_ADOPTER,
          name,
          email,
          avatar: defaultAvatar,
          profileCompletion: 40,
        },
      });
    } else {
      setUser({
        id: `prv_${Date.now()}`,
        name,
        email,
        role: 'provider',
        avatar: defaultAvatar,
        providerProfile: {
          ...DEMO_PROVIDER,
          name,
          email,
          avatar: defaultAvatar,
        },
      });
    }
  };

  const logout = () => {
    try {
      sessionStorage.removeItem('pet_admin_session_auth_v2');
      sessionStorage.removeItem('pet_admin_explicit_locked');
    } catch {
      // Ignore in non-browser environments
    }
    if (authMode === 'supabase') {
      realLogout();
    } else {
      setUser(null);
    }
  };

  const updateAdopterProfile = async (updates: Partial<AdopterProfile>) => {
    if (!user || !user.adopterProfile) return;
    const updated = { ...user.adopterProfile, ...updates };
    setUser({
      ...user,
      name: updated.name,
      avatar: updated.avatar || user.avatar,
      adopterProfile: updated,
    });

    if (authMode === 'supabase') {
      const res = await profileService.updateAdopterProfile(user.id, updates);
      if (!res.success) {
        throw new Error(res.error || 'Failed to update adopter profile in database.');
      }
    }
  };

  const updateProviderProfile = async (updates: Partial<ProviderProfile>) => {
    if (!user) return;
    const baseProvider: ProviderProfile = user.providerProfile || {
      id: user.id,
      name: user.name,
      organizationName: undefined,
      email: user.email,
      phone: '',
      location: '',
      avatar: user.avatar,
      verified: false,
      about: '',
      activeListingsCount: 0,
      successfulAdoptionsCount: 0,
    };
    const updated = { ...baseProvider, ...updates };
    setUser({
      ...user,
      name: updated.name || user.name,
      avatar: updated.avatar || user.avatar,
      providerProfile: updated,
    });

    if (authMode === 'supabase') {
      const res = await profileService.updateProviderProfile(user.id, updates);
      if (!res.success) {
        throw new Error(res.error || 'Failed to update provider profile in database.');
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : 'guest',
        isAuthenticated: !!user,
        isLoading,
        authMode,
        realLogin,
        realLoginWithGoogle,
        realLoginWithOtp,
        realVerifyOtp,
        realResendOtp,
        realSignup,
        realLogout,
        forgotPassword,
        resetPassword,
        login,
        signup,
        logout,
        switchRole,
        updateAdopterProfile,
        updateProviderProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
