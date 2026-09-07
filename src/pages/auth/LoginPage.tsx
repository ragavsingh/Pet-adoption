import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Logo } from '../../components/common/Logo';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { recordRegisteredUser } from '../../services/adminService';
import {
  Lock,
  Mail,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';

type AuthMethod = 'password' | 'email_code_request' | 'email_code_verify';

const GoogleIcon: React.FC = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [authMethod, setAuthMethod] = useState<AuthMethod>(() => {
    return searchParams.get('mode') === 'code' ? 'email_code_request' : 'password';
  });

  // Form Inputs - Defaults MUST be blank strings for real users
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Loading & Feedback States
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const { user, isAuthenticated, realLogin, realLoginWithGoogle, realLoginWithOtp, realVerifyOtp, realResendOtp } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // If already authenticated, redirect to appropriate dashboard immediately
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'adopter') navigate('/adopter/dashboard', { replace: true });
      else if (user.role === 'provider') navigate('/provider/dashboard', { replace: true });
      else if (user.role === 'admin') navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Rate-limiting UX countdown for OTP resend (30s)
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Security: Guarantee password field is always clean on mount
  useEffect(() => {
    setPassword('');
    setShowPassword(false);
  }, []);

  // Method 1: Email + Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email and password.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await realLogin(email, password);
      setLoading(false);

      if (res.success && res.role) {
        recordRegisteredUser({ email: email.trim().toLowerCase(), role: res.role });
        showToast(`Welcome back! Logged in as ${res.role.toUpperCase()}`, 'success');
        if (res.role === 'adopter') navigate('/adopter/dashboard');
        else if (res.role === 'provider') navigate('/provider/dashboard');
        else if (res.role === 'admin') navigate('/admin/dashboard');
        else navigate('/');
      } else {
        const err = res.error || 'Invalid email or password. Please check your credentials and try again.';
        setErrorMessage(err);
        showToast(err, 'error');
      }
    } catch (err: any) {
      setLoading(false);
      const msg = err?.message || 'Authentication error. Please try again.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    }
  };

  // Google OAuth Login
  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      const res = await realLoginWithGoogle();
      if (res?.error) {
        setLoading(false);
        setErrorMessage(res.error);
        showToast(res.error, 'error');
      }
      // If successful, Supabase redirects browser to Google OAuth consent
    } catch (err: any) {
      setLoading(false);
      const msg = err?.message || 'Failed to initiate Google login.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    }
  };

  // Method 2, Step 1: Send OTP Verification Code
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await realLoginWithOtp(email);
      setLoading(false);

      if (res.success) {
        setAuthMethod('email_code_verify');
        setResendCooldown(30);
        setInfoMessage(`We've sent a 6-digit verification code to ${email.trim().toLowerCase()}.`);
        showToast('Verification code sent! Please check your email.', 'success');
      } else {
        const err = res.error || 'Unable to send verification code. Please check your email address.';
        setErrorMessage(err);
        showToast(err, 'error');
      }
    } catch (err: any) {
      setLoading(false);
      const msg = err?.message || 'An error occurred while sending the code.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    }
  };

  // Method 2, Step 2: Verify OTP Code & Login Directly
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanToken = otpCode.trim();
    if (!cleanToken) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);

    try {
      const res = await realVerifyOtp(email, cleanToken);
      setLoading(false);

      if (res.success && res.role) {
        recordRegisteredUser({ email: email.trim().toLowerCase(), role: res.role });
        showToast(`Welcome back! Logged in as ${res.role.toUpperCase()}`, 'success');
        if (res.role === 'adopter') navigate('/adopter/dashboard');
        else if (res.role === 'provider') navigate('/provider/dashboard');
        else if (res.role === 'admin') navigate('/admin/dashboard');
        else navigate('/');
      } else {
        const err = res.error || 'Invalid or expired verification code.';
        setErrorMessage(err);
        showToast(err, 'error');
      }
    } catch (err: any) {
      setLoading(false);
      const msg = err?.message || 'Invalid or expired verification code.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    }
  };

  // Resend OTP Code
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;

    setResending(true);
    setErrorMessage(null);

    try {
      const res = await realResendOtp(email);
      setResending(false);

      if (res.success) {
        setResendCooldown(30);
        setInfoMessage('New verification code sent. Please check your inbox.');
        showToast('New verification code sent.', 'success');
      } else {
        const err = res.error || 'Unable to resend verification code. Please try again in a moment.';
        setErrorMessage(err);
        showToast(err, 'error');
      }
    } catch (err: any) {
      setResending(false);
      const msg = err?.message || 'Failed to resend verification code.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-surface rounded-3xl p-8 sm:p-10 border border-brand-200/80 shadow-soft-lg space-y-7 text-left animate-fade-in">
        {/* Header Branding & Dynamic Titles */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <Logo size="md" />
          </div>

          {authMethod === 'password' && (
            <>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-950">
                Welcome back
              </h2>
              <p className="text-xs text-brand-muted">
                Sign in to manage your adoption applications and foster journeys.
              </p>
            </>
          )}

          {authMethod === 'email_code_request' && (
            <>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-950">
                Login with Email Code
              </h2>
              <p className="text-xs text-brand-muted">
                Forgot password or prefer code login? Enter your email for a secure 6-digit code.
              </p>
            </>
          )}

          {authMethod === 'email_code_verify' && (
            <>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-950">
                Check your email
              </h2>
              <p className="text-xs text-brand-muted">
                We've sent a 6-digit verification code to{' '}
                <strong className="text-brand-900 font-semibold">{email}</strong>.
              </p>
            </>
          )}
        </div>

        {/* Informational Message Banner */}
        {infoMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span>{errorMessage}</span>
              {errorMessage.includes('Invalid email or password') && (
                <p className="text-[11px] text-rose-700">
                  Don't have an account yet?{' '}
                  <Link to="/signup" className="font-bold underline hover:text-rose-950">
                    Sign up here
                  </Link>{' '}
                  to create one.
                </p>
              )}
            </div>
          </div>
        )}

        {/* METHOD 1: Password Login Form */}
        {authMethod === 'password' && (
          <div className="space-y-5">
            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border border-brand-200 bg-white hover:bg-brand-50/70 text-brand-900 text-sm font-bold shadow-soft transition-all hover:border-brand-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>

            {/* Visual Divider: OR */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-brand-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-surface px-3 font-bold text-brand-400 uppercase tracking-wider text-[10px]">
                  OR
                </span>
              </div>
            </div>

            <form onSubmit={handlePasswordLogin} autoComplete="off" className="space-y-5">
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-brand-200 text-sm font-medium text-brand-950 focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold text-brand-800 uppercase tracking-wider"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-brand-600 hover:text-brand-950 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className={`w-full pl-11 ${password.length > 0 ? 'pr-11' : 'pr-4'} py-3 rounded-2xl border border-brand-200 text-sm font-medium text-brand-950 focus:ring-2 focus:ring-brand-500`}
                />
                {password.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-700 transition-colors p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-brand-700">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-700 focus:ring-brand-500 border-brand-300"
                />
                <span>Remember me for 30 days</span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full shadow-soft"
            >
              Log In
            </Button>

            {/* Visual Divider: OR */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-brand-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-surface px-3 font-bold text-brand-400 uppercase tracking-wider text-[10px]">
                  OR
                </span>
              </div>
            </div>

            {/* Secondary Option: Login with Email Code */}
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => {
                setErrorMessage(null);
                setInfoMessage(null);
                setAuthMethod('email_code_request');
              }}
              className="w-full border-brand-300 hover:border-brand-400"
              leftIcon={<KeyRound className="w-4 h-4 text-brand-600" />}
            >
              Login with Email Code
            </Button>
          </form>
        </div>
      )}

        {/* METHOD 2, Step 1: Send Verification Code */}
        {authMethod === 'email_code_request' && (
          <form onSubmit={handleSendOtp} className="space-y-5 animate-fade-in">
            <div>
              <label
                htmlFor="otp-request-email"
                className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
                <input
                  id="otp-request-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  autoFocus
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-brand-200 text-sm font-medium text-brand-950 focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <p className="text-[11px] text-brand-muted mt-1.5">
                We'll email you a one-time 6-digit verification code. No password required.
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full shadow-soft"
              leftIcon={<KeyRound className="w-4 h-4" />}
            >
              Send Verification Code
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setInfoMessage(null);
                  setAuthMethod('password');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-950 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Password Login</span>
              </button>
            </div>
          </form>
        )}

        {/* METHOD 2, Step 2: Verify Verification Code */}
        {authMethod === 'email_code_verify' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5 animate-fade-in">
            <div>
              <label
                htmlFor="otp-code-input"
                className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5 text-center"
              >
                Verification Code
              </label>
              <div className="relative">
                <input
                  id="otp-code-input"
                  type="text"
                  required
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9A-Za-z]{6}"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\s/g, ''))}
                  placeholder="_ _ _ _ _ _"
                  autoFocus
                  className="w-full text-center tracking-[0.5em] text-2xl font-mono font-bold py-3.5 px-4 rounded-2xl border border-brand-300 text-brand-950 focus:ring-2 focus:ring-brand-500"
                  aria-label="6-digit verification code"
                />
              </div>
              <p className="text-[11px] text-brand-muted mt-2 text-center">
                Enter the 6-digit code received in your inbox.
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full shadow-soft"
            >
              Verify & Login
            </Button>

            {/* Resend Code Section with UX Countdown */}
            <div className="flex items-center justify-between pt-2 px-1 text-xs">
              <span className="text-brand-muted">Didn't receive the code?</span>
              <button
                type="button"
                disabled={resendCooldown > 0 || resending}
                onClick={handleResendOtp}
                className="inline-flex items-center gap-1 font-bold text-brand-700 hover:text-brand-950 disabled:text-brand-400 disabled:cursor-not-allowed transition-colors"
              >
                {resending ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : resendCooldown > 0 ? (
                  <span>Resend in {resendCooldown}s</span>
                ) : (
                  <span>Resend Code</span>
                )}
              </button>
            </div>

            <div className="text-center pt-2 border-t border-brand-100">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setInfoMessage(null);
                  setOtpCode('');
                  setAuthMethod('password');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-950 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Login</span>
              </button>
            </div>
          </form>
        )}

        {/* Create Account & Admin Gateway Footer */}
        <div className="text-center pt-2 border-t border-brand-100 text-xs text-brand-muted flex flex-col gap-2.5 items-center">
          <div>
            Don't have an account yet?{' '}
            <Link to="/signup" className="font-bold text-brand-800 hover:text-brand-950 underline">
              Create Account
            </Link>
          </div>
          <div>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-500 hover:text-brand-800 transition-colors px-2.5 py-1 rounded-md hover:bg-brand-50"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
              <span>Admin Security Gateway & Console →</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
