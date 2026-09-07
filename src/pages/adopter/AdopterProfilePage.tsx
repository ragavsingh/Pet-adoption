import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/common/Button';
import { AdopterProfile } from '../../types/user';
import {
  User,
  MapPin,
  Phone,
  Mail,
  Home,
  Briefcase,
  Clock,
  Activity,
  Users,
  Dog,
  Award,
  Edit3,
  Check,
  X,
  Sparkles,
  Camera,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  RotateCcw,
  Upload,
} from 'lucide-react';
import { authService } from '../../services/authService';
import { UserAvatar } from '../../components/common/UserAvatar';
import { Modal } from '../../components/common/Modal';
import { resolveUserAvatar, getGoogleDefaultAvatar, optimizeAvatarImage } from '../../utils/avatarUtils';

export const AdopterProfilePage: React.FC = () => {
  const { user, updateAdopterProfile } = useAuth();
  const { showToast } = useToast();

  const profile = user?.adopterProfile;

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Form State
  const [name, setName] = useState(profile?.name || user?.name || 'Member');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [location, setLocation] = useState(profile?.location || 'India');
  const [avatar, setAvatar] = useState(
    resolveUserAvatar({
      avatar: profile?.avatar || user?.avatar,
      name: profile?.name || user?.name,
      email: profile?.email || user?.email,
    })
  );

  // Automatically keep view state in sync with updated user profile when not actively editing
  useEffect(() => {
    if (!isEditing && user) {
      const activeName = profile?.name || user.name;
      if (activeName && activeName !== name) {
        setName(activeName);
      }
      const activeAvatar = resolveUserAvatar({
        avatar: profile?.avatar || user.avatar,
        name: activeName,
        email: profile?.email || user.email,
      });
      if (activeAvatar && activeAvatar !== avatar) {
        setAvatar(activeAvatar);
      }
      if (profile?.location && profile.location !== location) {
        setLocation(profile.location);
      }
      if (profile?.phone && profile.phone !== phone) {
        setPhone(profile.phone);
      }
    }
  }, [user, profile, isEditing]);
  const [homeType, setHomeType] = useState<AdopterProfile['homeType']>(profile?.homeType || 'Apartment');
  const [workType, setWorkType] = useState<AdopterProfile['workType']>(profile?.workType || 'Hybrid');
  const [timeAway, setTimeAway] = useState<AdopterProfile['timeAway']>(profile?.timeAway || 'Under 4 hours');
  const [activityLevel, setActivityLevel] = useState<AdopterProfile['activityLevel']>(profile?.activityLevel || 'Active');
  const [children, setChildren] = useState<AdopterProfile['children']>(profile?.children || 'None');
  const [existingPets, setExistingPets] = useState<AdopterProfile['existingPets']>(profile?.existingPets || 'None');
  const [petExperience, setPetExperience] = useState<AdopterProfile['petExperience']>(
    profile?.petExperience || 'Lifelong pet owner'
  );
  const [preferredPetType, setPreferredPetType] = useState(profile?.preferredPetType || 'Dog (Medium to Large)');
  const [preferredSize, setPreferredSize] = useState(profile?.preferredSize || 'Medium');
  const [preferredAge, setPreferredAge] = useState(profile?.preferredAge || 'Young adult (1-3 years)');
  const [whyTheyWantToAdopt, setWhyTheyWantToAdopt] = useState(
    profile?.whyTheyWantToAdopt ||
      'I live in an apartment with nearby parks and work hybrid 3 days a week. Looking for an active, friendly companion for morning jogs and long weekend walks.'
  );

  // Photo Management Modal State
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [tempAvatar, setTempAvatar] = useState(avatar);
  const [isOptimizingPhoto, setIsOptimizingPhoto] = useState(false);

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
    showToast('Reset to default Gmail display picture.', 'info');
  };

  const handleSavePhotoModal = async () => {
    setSaving(true);
    try {
      setAvatar(tempAvatar);
      await updateAdopterProfile({ avatar: tempAvatar });
      setIsPhotoModalOpen(false);
      showToast('Profile photo updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update photo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Synchronize local form fields when user profile loads or changes
  React.useEffect(() => {
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone);
      setLocation(profile.location);
      setAvatar(
        resolveUserAvatar({
          avatar: profile.avatar || user?.avatar,
          name: profile.name || user?.name,
          email: profile.email || user?.email,
        })
      );
      setHomeType(profile.homeType);
      setWorkType(profile.workType);
      setTimeAway(profile.timeAway);
      setActivityLevel(profile.activityLevel);
      setChildren(profile.children);
      setExistingPets(profile.existingPets);
      setPetExperience(profile.petExperience);
      setPreferredPetType(profile.preferredPetType);
      setPreferredSize(profile.preferredSize);
      setPreferredAge(profile.preferredAge);
      setWhyTheyWantToAdopt(profile.whyTheyWantToAdopt);
    }
  }, [profile, user]);

  const completionPercent = profile?.profileCompletion || 80;

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name cannot be empty.', 'error');
      return;
    }

    setSaving(true);
    try {
      await updateAdopterProfile({
        name,
        phone,
        location,
        avatar,
        homeType,
        workType,
        timeAway,
        activityLevel,
        children,
        existingPets,
        petExperience,
        preferredPetType,
        preferredSize,
        preferredAge,
        whyTheyWantToAdopt,
        profileCompletion: 85,
      });

      setIsEditing(false);
      showToast('Adopter profile updated successfully!', 'success');
    } catch (err: any) {
      showToast('Failed to update adopter profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone);
      setLocation(profile.location);
      setAvatar(
        resolveUserAvatar({
          avatar: profile.avatar || user?.avatar,
          name: profile.name || user?.name,
          email: profile.email || user?.email,
        })
      );
      setHomeType(profile.homeType);
      setWorkType(profile.workType);
      setTimeAway(profile.timeAway);
      setActivityLevel(profile.activityLevel);
      setChildren(profile.children);
      setExistingPets(profile.existingPets);
      setPetExperience(profile.petExperience);
      setPreferredPetType(profile.preferredPetType);
      setPreferredSize(profile.preferredSize);
      setPreferredAge(profile.preferredAge);
      setWhyTheyWantToAdopt(profile.whyTheyWantToAdopt);
    }
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-left">
      {/* Profile Header & Completion Bar */}
      <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-brand-200/80 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
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

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-brand-950">
                {name}
              </h2>
              <span className="bg-brand-100 text-brand-800 text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                Verified Adopter
              </span>
            </div>
            <p className="text-xs text-brand-muted mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-500" />
              <span>{location}</span>
              <span>•</span>
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
              {isEditing && (
                <>
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
                    Use Gmail Default DP
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Profile Completion Indicator (Section 14) */}
        <div className="bg-brand-50 p-4 rounded-2xl border border-brand-200 shrink-0 space-y-2 text-center sm:text-right">
          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs font-bold text-brand-900">
            <span>Profile Completion:</span>
            <span className="text-sm font-extrabold text-brand-800">{completionPercent}%</span>
          </div>
          <div className="w-full sm:w-44 h-2.5 rounded-full bg-brand-200 overflow-hidden">
            <div
              className="h-full bg-brand-700 rounded-full transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-brand-500 block">
            High completion boosts rescue response rate
          </span>
        </div>
      </div>

      {/* Edit Toggle Button */}
      <div className="flex justify-end">
        {!isEditing ? (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => setIsEditing(true)}
            leftIcon={<Edit3 className="w-4 h-4" />}
          >
            Edit Adoption Profile
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleCancel}
              leftIcon={<X className="w-4 h-4" />}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleSave}
              isLoading={saving}
              leftIcon={<Check className="w-4 h-4" />}
            >
              Save Profile
            </Button>
          </div>
        )}
      </div>

      {/* Profile Form / View */}
      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Contact & Personal */}
        <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-brand-200/80 shadow-card space-y-5">
          <h3 className="font-display text-lg font-bold text-brand-950 pb-3 border-b border-brand-100 flex items-center gap-2">
            <User className="w-5 h-5 text-brand-600" />
            <span>Personal & Contact Information</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-brand-200 text-sm font-semibold text-brand-900 focus:ring-2 focus:ring-brand-500"
                />
              ) : (
                <p className="text-sm font-bold text-brand-900">{name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-brand-200 text-sm font-semibold text-brand-900 focus:ring-2 focus:ring-brand-500"
                />
              ) : (
                <p className="text-sm font-bold text-brand-900">{phone}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5">
                City / Locality
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-brand-200 text-sm font-semibold text-brand-900 focus:ring-2 focus:ring-brand-500"
                />
              ) : (
                <p className="text-sm font-bold text-brand-900">{location}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Home & Daily Lifestyle (Section 14) */}
        <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-brand-200/80 shadow-card space-y-5">
          <h3 className="font-display text-lg font-bold text-brand-950 pb-3 border-b border-brand-100 flex items-center gap-2">
            <Home className="w-5 h-5 text-brand-600" />
            <span>Home Environment & Lifestyle</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block font-bold text-brand-800 uppercase tracking-wider mb-1.5">
                Home Type
              </label>
              {isEditing ? (
                <select
                  value={homeType}
                  onChange={(e) => setHomeType(e.target.value as AdopterProfile['homeType'])}
                  className="w-full px-4 py-2.5 rounded-2xl border border-brand-200 text-sm font-semibold text-brand-900 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="Apartment">Apartment (1-3 BHK)</option>
                  <option value="Independent House">Independent House</option>
                  <option value="Villa">Villa / Farmhouse</option>
                </select>
              ) : (
                <p className="text-sm font-bold text-brand-900">{homeType}</p>
              )}
            </div>

            <div>
              <label className="block font-bold text-brand-800 uppercase tracking-wider mb-1.5">
                Work Schedule
              </label>
              {isEditing ? (
                <select
                  value={workType}
                  onChange={(e) => setWorkType(e.target.value as AdopterProfile['workType'])}
                  className="w-full px-4 py-2.5 rounded-2xl border border-brand-200 text-sm font-semibold text-brand-900 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="Hybrid">Hybrid (2-3 days work from home)</option>
                  <option value="Remote">100% Work from Home</option>
                  <option value="On-site">On-site / Office</option>
                </select>
              ) : (
                <p className="text-sm font-bold text-brand-900">{workType}</p>
              )}
            </div>

            <div>
              <label className="block font-bold text-brand-800 uppercase tracking-wider mb-1.5">
                Average Daily Time Away from Home
              </label>
              {isEditing ? (
                <select
                  value={timeAway}
                  onChange={(e) => setTimeAway(e.target.value as AdopterProfile['timeAway'])}
                  className="w-full px-4 py-2.5 rounded-2xl border border-brand-200 text-sm font-semibold text-brand-900 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="Under 4 hours">Under 4 hours</option>
                  <option value="4-8 hours">4-8 hours</option>
                  <option value="8+ hours">8+ hours</option>
                </select>
              ) : (
                <p className="text-sm font-bold text-brand-900">{timeAway}</p>
              )}
            </div>

            <div>
              <label className="block font-bold text-brand-800 uppercase tracking-wider mb-1.5">
                Activity Level
              </label>
              {isEditing ? (
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value as AdopterProfile['activityLevel'])}
                  className="w-full px-4 py-2.5 rounded-2xl border border-brand-200 text-sm font-semibold text-brand-900 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="Active">Active (Daily morning walks & weekend hikes)</option>
                  <option value="Moderate">Moderate (Steady daily walks)</option>
                  <option value="Relaxed">Relaxed (Quiet couch lounging)</option>
                </select>
              ) : (
                <p className="text-sm font-bold text-brand-900">{activityLevel}</p>
              )}
            </div>

            <div>
              <label className="block font-bold text-brand-800 uppercase tracking-wider mb-1.5">
                Children in Household
              </label>
              {isEditing ? (
                <select
                  value={children}
                  onChange={(e) => setChildren(e.target.value as AdopterProfile['children'])}
                  className="w-full px-4 py-2.5 rounded-2xl border border-brand-200 text-sm font-semibold text-brand-900 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="None">None</option>
                  <option value="Young children (< 6)">Young children (&lt;6)</option>
                  <option value="Older children (6+)">Older children (6+)</option>
                  <option value="Teens">Teens</option>
                </select>
              ) : (
                <p className="text-sm font-bold text-brand-900">{children}</p>
              )}
            </div>

            <div>
              <label className="block font-bold text-brand-800 uppercase tracking-wider mb-1.5">
                Existing Pets
              </label>
              {isEditing ? (
                <select
                  value={existingPets}
                  onChange={(e) => setExistingPets(e.target.value as AdopterProfile['existingPets'])}
                  className="w-full px-4 py-2.5 rounded-2xl border border-brand-200 text-sm font-semibold text-brand-900 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="None">None currently</option>
                  <option value="Dogs">Friendly dog(s)</option>
                  <option value="Cats">Cat(s)</option>
                  <option value="Dogs & Cats">Both dogs & cats</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <p className="text-sm font-bold text-brand-900">{existingPets}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-brand-800 uppercase tracking-wider mb-1.5">
                Prior Pet Experience
              </label>
              {isEditing ? (
                <select
                  value={petExperience}
                  onChange={(e) => setPetExperience(e.target.value as AdopterProfile['petExperience'])}
                  className="w-full px-4 py-2.5 rounded-2xl border border-brand-200 text-sm font-semibold text-brand-900 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="Lifelong pet owner">Lifelong pet owner (Experienced)</option>
                  <option value="Moderate experience">Moderate experience</option>
                  <option value="First-time pet parent">First-time pet parent (Motivated)</option>
                </select>
              ) : (
                <p className="text-sm font-bold text-brand-900">{petExperience}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Preferences & Motivation */}
        <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-brand-200/80 shadow-card space-y-5">
          <h3 className="font-display text-lg font-bold text-brand-950 pb-3 border-b border-brand-100 flex items-center gap-2">
            <Dog className="w-5 h-5 text-brand-600" />
            <span>Pet Preferences & Adoption Intent</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-brand-800 uppercase tracking-wider mb-1.5">
                Preferred Pet Type
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={preferredPetType}
                  onChange={(e) => setPreferredPetType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-brand-200 text-sm font-medium text-brand-900 focus:ring-2 focus:ring-brand-500"
                />
              ) : (
                <p className="text-sm font-bold text-brand-900">{preferredPetType}</p>
              )}
            </div>

            <div>
              <label className="block font-bold text-brand-800 uppercase tracking-wider mb-1.5">
                Preferred Size
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={preferredSize}
                  onChange={(e) => setPreferredSize(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-brand-200 text-sm font-medium text-brand-900 focus:ring-2 focus:ring-brand-500"
                />
              ) : (
                <p className="text-sm font-bold text-brand-900">{preferredSize}</p>
              )}
            </div>

            <div>
              <label className="block font-bold text-brand-800 uppercase tracking-wider mb-1.5">
                Preferred Age
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={preferredAge}
                  onChange={(e) => setPreferredAge(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-brand-200 text-sm font-medium text-brand-900 focus:ring-2 focus:ring-brand-500"
                />
              ) : (
                <p className="text-sm font-bold text-brand-900">{preferredAge}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5">
              Why do you want to adopt?
            </label>
            {isEditing ? (
              <textarea
                rows={3}
                value={whyTheyWantToAdopt}
                onChange={(e) => setWhyTheyWantToAdopt(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-brand-200 text-sm font-medium text-brand-900 leading-relaxed focus:ring-2 focus:ring-brand-500"
              />
            ) : (
              <p className="text-sm text-brand-800 leading-relaxed bg-brand-50/70 p-4 rounded-2xl border border-brand-100">
                "{whyTheyWantToAdopt}"
              </p>
            )}
          </div>
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
        title="Update Profile Photo"
        description="Sync your new Google account photo, upload directly from your device, or reset to your default Gmail badge."
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
              Select the exact same photo file you just uploaded to your Google Account (JPG, PNG, WebP).
            </p>
          </div>

          {/* Option 2: Paste Google Profile Photo Address */}
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

          {/* Option 3: Reset to Default Gmail Letter DP */}
          <div className="pt-3 border-t border-brand-100 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-brand-muted">Want the clean Google initial badge?</span>
            <button
              type="button"
              onClick={handleResetToGmailAvatar}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-950 px-2.5 py-1.5 rounded-lg hover:bg-brand-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Use Gmail Letter DP</span>
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
            >
              {saving ? 'Saving...' : 'Save & Apply Photo'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
