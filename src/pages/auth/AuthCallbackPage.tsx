import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { profileService } from '../../services/profileService';
import { useToast } from '../../contexts/ToastContext';
import { Logo } from '../../components/common/Logo';
import { recordRegisteredUser } from '../../services/adminService';

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function handleAuthCallback() {
      // 1. Check for URL error parameters from OAuth provider
      const errorParam = searchParams.get('error');
      const errorDesc = searchParams.get('error_description');

      if (errorParam || errorDesc) {
        if (isMounted) {
          const msg = errorDesc || errorParam || 'Google authentication failed.';
          setErrorStatus(msg);
          showToast(msg, 'error');
          setTimeout(() => navigate('/login', { replace: true }), 2500);
        }
        return;
      }

      if (!isSupabaseConfigured()) {
        if (isMounted) {
          setErrorStatus('Supabase is not configured.');
          setTimeout(() => navigate('/login', { replace: true }), 1500);
        }
        return;
      }

      try {
        // 2. Fetch session established by Supabase OAuth redirect
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session?.user) {
          // Wait briefly in case onAuthStateChange is processing PKCE code exchange
          const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user && isMounted) {
              await processSessionAndRedirect(session.user);
            }
          });

          // Timeout after 5 seconds if no session arrives
          setTimeout(() => {
            if (isMounted && !errorStatus) {
              authListener?.subscription?.unsubscribe();
              setErrorStatus('Could not complete Google authentication. Please try logging in again.');
              showToast('Google login session not detected. Please try again.', 'error');
              navigate('/login', { replace: true });
            }
          }, 5000);
          return;
        }

        if (isMounted) {
          await processSessionAndRedirect(data.session.user);
        }
      } catch (err: any) {
        if (isMounted) {
          const msg = err?.message || 'Authentication error. Please try again.';
          setErrorStatus(msg);
          showToast(msg, 'error');
          setTimeout(() => navigate('/login', { replace: true }), 2000);
        }
      }
    }

    async function processSessionAndRedirect(authUser: any) {
      try {
        // Load or create user profile from database
        const profile = await profileService.loadUserProfile(authUser.id, authUser);
        const role = profile?.role || 'adopter';
        const bestName = profile?.name || 'Adopter';
        const firstName = bestName.split(' ')[0] || 'there';

        // Record user for real-time admin overview
        recordRegisteredUser({
          id: authUser.id,
          name: bestName,
          email: authUser.email || '',
          role,
          avatarUrl: profile?.avatar || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
        });

        showToast(`Welcome, ${firstName}! Logged in with Google as ${role.toUpperCase()}`, 'success');

        // Redirect based on role
        if (role === 'provider') {
          navigate('/provider/dashboard', { replace: true });
        } else if (role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          // Default role for Google users is adopter
          navigate('/adopter/dashboard', { replace: true });
        }
      } catch (e: any) {
        console.error('Error in profile resolution:', e);
        navigate('/adopter/dashboard', { replace: true });
      }
    }

    handleAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [navigate, searchParams, showToast]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-soft text-brand-900 px-4">
      <div className="w-full max-w-sm bg-surface rounded-3xl p-8 border border-brand-200/80 shadow-soft-lg flex flex-col items-center text-center space-y-5 animate-fade-in">
        <Logo size="lg" />

        {errorStatus ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-rose-600">{errorStatus}</p>
            <p className="text-xs text-brand-muted">Redirecting you back to login...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-10 h-10 border-3 border-brand-700 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="space-y-1">
              <h3 className="font-display text-lg font-bold text-brand-950">
                Completing sign-in
              </h3>
              <p className="text-xs text-brand-muted">
                Securely verifying your Google credentials...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
