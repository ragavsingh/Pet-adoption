import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../../components/common/Logo';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Heart, Home, AlertCircle, CheckCircle2 } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';
import { recordRegisteredUser } from '../../services/adminService';

export const SignupPage: React.FC = () => {
  const [roleSelection, setRoleSelection] = useState<'adopter' | 'provider' | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailConfirmationPending, setEmailConfirmationPending] = useState(false);

  const { signup, realSignup } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleSelection) return;

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    if (!isSupabaseConfigured()) {
      // Demo Mode Fallback
      setTimeout(() => {
        signup(name, email, roleSelection);
        recordRegisteredUser({ name, email, role: roleSelection, location });
        setLoading(false);
        showToast(`Welcome to PET ADOPTION, ${name}! Your account is ready (Demo Mode).`, 'success');

        if (roleSelection === 'adopter') {
          navigate('/adopter/profile');
        } else {
          navigate('/provider/dashboard');
        }
      }, 500);
      return;
    }

    // Real Supabase Auth Flow
    try {
      const res = await realSignup({
        email,
        password,
        fullName: name,
        role: roleSelection,
        city: location,
        organizationName: orgName,
      });

      setLoading(false);

      if (res.success) {
        recordRegisteredUser({ name, email, role: roleSelection, location });
        if (res.requiresEmailConfirmation) {
          setEmailConfirmationPending(true);
          showToast('Confirmation email sent! Please check your inbox.', 'info');
        } else {
          showToast(`Welcome to PET ADOPTION, ${name}! Your account is ready.`, 'success');
          if (roleSelection === 'adopter') {
            navigate('/adopter/profile');
          } else {
            navigate('/provider/dashboard');
          }
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

        {/* Email Confirmation Screen */}
        {emailConfirmationPending ? (
          <div className="text-center space-y-4 py-4 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-brand-950">Check Your Inbox</h3>
            <p className="text-xs text-brand-800 leading-relaxed max-w-sm mx-auto">
              We sent a verification email to <strong className="text-brand-950">{email}</strong>. Please click the link in that email to confirm your account and log in.
            </p>
            <div className="pt-2">
              <Link to="/login">
                <Button variant="primary" size="md">
                  Go to Login
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
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
                <span>{errorMessage}</span>
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

                <div>
                  <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1">
                    Password <span className="text-brand-600">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters..."
                    className="w-full px-4 py-2.5 rounded-2xl border border-brand-200 text-sm font-medium text-brand-950 focus:ring-2 focus:ring-brand-500"
                  />
                  <p className="text-[10px] text-brand-muted mt-1">Must be at least 8 characters.</p>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={loading}
                  className="w-full shadow-soft mt-2"
                >
                  Complete Registration
                </Button>
              </form>
            )}
          </>
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
