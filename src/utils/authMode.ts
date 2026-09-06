import { isSupabaseConfigured } from '../lib/supabase';

export const AUTH_MODE_STORAGE_KEY = 'pet_adoption_auth_mode_v2';
export const AUTH_USER_STORAGE_KEY = 'pet_adoption_auth_user_v2';

/**
 * Checks whether a given string is a valid standard RFC4122 UUID.
 * Real Supabase Auth users always have standard UUIDs (e.g. 550e8400-e29b-41d4-a716-446655440000),
 * while mock demo personas use prefixed identifiers (e.g. 'usr_raghav', 'prv_sarah', 'usr_admin').
 */
export function isUUID(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Returns true if the application is operating in real Supabase production mode.
 * Real mode strictly requires:
 * 1. Supabase client is properly configured with project URL and public anon key.
 * 2. The explicit active auth mode in storage is 'supabase'.
 */
export function isRealAuthMode(): boolean {
  if (!isSupabaseConfigured()) return false;
  try {
    const mode = localStorage.getItem(AUTH_MODE_STORAGE_KEY);
    return mode === 'supabase';
  } catch {
    return false;
  }
}

/**
 * Alias for backward compatibility across service files.
 */
export const isRealMode = isRealAuthMode;

/**
 * Returns true if the application is operating in local demonstration mode.
 */
export function isDemoMode(): boolean {
  return !isRealAuthMode();
}
