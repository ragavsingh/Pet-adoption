import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../../components/common/Logo';
import { Button } from '../../components/common/Button';
import { useToast } from '../../contexts/ToastContext';
import { authService } from '../../services/authService';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      if (!isSupabaseConfigured()) {
        setHasSession(true);
        setCheckingSession(false);
        return;
      }

      // Check URL hash for access token from recovery link
      const hash = window.location.hash;
      const isRecoveryHash = hash.includes('type=recovery') || hash.includes('access_token=');

      const { data } = await supabase.auth.getSession();
      if (isMounted) {
        if (data.session || isRecoveryHash) {
          setHasSession(true);
        }
        setCheckingSession(false);
      }
    }

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasSession(true);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      const res = await authService.updateUserPassword(password);
      setLoading(false);

      if (res.success) {
        setIsSuccess(true);
        showToast('Password updated successfully! You can now log in with your email and password.', 'success');
      } else {
        const err = res.error || 'Failed to update password. Please try requesting a new reset link.';
        setErrorMessage(err);
        showToast(err, 'error');
      }
    } catch (err: any) {
      setLoading(false);
      const msg = err?.message || 'An error occurred while updating your password.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-surface rounded-3xl p-8 sm:p-10 border border-brand-200/80 shadow-soft-lg space-y-6 text-left animate-fade-in">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <Logo size="md" />
          </div>

          <h2 className="font-display text-2xl font-extrabold text-brand-950">
            {isSuccess ? 'Password Updated!' : 'Set New Password'}
          </h2>
          <p className="text-xs text-brand-muted">
            {isSuccess
              ? 'Your password has been securely updated in Supabase.'
              : 'Enter a strong password of at least 8 characters for your account.'}
          </p>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="text-center space-y-4 py-3 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <p className="text-xs text-brand-800 leading-relaxed">
              You can now log in anytime using your email address and your new password.
            </p>
            <div className="pt-2">
              <Link to="/login" className="block w-full">
                <Button variant="primary" size="lg" className="w-full shadow-soft">
                  Go to Login
                </Button>
              </Link>
            </div>
          </div>
        ) : checkingSession ? (
          <div className="text-center py-8 text-xs text-brand-muted">
            Checking verification link...
          </div>
        ) : hasSession ? (
          <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="reset-new-password"
                  className="block text-xs font-bold text-brand-800 uppercase tracking-wider"
                >
                  New Password
                </label>
                <span className="text-[10px] text-brand-muted">(Min 8 chars)</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
                <input
                  id="reset-new-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  minLength={8}
                  autoFocus
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-brand-200 text-sm font-medium text-brand-950 focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="reset-confirm-password"
                className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
                <input
                  id="reset-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  minLength={8}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-brand-200 text-sm font-medium text-brand-950 focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full shadow-soft"
            >
              Save New Password & Continue
            </Button>
          </form>
        ) : (
          <div className="text-center space-y-4 py-3 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>
            <p className="text-xs text-brand-800 leading-relaxed">
              To set or reset your password, please request a 6-digit email verification code.
            </p>
            <div className="pt-2 space-y-2">
              <Link to="/forgot-password" className="block w-full">
                <Button variant="primary" size="lg" className="w-full shadow-soft">
                  Request Verification Code
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="text-center pt-2 border-t border-brand-100">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-950 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
