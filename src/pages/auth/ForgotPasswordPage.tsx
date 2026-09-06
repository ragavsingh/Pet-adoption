import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../../components/common/Logo';
import { Button } from '../../components/common/Button';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, KeyRound, RefreshCw, Lock, Eye, EyeOff } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { showToast } = useToast();
  const { realLoginWithOtp, realVerifyOtp, realResendOtp } = useAuth();
  const navigate = useNavigate();

  // Rate-limiting UX countdown for OTP resend (30s)
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Step 1: Request 6-digit email code
  const handleSendCode = async (e: React.FormEvent) => {
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
        setStep('verify');
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
      const msg = err?.message || 'An unexpected error occurred.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    }
  };

  // Step 2: Verify code and set new password
  const handleVerifyAndResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanToken = otpCode.trim();
    if (!cleanToken) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      return;
    }

    setLoading(true);

    try {
      const res = await realVerifyOtp(email, cleanToken);

      if (!res.success || !res.role) {
        setLoading(false);
        const err = res.error || 'Invalid or expired verification code.';
        setErrorMessage(err);
        showToast(err, 'error');
        return;
      }

      // If user provided a new password, update it in Supabase Auth immediately
      if (newPassword) {
        const passRes = await authService.updateUserPassword(newPassword);
        if (!passRes.success) {
          setLoading(false);
          const passErr = passRes.error || 'Failed to set new password. You are logged in, but please update your password in Profile settings.';
          showToast(passErr, 'error');
        } else {
          showToast('Password updated successfully! You can now log in with your email and password.', 'success');
        }
      } else {
        showToast(`Welcome back! Logged in as ${res.role.toUpperCase()}`, 'success');
      }

      setLoading(false);
      if (res.role === 'adopter') navigate('/adopter/dashboard');
      else if (res.role === 'provider') navigate('/provider/dashboard');
      else if (res.role === 'admin') navigate('/admin/dashboard');
      else navigate('/');
    } catch (err: any) {
      setLoading(false);
      const msg = err?.message || 'Verification failed. Please try again.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    }
  };

  // Resend code handler
  const handleResendCode = async () => {
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
        const err = res.error || 'Unable to resend verification code. Please try again.';
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
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-surface rounded-3xl p-8 sm:p-10 border border-brand-200/80 shadow-soft-lg space-y-6 text-left animate-fade-in">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <Logo size="md" />
          </div>

          {step === 'request' ? (
            <>
              <h2 className="font-display text-2xl font-extrabold text-brand-950">
                Login with Email Code
              </h2>
              <p className="text-xs text-brand-muted">
                Forgot your password? Enter your email to receive a secure 6-digit verification code.
              </p>
            </>
          ) : (
            <>
              <h2 className="font-display text-2xl font-extrabold text-brand-950">
                Check your email
              </h2>
              <p className="text-xs text-brand-muted">
                We've sent a 6-digit verification code to{' '}
                <strong className="text-brand-900 font-semibold">{email}</strong>.
              </p>
            </>
          )}
        </div>

        {/* Informational Banner */}
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
            <span>{errorMessage}</span>
          </div>
        )}

        {step === 'request' ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label
                htmlFor="forgot-email"
                className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
                <input
                  id="forgot-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoFocus
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-brand-200 text-sm font-medium text-brand-950 focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <p className="text-[11px] text-brand-muted mt-1.5">
                No password reset required. The code lets you log in directly.
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
          </form>
        ) : (
          <form onSubmit={handleVerifyAndResetPassword} className="space-y-4 animate-fade-in">
            <div>
              <label
                htmlFor="forgot-otp-input"
                className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5 text-center"
              >
                6-Digit Verification Code
              </label>
              <div className="relative">
                <input
                  id="forgot-otp-input"
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
                  className="w-full text-center tracking-[0.5em] text-2xl font-mono font-bold py-3 px-4 rounded-2xl border border-brand-300 text-brand-950 focus:ring-2 focus:ring-brand-500"
                  aria-label="6-digit verification code"
                />
              </div>
              <p className="text-[11px] text-brand-muted mt-1 text-center">
                Enter the 6-digit code received in your email.
              </p>
            </div>

            {/* Set New Password Fields */}
            <div className="pt-2 border-t border-brand-100 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="forgot-new-password"
                    className="block text-xs font-bold text-brand-800 uppercase tracking-wider"
                  >
                    New Password
                  </label>
                  <span className="text-[10px] text-brand-muted">(Min 8 characters)</span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
                  <input
                    id="forgot-new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                    minLength={8}
                    autoComplete="new-password"
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
                  htmlFor="forgot-confirm-password"
                  className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
                  <input
                    id="forgot-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-brand-200 text-sm font-medium text-brand-950 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full shadow-soft"
            >
              {newPassword ? 'Set Password & Log In' : 'Verify Code & Log In'}
            </Button>

            {/* Resend Code Section */}
            <div className="flex items-center justify-between pt-2 px-1 text-xs">
              <span className="text-brand-muted">Didn't receive the code?</span>
              <button
                type="button"
                disabled={resendCooldown > 0 || resending}
                onClick={handleResendCode}
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
          </form>
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
