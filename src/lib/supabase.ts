import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = (import.meta.env?.VITE_SUPABASE_URL || '').trim();
// Support both modern Supabase Publishable Key and standard Anon Key
const supabaseAnonKey = (
  import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  ''
).trim();

/**
 * Checks whether Supabase environment variables have been provided
 * and are not placeholder or unconfigured template values.
 */
export const isSupabaseConfigured = (): boolean => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return false;
  }

  const cleanUrl = supabaseUrl.toLowerCase();
  const cleanKey = supabaseAnonKey.toLowerCase();

  // Guard against literal undefined / null strings from faulty environment substitutions
  if (cleanUrl === 'undefined' || cleanKey === 'undefined' || cleanUrl === 'null' || cleanKey === 'null') {
    return false;
  }

  // Guard against template placeholders in the Project URL
  const urlPlaceholders = [
    'placeholder',
    'your-project',
    'your_project',
    'your-supabase-url',
    'your_supabase_url',
    'your-project-url',
    'example.com',
  ];
  if (urlPlaceholders.some((p) => cleanUrl.includes(p))) {
    return false;
  }

  // Guard against template placeholders in the Key
  const keyPlaceholders = [
    'placeholder',
    'your-key',
    'your_key',
    'your-anon-key',
    'your_anon_key',
    'your-publishable-key',
    'your_publishable_key',
  ];
  if (keyPlaceholders.some((p) => cleanKey.includes(p))) {
    return false;
  }

  return true;
};

// Safe fallback credentials so that createClient does not crash at evaluation time
// when running in pure demo mode without environment variables configured.
const effectiveUrl = isSupabaseConfigured() ? supabaseUrl : 'https://placeholder.supabase.co';
const effectiveKey = isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-anon-key';

/**
 * Shared Supabase client instance for the application.
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(effectiveUrl, effectiveKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface SupabaseHealthCheck {
  configured: boolean;
  reachable: boolean;
  error?: string;
  url?: string;
}

/**
 * Development-safe diagnostic utility to verify if the configured
 * Supabase project is reachable, without breaking the application.
 */
export async function checkSupabaseConnection(): Promise<SupabaseHealthCheck> {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      reachable: false,
      error: 'Supabase environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY / VITE_SUPABASE_ANON_KEY) are not set in .env.local. Application is running in demo mode.',
    };
  }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
      method: 'GET',
      headers: {
        apikey: supabaseAnonKey,
      },
    });

    if (response.ok) {
      return {
        configured: true,
        reachable: true,
        url: supabaseUrl,
      };
    } else {
      return {
        configured: true,
        reachable: false,
        error: `Supabase returned HTTP ${response.status}: ${response.statusText}`,
        url: supabaseUrl,
      };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network request failed';
    return {
      configured: true,
      reachable: false,
      error: message,
      url: supabaseUrl,
    };
  }
}
