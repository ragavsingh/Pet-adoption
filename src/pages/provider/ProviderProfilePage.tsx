import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/common/Button';
import { ShieldCheck, MapPin, Phone, Mail, Award, Check, Lock, KeyRound, Eye, EyeOff } from 'lucide-react';
import { authService } from '../../services/authService';

export const ProviderProfilePage: React.FC = () => {
  const { user, updateProviderProfile } = useAuth();
  const { showToast } = useToast();

  const profile = user?.providerProfile;
  const [name, setName] = useState(profile?.name || "Sarah D'Souza");
  const [orgName, setOrgName] = useState(profile?.organizationName || 'Paws & Care Rescue Mumbai');
  const [location, setLocation] = useState(profile?.location || 'Andheri East, Mumbai');
  const [phone, setPhone] = useState(profile?.phone || '+91 98192 34567');
  const [about, setAbout] = useState(
    profile?.about ||
      'Animal welfare advocate and certified foster caregiver with 7+ years of experience helping rescued and surrendered dogs find loving forever homes.'
  );
  const [saving, setSaving] = useState(false);

  // Account Security Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters long.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    setUpdatingPassword(true);
    const res = await authService.updateUserPassword(newPassword);
    setUpdatingPassword(false);
    if (res.success) {
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password updated successfully! You can now log in with email and password.', 'success');
      setTimeout(() => setPasswordSuccess(false), 5000);
    } else {
      showToast(res.error || 'Failed to update password.', 'error');
    }
  };

  // Synchronize local form fields when user profile loads or updates
  React.useEffect(() => {
    if (profile) {
      setName(profile.name);
      setOrgName(profile.organizationName || '');
      setLocation(profile.location);
      setPhone(profile.phone);
      setAbout(profile.about);
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProviderProfile({
        name,
        organizationName: orgName,
        location,
        phone,
        about,
      });
      showToast('Provider profile updated successfully!', 'success');
    } catch (err: any) {
      showToast('Failed to update provider profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 text-left">
      <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-brand-200/80 shadow-card flex items-center gap-5">
        <img
          src={profile?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400'}
          alt={name}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-brand-200 shadow-sm"
        />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-brand-950">{name}</h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified
            </span>
          </div>
          <p className="text-xs font-semibold text-brand-700">{orgName}</p>
          <p className="text-xs text-brand-muted">{location} • 38 Successful Adoptions</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-surface rounded-3xl p-6 sm:p-8 border border-brand-200/80 shadow-card space-y-5">
        <h3 className="font-display text-lg font-bold text-brand-950 pb-3 border-b border-brand-100">
          Organization & Provider Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1">
              Contact Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-brand-200 text-sm font-semibold text-brand-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1">
              Rescue / NGO Name
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-brand-200 text-sm font-semibold text-brand-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-brand-200 text-sm font-semibold text-brand-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-brand-200 text-sm font-semibold text-brand-900"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1">
              About Shelter & Welfare Standards
            </label>
            <textarea
              rows={4}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-brand-200 text-sm font-medium text-brand-900 leading-relaxed"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button type="submit" variant="primary" size="md" isLoading={saving}>
            Save Provider Profile
          </Button>
        </div>
      </form>

      {/* Account Security & Password Card */}
      <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-brand-200/80 shadow-soft-sm space-y-5 text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-brand-950">
              Account Security & Password
            </h3>
            <p className="text-xs text-brand-muted">
              Set or update your password to log in directly with Email + Password anytime.
            </p>
          </div>
        </div>

        {passwordSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Password successfully updated! You can now log in using this password.</span>
          </div>
        )}

        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1">
              New Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                minLength={8}
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-brand-200 text-sm font-medium text-brand-900 focus:ring-2 focus:ring-brand-500"
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
            <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                minLength={8}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-brand-200 text-sm font-medium text-brand-900 focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <Button
            type="button"
            onClick={handleUpdatePassword}
            variant="primary"
            size="md"
            isLoading={updatingPassword}
            disabled={!newPassword || !confirmPassword}
            className="shadow-soft"
          >
            Update Password
          </Button>
        </div>
      </div>
    </div>
  );
};
