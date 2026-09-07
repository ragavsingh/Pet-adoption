import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../../components/common/Logo';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Heart, Home, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';
import { recordRegisteredUser } from '../../services/adminService';

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

export const SignupPage: React.FC = () => {
  const [roleSelection, setRoleSelection] = useState<'adopter' | 'provider' | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [location, setLocation] = useState('');
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { user, isAuthenticated, signup, realSignup, realLoginWithGoogle } = useAuth();
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

  const handleGoogleSignup = async () => {
    setErrorMessage(null);
    setLoading(true);
    try {
      const res = await realLoginWithGoogle();
      if (res?.error) {
        setLoading(false);
        setErrorMessage(res.error);
        showToast(res.error, 'error');
      }
    } catch (err: any) {
      setLoading(false);
      const msg = err?.message || 'Failed to initiate Google sign-in.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleSelection) return;

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    if (!isSupabaseConfigured()) {
      // Demo Mode Fallback
      setTimeout(() => {
        signup(name, cleanEmail, roleSelection);
        recordRegisteredUser({ name, email: cleanEmail, role: roleSelection, location });
        setLoading(false);
        showToast(`Welcome to PET ADOPTION, ${name}! Your account is ready (Demo Mode).`, 'success');

        if (roleSelection === 'adopter') {
          navigate('/adopter/dashboard');
        } else {
          navigate('/provider/dashboard');
        }
      }, 500);
      return;
    }

    // Real Supabase Auth Flow
    try {
      const res = await realSignup({
        email: cleanEmail,
        password,
        fullName: name.trim(),
        role: roleSelection,
        city: location.trim(),
        organizationName: orgName.trim() || undefined,
      });

      setLoading(false);

      if (res.success) {
        recordRegisteredUser({ name: name.trim(), email: cleanEmail, role: roleSelection, location: location.trim() });
        showToast(`Welcome to PET ADOPTION, ${name}! Your account is ready.`, 'success');
        if (roleSelection === 'adopter') {
          navigate('/adopter/dashboard');
        } else {
          navigate('/provider/dashboard');
        }
      } else {
        const err = res.error || 'Failed to create account.';
        setErrorMessage(err);
        showToast(err, 'error');
      }
    } catch (err: any) {
      setLoading(false);
      const msg = err.message || 'An unexpected error occurred.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg bg-surface rounded-3xl p-8 sm:p-10 border border-brand-200/80 shadow-soft-lg space-y-8 text-left animate-fade-in">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <Logo size="md" />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-950">
            Join PET ADOPTION
          </h2>
          <p className="text-xs text-brand-muted">
            Connect with verified caregivers and companions across India.
          </p>
        </div>

        {/* Google OAuth Quick Signup */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleSignup}
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
                OR SIGN UP WITH EMAIL
              </span>
            </div>
          </div>
        </div>

        {/* Role Choice: Strictly Adopter or Provider */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider text-center">
            What are you here to do?
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Option 1: Adopter */}
            <button
              type="button"
              onClick={() => setRoleSelection('adopter')}
              className={`p-5 rounded-2xl border-2 text-center flex flex-col items-center gap-2 transition-all ${
                roleSelection === 'adopter'
                  ? 'border-brand-700 bg-brand-50 shadow-sm scale-[1.02]'
                  : 'border-brand-200 hover:border-brand-300 bg-surface'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  roleSelection === 'adopter' ? 'bg-brand-700 text-white' : 'bg-brand-100 text-brand-700'
                }`}
              >
                <Heart className="w-6 h-6 fill-current" />
              </div>
              <strong className="text-xs font-extrabold text-brand-950 uppercase tracking-wide">
                I WANT TO ADOPT
              </strong>
              <span className="text-[11px] text-brand-muted leading-tight">
                Discover pets, foster-to-own, and welcome a companion
              </span>
            </button>

            {/* Option 2: Provider */}
            <button
              type="button"
              onClick={() => setRoleSelection('provider')}
              className={`p-5 rounded-2xl border-2 text-center flex flex-col items-center gap-2 transition-all ${
                roleSelection === 'provider'
                  ? 'border-brand-700 bg-brand-50 shadow-sm scale-[1.02]'
                  : 'border-brand-200 hover:border-brand-300 bg-surface'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  roleSelection === 'provider' ? 'bg-brand-700 text-white' : 'bg-brand-100 text-brand-700'
                }`}
              >
                <Home className="w-6 h-6" />
              </div>
              <strong className="text-xs font-extrabold text-brand-950 uppercase tracking-wide">
                I WANT TO LIST A PET
              </strong>
              <span className="text-[11px] text-brand-muted leading-tight">
                Shelter, foster caregiver, or rescue NGO listing pets
              </span>
            </button>
          </div>
        </div>

        {/* Error banner if any */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span>{errorMessage}</span>
              {errorMessage.includes('already exists') && (
                <p className="text-[11px] text-rose-700">
                  Already have an account?{' '}
                  <Link to="/login" className="font-bold underline hover:text-rose-950">
                    Log in here
                  </Link>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Registration fields after role choice */}
        {roleSelection && (
          <form onSubmit={handleRegister} className="space-y-4 pt-4 border-t border-brand-100 animate-fade-in">
            <span className="text-xs font-bold text-brand-700 uppercase tracking-wider block">
              {roleSelection === 'adopter' ? 'Adopter Registration' : 'Pet Provider Registration'}
            </span>

            <div>
              <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1">
                Full Name <span className="text-brand-600">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Raghav Singh"
                className="w-full px-4 py-2.5 rounded-2xl border border-brand-200 text-sm font-medium text-brand-950 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {roleSelection === 'provider' && (
              <div>
                <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1">
                  Rescue Trust / Shelter Name (Optional)
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Paws & Care Rescue Trust"
                  className="w-full px-4 py-2.5 rounded-2xl border border-brand-200 text-sm font-medium text-brand-950 focus:ring-2 focus:ring-brand-500"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1">
                  Email Address <span className="text-brand-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-2.5 rounded-2xl border border-brand-200 text-sm font-medium text-brand-950 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1">
                  City / Location <span className="text-brand-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Mumbai, Delhi..."
                  className="w-full px-4 py-2.5 rounded-2xl border border-brand-200 text-sm font-medium text-brand-950 focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1">
                  Create Password <span className="text-brand-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 chars"
                    className="w-full pl-4 pr-10 py-2.5 rounded-2xl border border-brand-200 text-sm font-medium text-brand-950 focus:ring-2 focus:ring-brand-500"
                  />
                  {password.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-700 transition-colors p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1">
                  Confirm Password <span className="text-brand-600">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full px-4 py-2.5 rounded-2xl border border-brand-200 text-sm font-medium text-brand-950 focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
            <p className="text-[10px] text-brand-muted">Password must be at least 8 characters.</p>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full shadow-soft mt-2"
            >
              Create Account
            </Button>

            {/* Terms and Privacy notice */}
            <p className="text-[11px] text-brand-muted text-center pt-2 leading-relaxed">
              By creating an account, you agree to our{' '}
              <Link to="/about" className="font-semibold text-brand-700 hover:text-brand-950 underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/about" className="font-semibold text-brand-700 hover:text-brand-950 underline">
                Privacy Policy
              </Link>
              .
            </p>
          </form>
        )}

        <div className="text-center pt-2 border-t border-brand-100 text-xs text-brand-muted">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-brand-800 hover:text-brand-950 underline">
            Log In here
          </Link>
        </div>
      </div>
    </div>
  );
};
