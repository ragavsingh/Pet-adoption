import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/common/Button';
import {
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Award,
  Check,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Camera,
  Upload,
  RotateCcw,
} from 'lucide-react';
import { authService } from '../../services/authService';
import { petService } from '../../services/petService';
import { UserAvatar } from '../../components/common/UserAvatar';
import { Modal } from '../../components/common/Modal';
import {
  resolveUserAvatar,
  getGoogleDefaultAvatar,
  optimizeAvatarImage,
} from '../../utils/avatarUtils';

export const ProviderProfilePage: React.FC = () => {
  const { user, updateProviderProfile } = useAuth();
  const { showToast } = useToast();

  const profile = user?.providerProfile;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(profile?.name || user?.name || 'Pet Provider');
  const [orgName, setOrgName] = useState(profile?.organizationName || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [about, setAbout] = useState(
    profile?.about ||
      'Animal welfare advocate and certified foster caregiver dedicated to helping rescued pets find loving forever homes.'
  );
  const [avatar, setAvatar] = useState(
    resolveUserAvatar({
      avatar: profile?.avatar || user?.avatar,
      name: profile?.name || user?.name,
      email: user?.email,
    })
  );
  const [saving, setSaving] = useState(false);

  // Photo Management Modal State
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [tempAvatar, setTempAvatar] = useState(avatar);
  const [isOptimizingPhoto, setIsOptimizingPhoto] = useState(false);

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
  useEffect(() => {
    if (user) {
      const activeName = profile?.name || user.name || 'Pet Provider';
      setName(activeName);
      setOrgName(profile?.organizationName || '');
      setLocation(profile?.location || '');
      setPhone(profile?.phone || '');
      if (profile?.about) {
        setAbout(profile.about);
      }
      const activeAvatar = resolveUserAvatar({
        avatar: profile?.avatar || user.avatar,
        name: activeName,
        email: user.email,
      });
      setAvatar(activeAvatar);
      setTempAvatar(activeAvatar);
    }
  }, [user, profile]);

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file.', 'error');
      return;
    }

    setIsOptimizingPhoto(true);
    try {
      const optimized = await optimizeAvatarImage(file);
      setAvatar(optimized);
      setTempAvatar(optimized);
      showToast('Photo selected and optimized! Click "Save Photo" to apply.', 'success');
    } catch (err) {
      showToast('Could not process image file. Please try another image.', 'error');
    } finally {
      setIsOptimizingPhoto(false);
    }
  };

  const handleResetToGmailAvatar = () => {
    const defaultDp = getGoogleDefaultAvatar(name || user?.name, user?.email);
    setAvatar(defaultDp);
    setTempAvatar(defaultDp);
    showToast('Reset to authentic Google display picture.', 'info');
  };

  const handleSavePhotoModal = async () => {
    setSaving(true);
    try {
      setAvatar(tempAvatar);
      await updateProviderProfile({ avatar: tempAvatar });
      if (user?.id) {
        petService.syncProviderMetadataInPets(user.id, { avatar: tempAvatar });
      }
      setIsPhotoModalOpen(false);
      showToast('Provider profile photo updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update photo.', 'error');
    } finally {
      setSaving(false);
    }
  };

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
        avatar,
      });
      if (user?.id) {
        petService.syncProviderMetadataInPets(user.id, {
          name,
          avatar,
          location,
          organizationName: orgName,
          about,
        });
      }
      showToast('Provider profile updated successfully!', 'success');
    } catch (err: any) {
      showToast('Failed to update provider profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 text-left">
      {/* Profile Header & Avatar Card */}
      <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-brand-200/80 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Avatar with Camera Overlay */}
          <div className="relative shrink-0 group">
            <UserAvatar
              src={avatar}
              name={name}
              email={user?.email}
              size="xl"
              className="border-4 border-brand-200 shadow-md cursor-pointer hover:opacity-95 transition-opacity"
            />
            <div className="absolute -bottom-1 -right-1 flex items-center gap-1 bg-surface p-1 rounded-full border border-brand-200 shadow-md">
              <button
                type="button"
                onClick={() => {
                  setTempAvatar(avatar);
                  setPhotoUrlInput(avatar.startsWith('http') ? avatar : '');
                  setIsPhotoModalOpen(true);
                }}
                className="w-8 h-8 rounded-full bg-brand-700 text-white flex items-center justify-center hover:bg-brand-800 transition-transform hover:scale-105 shadow-xs cursor-pointer"
                title="Update or sync profile photo"
                aria-label="Update or sync profile photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleAvatarFileSelect}
              className="hidden"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-brand-950">{name}</h2>
              {profile?.verified ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Provider
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 bg-brand-100 px-2.5 py-0.5 rounded-full">
                  Pet Provider
                </span>
              )}
            </div>
            {orgName && <p className="text-xs font-semibold text-brand-700">{orgName}</p>}
            <p className="text-xs text-brand-muted flex items-center gap-1.5">
              {location && (
                <>
                  <MapPin className="w-3.5 h-3.5 text-brand-500" />
                  <span>{location}</span>
                  <span>•</span>
                </>
              )}
              <Mail className="w-3.5 h-3.5 text-brand-500" />
              <span>{user?.email}</span>
            </p>

            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setTempAvatar(avatar);
                  setPhotoUrlInput(avatar.startsWith('http') ? avatar : '');
                  setIsPhotoModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-brand-700 hover:bg-brand-800 text-white transition-colors cursor-pointer shadow-xs"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Sync / Update Photo</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-brand-100 text-brand-800 hover:bg-brand-200 transition-colors cursor-pointer"
              >
                <Upload className="w-3 h-3" />
                Upload from device
              </button>
              <button
                type="button"
                onClick={handleResetToGmailAvatar}
                className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Use Google Initial DP
              </button>
            </div>
          </div>
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

      {/* Dedicated Photo Sync & Upload Modal */}
      <Modal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        title="Update Provider Profile Photo"
        description="Sync your Google account photo, upload directly from your device, or reset to your clean Google initial badge."
        maxWidth="md"
      >
        <div className="space-y-6 text-left py-2">
          {/* Live Preview */}
          <div className="flex flex-col items-center justify-center p-5 bg-brand-50/70 rounded-2xl border border-brand-200/80">
            <UserAvatar
              src={tempAvatar}
              name={name}
              email={user?.email}
              size="2xl"
              className="border-4 border-surface shadow-md"
            />
            <p className="text-xs font-bold text-brand-950 mt-3">{name || 'Your Profile'}</p>
            <p className="text-[11px] text-brand-muted">{user?.email}</p>
          </div>

          {/* Option 1: Upload from Device */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-brand-900 uppercase tracking-wider">
              Option 1: Upload Photo from Device
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isOptimizingPhoto}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{isOptimizingPhoto ? 'Optimizing Image...' : 'Choose Photo from PC / Mobile'}</span>
            </button>
            <p className="text-[11px] text-brand-muted leading-tight">
              Select any photo file (JPG, PNG, WebP) from your device.
            </p>
          </div>

          {/* Option 2: Paste Google / Web Image URL */}
          <div className="space-y-2 pt-3 border-t border-brand-100">
            <label className="block text-xs font-bold text-brand-900 uppercase tracking-wider">
              Option 2: Paste Google / Web Image URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={photoUrlInput}
                onChange={(e) => setPhotoUrlInput(e.target.value)}
                placeholder="https://lh3.googleusercontent.com/..."
                className="flex-1 px-3 py-2 rounded-xl border border-brand-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (!photoUrlInput.trim()) {
                    showToast('Please enter an image URL.', 'error');
                    return;
                  }
                  setTempAvatar(photoUrlInput.trim());
                  showToast('URL preview applied! Click "Save & Apply Photo" below.', 'info');
                }}
                className="px-3 py-2 rounded-xl bg-brand-100 hover:bg-brand-200 text-brand-900 font-bold text-xs transition-colors cursor-pointer shrink-0"
              >
                Preview
              </button>
            </div>
            <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-3 text-[11px] text-amber-950 leading-relaxed space-y-1">
              <div className="font-bold text-amber-900 flex items-center gap-1">
                <span>💡 How to copy your Google DP link:</span>
              </div>
              <ol className="list-decimal pl-4 space-y-0.5 text-amber-900/90">
                <li>Open <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer" className="underline font-bold">Gmail</a> or your <a href="https://myaccount.google.com" target="_blank" rel="noopener noreferrer" className="underline font-bold">Google Account</a> in your browser.</li>
                <li>Right-click your profile circle in the top-right corner.</li>
                <li>Click <strong>"Copy image address"</strong> (or "Copy image link").</li>
                <li>Paste it in the box above and click Preview.</li>
              </ol>
            </div>
          </div>

          {/* Option 3: Reset to Default Google Initial Badge */}
          <div className="pt-3 border-t border-brand-100 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-brand-muted">Want the clean Google initial badge?</span>
            <button
              type="button"
              onClick={handleResetToGmailAvatar}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-950 px-2.5 py-1.5 rounded-lg hover:bg-brand-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Use Google Initial DP</span>
            </button>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPhotoModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={saving}
              onClick={handleSavePhotoModal}
              leftIcon={<Check className="w-4 h-4" />}
            >
              {saving ? 'Saving...' : 'Save & Apply Photo'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
