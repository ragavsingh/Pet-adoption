import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserRole } from '../types/user';

export interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  role: 'adopter' | 'provider'; // Strictly restricted: no admin signup allowed
  city?: string;
  locality?: string;
  phone?: string;
  organizationName?: string;
}

export interface AuthResponse {
  success: boolean;
  requiresEmailConfirmation?: boolean;
  user?: any;
  error?: string;
}

/**
 * Translates Supabase error codes and messages into clean, user-friendly strings.
 * Prevents raw database or token leaks to the frontend UI.
 */
export function getFriendlyAuthErrorMessage(err: unknown): string {
  if (!err) return 'An unexpected error occurred. Please try again.';

  const message = (err as any)?.message || String(err);

  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (message.includes('User already registered') || message.includes('already exists')) {
    return 'An account with this email address already exists. Please log in instead.';
  }
  if (message.includes('Password should be at least')) {
    return 'Password must be at least 8 characters long.';
  }
  if (message.includes('Email not confirmed')) {
    return 'Please confirm your email address before logging in. Check your inbox for the confirmation link.';
  }
  if (
    message.includes('Token has expired or is invalid') ||
    (message.includes('invalid') && message.includes('token')) ||
    (message.includes('token') && message.includes('malformed'))
  ) {
    return 'Invalid or expired verification code.';
  }
  if (
    message.includes('Token has expired') ||
    message.includes('token is expired') ||
    message.includes('otp_expired') ||
    message.includes('expired')
  ) {
    return 'Your verification code has expired.';
  }
  if (
    message.includes('Signups not allowed for otp') ||
    message.includes('User not found') ||
    message.includes('signups not allowed')
  ) {
    return 'If an account exists with this email address, a verification code has been sent.';
  }
  if (
    message.includes('over_email_send_rate_limit') ||
    message.includes('email rate limit exceeded') ||
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('security purposes')
  ) {
    const secondsMatch = message.match(/after (\d+) seconds/i);
    if (secondsMatch) {
      return `For security purposes, please wait ${secondsMatch[1]} seconds before requesting another code.`;
    }
    return 'Supabase hourly email limit reached (default free tier allows 3 emails/hour). Please wait a few minutes, use Email + Password login, or enable Custom SMTP in your Supabase dashboard.';
  }
  if (message.includes('Auth session missing')) {
    return 'Your session has expired or is invalid. Please request a new link or code.';
  }
  if (message.includes('Network') || message.includes('Failed to fetch')) {
    return 'Unable to reach the server. Please check your internet connection.';
  }

  // Prevent leakage of internal database structures, table names, SQLSTATE codes, or triggers
  if (
    message.includes('SQLSTATE') ||
    message.includes('relation') ||
    message.includes('syntax error') ||
    message.includes('violates') ||
    message.includes('permission denied') ||
    message.includes('duplicate key')
  ) {
    return 'A database operation error occurred. Please try again or contact support.';
  }

  return message;
}

/**
 * Service handling all direct communication with Supabase Auth.
 */
export const authService = {
  /**
   * Register a new user with Supabase Auth.
   * Public signup is strictly constrained to 'adopter' or 'provider'.
   */
  async signUp(params: SignUpParams): Promise<AuthResponse> {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: 'Real authentication requires Supabase. Please add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local to register real accounts.',
      };
    }

    // Strict client-side validation guard: Never permit 'admin'
    if (params.role !== 'adopter' && params.role !== 'provider') {
      return {
        success: false,
        error: 'Unauthorized registration role. Only adopter and provider accounts are allowed.',
      };
    }

    if (!params.password || params.password.length < 8) {
      return {
        success: false,
        error: 'Password must be at least 8 characters long.',
      };
    }

    const cleanEmail = params.email.trim().toLowerCase();

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: params.password,
        options: {
          data: {
            full_name: params.fullName.trim(),
            role: params.role,
            city: params.city?.trim() || null,
            locality: params.locality?.trim() || null,
            phone: params.phone?.trim() || null,
            organization_name: params.organizationName?.trim() || null,
          },
        },
      });

      if (error) {
        return { success: false, error: getFriendlyAuthErrorMessage(error) };
      }

      // Security & Collision: Supabase returns identities: [] when user already exists (anti-enumeration mode)
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return {
          success: false,
          error: 'An account with this email address already exists. Please log in instead.',
        };
      }

      // If user was created but session was not returned, attempt immediate password login
      // so the user gets instant access without email verification blocking
      if (data.user && !data.session) {
        try {
          const loginRes = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: params.password,
          });
          if (loginRes.data?.session) {
            return {
              success: true,
              requiresEmailConfirmation: false,
              user: loginRes.data.user || data.user,
            };
          }
        } catch {
          // If auto-login fails (e.g. strict email confirmation enforced in project), report requirement
        }
      }

      // Check if email confirmation is still required
      const requiresConfirmation = Boolean(data.user && !data.session);

      return {
        success: true,
        requiresEmailConfirmation: requiresConfirmation,
        user: data.user,
      };
    } catch (err) {
      return { success: false, error: getFriendlyAuthErrorMessage(err) };
    }
  },

  /**
   * Log in an existing user with email and password via Supabase Auth.
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return {
        success: false,
        error: 'Please enter a valid email address.',
      };
    }

    if (!password || password.length < 8) {
      return {
        success: false,
        error: 'Password must be at least 8 characters long.',
      };
    }

    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: 'Real authentication requires Supabase. Please set your credentials in .env.local to use real login.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        return { success: false, error: getFriendlyAuthErrorMessage(error) };
      }

      return {
        success: true,
        user: data.user,
      };
    } catch (err) {
      return { success: false, error: getFriendlyAuthErrorMessage(err) };
    }
  },

  /**
   * Initiate Google OAuth sign-in via Supabase.
   * Directs user to Google OAuth consent screen, then back to /auth/callback.
   */
  async signInWithGoogle(redirectTo?: string): Promise<{ data?: any; error?: string }> {
    if (!isSupabaseConfigured()) {
      return {
        error: 'Real authentication requires Supabase. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      };
    }

    try {
      const callbackUrl = redirectTo || `${window.location.origin}/auth/callback`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        return { error: getFriendlyAuthErrorMessage(error) };
      }

      return { data };
    } catch (err) {
      return { error: getFriendlyAuthErrorMessage(err) };
    }
  },

  /**
   * Send a one-time verification code (OTP) to the user's email via Supabase Auth.
   * Uses shouldCreateUser: false so this login/forgot-password flow does NOT
   * unintentionally create arbitrary new user accounts.
   */
  async signInWithOtp(email: string): Promise<AuthResponse> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return {
        success: false,
        error: 'Please enter a valid email address.',
      };
    }

    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: 'Real authentication requires Supabase. Please set your credentials in .env.local to send real email verification codes.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) {
        const errMsg = error.message || '';
        // Anti-enumeration: If user not found / signups not allowed for OTP,
        // treat as success to avoid revealing account existence to third parties.
        if (
          errMsg.includes('Signups not allowed for otp') ||
          errMsg.includes('User not found') ||
          errMsg.includes('signups not allowed')
        ) {
          return {
            success: true,
            user: null,
          };
        }
        return { success: false, error: getFriendlyAuthErrorMessage(error) };
      }

      return {
        success: true,
        user: data?.user || null,
      };
    } catch (err) {
      return { success: false, error: getFriendlyAuthErrorMessage(err) };
    }
  },

  /**
   * Verify an email OTP verification code with Supabase Auth.
   * On success, Supabase creates and persists an authenticated session.
   */
  async verifyOtp(email: string, token: string): Promise<AuthResponse> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = token.trim();

    if (!cleanToken) {
      return {
        success: false,
        error: 'Please enter the 6-digit verification code.',
      };
    }

    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: 'Real authentication requires Supabase. Please set your credentials in .env.local to verify codes.',
      };
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'email',
      });

      if (error) {
        return { success: false, error: getFriendlyAuthErrorMessage(error) };
      }

      if (!data.session || !data.user) {
        return { success: false, error: 'Authentication verification failed. Please try again.' };
      }

      return {
        success: true,
        user: data.user,
      };
    } catch (err) {
      return { success: false, error: getFriendlyAuthErrorMessage(err) };
    }
  },

  /**
   * Resend a verification code to the user's email via Supabase Auth.
   */
  async resendOtp(email: string): Promise<AuthResponse> {
    return this.signInWithOtp(email);
  },

  /**
   * Log out the current user session from Supabase Auth.
   */
  async signOut(): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { success: false, error: getFriendlyAuthErrorMessage(error) };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: getFriendlyAuthErrorMessage(err) };
    }
  },

  /**
   * Send a password recovery link to the user's email via Supabase Auth.
   */
  async resetPasswordForEmail(email: string, redirectTo?: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return {
        success: true, // Demo simulation
      };
    }

    try {
      const redirectUrl = redirectTo || `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        return { success: false, error: getFriendlyAuthErrorMessage(error) };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: getFriendlyAuthErrorMessage(err) };
    }
  },

  /**
   * Update the user's password using an authenticated recovery session.
   */
  async updateUserPassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: true };
    }

    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long.' };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: getFriendlyAuthErrorMessage(error) };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: getFriendlyAuthErrorMessage(err) };
    }
  },

  /**
   * Fetch current authenticated session from Supabase.
   */
  async getSession() {
    if (!isSupabaseConfigured()) {
      return { data: { session: null }, error: null };
    }
    return supabase.auth.getSession();
  },

  /**
   * Subscribe to Supabase Auth state changes.
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (!isSupabaseConfigured()) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    return supabase.auth.onAuthStateChange(callback);
  },
};
