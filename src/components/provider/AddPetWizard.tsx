import React, { useState, useRef } from 'react';
import { Pet, PetSpecies, PetGender, PetSize, VaccinationStatus, SterilizationStatus } from '../../types/pet';
import { Button } from '../common/Button';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { petService } from '../../services/petService';
import { petImageService } from '../../services/petImageService';
import { useNavigate } from 'react-router-dom';
import { resolveUserAvatar } from '../../utils/avatarUtils';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Upload,
  UploadCloud,
  Camera,
  Loader2,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  Heart,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

const STEPS = [
  'Basic Info',
  'Photos',
  'Personality',
  'Compatibility',
  'Health',
  'Description',
  'Provider Insight',
  'Preview & Publish',
];

export const AddPetWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const { showToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<PetSpecies>('Dog');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<PetGender>('Male');
  const [size, setSize] = useState<PetSize>('Medium');
  const [location, setLocation] = useState('Mumbai');

  // Photos
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Personality & Stats
  const [personalityInput, setPersonalityInput] = useState('');
  const [tags, setTags] = useState<string[]>(['Playful', 'Loving', 'Gentle']);
  const [energy, setEnergy] = useState(70);
  const [friendliness, setFriendliness] = useState(90);
  const [trainability, setTrainability] = useState(75);
  const [independence, setIndependence] = useState(50);

  // Compatibility
  const [goodWithChildren, setGoodWithChildren] = useState(true);
  const [goodWithDogs, setGoodWithDogs] = useState(true);
  const [goodWithCats, setGoodWithCats] = useState(false);
  const [apartmentFriendly, setApartmentFriendly] = useState(true);

  // Health
  const [vaccination, setVaccination] = useState<VaccinationStatus>('Fully Vaccinated');
  const [sterilization, setSterilization] = useState<SterilizationStatus>('Sterilized');
  const [healthInfo, setHealthInfo] = useState('Routine checks up to date. Microchipped and dewormed.');
  const [specialNeeds, setSpecialNeeds] = useState('None');

  // Description
  const [description, setDescription] = useState(
    'A loving, friendly soul ready to find a committed forever home. Enjoys interactive walks and relaxing indoors with family.'
  );

  // Provider's Insight
  const [personalityInsight, setPersonalityInsight] = useState('Affectionate and cheerful, greets you warmly.');
  const [habits, setHabits] = useState('Enjoys resting near human companionship.');
  const [likes, setLikes] = useState('Warm treats, gentle head pats, squeaky toys.');
  const [dislikes, setDislikes] = useState('Loud thunderstorms.');
  const [behavior, setBehavior] = useState('House-trained and responsive to basic voice cues.');
  const [specialCare, setSpecialCare] = useState('Standard grooming every two weeks.');
  const [dailyRoutine, setDailyRoutine] = useState('Morning walk, quiet nap, evening park visit, dinner.');

  const [isPublishing, setIsPublishing] = useState(false);

  // File Upload Helper
  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Format validation
      if (!file.type.startsWith('image/')) {
        showToast(`${file.name} is not a valid image file.`, 'error');
        continue;
      }

      // 5MB limit
      if (file.size > 5 * 1024 * 1024) {
        showToast(`${file.name} exceeds 5MB size limit. Please upload a smaller photo.`, 'error');
        continue;
      }

      // Try uploading to Supabase Storage
      let uploaded = false;
      try {
        const res = await petImageService.uploadPetImage(file);
        if (res.publicUrl) {
          uploadedUrls.push(res.publicUrl);
          uploaded = true;
        }
      } catch (err) {
        console.warn('[AddPetWizard] Storage upload fallback to local data URI:', err);
      }

      // Robust fallback for demo mode / offline / storage notices: read as Data URL
      if (!uploaded) {
        try {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          uploadedUrls.push(dataUrl);
        } catch (readErr) {
          console.error('[AddPetWizard] FileReader error:', readErr);
          showToast(`Failed to process photo ${file.name}`, 'error');
        }
      }
    }

    if (uploadedUrls.length > 0) {
      setImages((prev) => [...prev, ...uploadedUrls]);
      showToast(`${uploadedUrls.length} photo${uploadedUrls.length > 1 ? 's' : ''} uploaded successfully!`, 'success');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsUploadingPhoto(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  // URL Image Helper
  const handleAddImage = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;

    // Strict URL validation: must start with https://, http://, or data:image/
    const isValidProtocol = /^https?:\/\//i.test(trimmed) || /^data:image\/[a-z0-9.+_-]+;base64,/i.test(trimmed);
    if (!isValidProtocol) {
      showToast('Please enter a valid HTTP/HTTPS image URL or data URI.', 'error');
      return;
    }

    setImages([...images, trimmed]);
    setImageUrlInput('');
    showToast('Photo added to gallery.', 'info');
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    showToast('Photo removed.', 'info');
  };

  const handleSetPrimary = (index: number) => {
    const selected = images[index];
    const rest = images.filter((_, i) => i !== index);
    setImages([selected, ...rest]);
    showToast('Primary cover photo updated.', 'info');
  };

  // Tags helper
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && personalityInput.trim()) {
      e.preventDefault();
      if (!tags.includes(personalityInput.trim())) {
        setTags([...tags, personalityInput.trim()]);
      }
      setPersonalityInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Step validation
  const validateStep = (step: number) => {
    if (step === 1) {
      if (!name.trim()) {
        showToast('Please provide the pet’s name.', 'error');
        return false;
      }
      if (!breed.trim()) {
        showToast('Please provide the breed.', 'error');
        return false;
      }
      if (!age.trim()) {
        showToast('Please provide the age.', 'error');
        return false;
      }
    }
    if (step === 2) {
      if (images.length === 0) {
        showToast('Please upload at least one photograph of the pet.', 'error');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(STEPS.length, prev + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Provider profile constructor to link listing directly to authenticated provider
  const getProviderPayload = () => {
    if (!user) return undefined;
    const providerAvatar = resolveUserAvatar({
      avatar: user.providerProfile?.avatar || user.avatar,
      name: user.name || user.providerProfile?.name,
      email: user.email,
    });
    return {
      id: user.id,
      name: user.name || user.providerProfile?.name || 'Pet Provider',
      title: user.providerProfile?.organizationName || 'Verified Pet Provider',
      location: user.providerProfile?.location || location || 'Mumbai',
      verified: user.providerProfile?.verified ?? true,
      avatar: providerAvatar,
      about: user.providerProfile?.about || 'Dedicated pet foster caregiver and rescue provider.',
    };
  };

  const handleSaveDraft = async () => {
    try {
      await petService.createPet({
        name: name || 'Draft Pet',
        species,
        breed: breed || 'Mixed',
        age: age || 'Unknown',
        gender,
        size,
        location,
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1200'],
        personalityTags: tags,
        stats: { energy, friendliness, trainability, independence },
        goodWithChildren,
        goodWithDogs,
        goodWithCats,
        apartmentFriendly,
        vaccination,
        sterilization,
        healthInfo,
        specialNeeds,
        description,
        providerInsight: {
          personality: personalityInsight,
          habits,
          likes,
          dislikes,
          behavior,
          specialCare,
          dailyRoutine,
        },
        provider: getProviderPayload(),
        status: 'Draft',
      });
      showToast('Listing saved as Draft.', 'info');
      navigate('/provider/pets');
    } catch (err: any) {
      showToast(err.message || 'Failed to save draft.', 'error');
    }
  };

  const handlePublish = async () => {
    if (images.length === 0) {
      showToast('Please upload at least one photo before publishing.', 'error');
      setCurrentStep(2);
      return;
    }

    setIsPublishing(true);
    try {
      await petService.createPet({
        name: name || 'Companion',
        species,
        breed: breed || 'Mixed Breed',
        age: age || '1 year',
        gender,
        size,
        location,
        images,
        personalityTags: tags,
        stats: { energy, friendliness, trainability, independence },
        goodWithChildren,
        goodWithDogs,
        goodWithCats,
        apartmentFriendly,
        vaccination,
        sterilization,
        healthInfo,
        specialNeeds,
        description,
        providerInsight: {
          personality: personalityInsight,
          habits,
          likes,
          dislikes,
          behavior,
          specialCare,
          dailyRoutine,
        },
        provider: getProviderPayload(),
        status: 'Available',
      });
      setIsPublishing(false);
      showToast(`${name || 'Pet'} has been published and is now discoverable for adoption! 🎉`, 'success');
      navigate('/provider/pets');
    } catch (e: any) {
      setIsPublishing(false);
      showToast(e.message || 'Error publishing listing.', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Wizard Header */}
      <div className="text-center mb-8">
        <span className="text-xs font-bold text-brand-600 uppercase tracking-widest bg-brand-100 px-3.5 py-1 rounded-full">
          List a Pet for Adoption
        </span>
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-brand-900 mt-2">
          Add Pet Wizard
        </h2>
        <p className="text-sm text-brand-muted max-w-lg mx-auto mt-1">
          Detailed listings help match pets with the most compatible forever families.
        </p>
      </div>

      {/* Progress Stepper Bar */}
      <div className="bg-surface rounded-3xl p-4 sm:p-6 border border-brand-200/80 shadow-card mb-8">
        <div className="flex items-center justify-between mb-3 text-xs font-bold text-brand-700">
          <span>Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1]}</span>
          <span>{Math.round((currentStep / STEPS.length) * 100)}% Completed</span>
        </div>

        {/* Bar */}
        <div className="w-full h-2.5 rounded-full bg-brand-100 overflow-hidden mb-4">
          <div
            className="h-full bg-brand-700 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Step dots */}
        <div className="hidden sm:flex items-center justify-between">
          {STEPS.map((stepName, i) => {
            const stepNum = i + 1;
            const isDone = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;
            return (
              <button
                key={stepName}
                onClick={() => {
                  if (stepNum < currentStep) setCurrentStep(stepNum);
                }}
                disabled={stepNum > currentStep}
                className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-all ${
                  isDone
                    ? 'text-brand-800'
                    : isCurrent
                    ? 'text-brand-950 font-extrabold'
                    : 'text-brand-300 cursor-not-allowed'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isDone
                      ? 'bg-brand-700 text-white'
                      : isCurrent
                      ? 'bg-brand-400 text-brand-950 ring-2 ring-brand-600'
                      : 'bg-brand-100 text-brand-400'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : stepNum}
                </div>
                <span className="max-w-[70px] text-center leading-tight truncate">{stepName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Step Form Card */}
      <div className="bg-surface rounded-3xl border border-brand-200/80 shadow-card p-6 sm:p-10 mb-8 animate-fade-in text-left">
        {/* STEP 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="font-display text-xl font-bold text-brand-900 pb-3 border-b border-brand-100">
              Step 1: Basic Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-2">
                  Pet Name <span className="text-brand-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Bruno, Luna..."
                  className="w-full px-4 py-3 rounded-2xl border border-brand-200 focus:ring-2 focus:ring-brand-500 text-sm font-semibold text-brand-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-2">
                  Species
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Dog', 'Cat', 'Other'] as PetSpecies[]).map((sp) => (
                    <button
                      key={sp}
                      type="button"
                      onClick={() => setSpecies(sp)}
                      className={`py-3 px-3 rounded-2xl text-xs font-bold transition-all border ${
                        species === sp
                          ? 'bg-brand-700 text-white border-brand-700'
                          : 'bg-surface text-brand-800 border-brand-200'
                      }`}
                    >
                      {sp}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-2">
                  Breed <span className="text-brand-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  placeholder="e.g. Labrador Retriever, Indie Native..."
                  className="w-full px-4 py-3 rounded-2xl border border-brand-200 focus:ring-2 focus:ring-brand-500 text-sm font-semibold text-brand-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-2">
                  Age <span className="text-brand-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 2 years, 6 months..."
                  className="w-full px-4 py-3 rounded-2xl border border-brand-200 focus:ring-2 focus:ring-brand-500 text-sm font-semibold text-brand-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-2">
                  Gender
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Male', 'Female'] as PetGender[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`py-3 px-3 rounded-2xl text-xs font-bold transition-all border ${
                        gender === g
                          ? 'bg-brand-700 text-white border-brand-700'
                          : 'bg-surface text-brand-800 border-brand-200'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-2">
                  Size
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value as PetSize)}
                  className="w-full px-4 py-3 rounded-2xl border border-brand-200 focus:ring-2 focus:ring-brand-500 text-sm font-semibold text-brand-900"
                >
                  <option value="Small">Small (&lt;10kg)</option>
                  <option value="Medium">Medium (10-25kg)</option>
                  <option value="Large">Large (&gt;25kg)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-2">
                  City / Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Andheri East, Mumbai..."
                  className="w-full px-4 py-3 rounded-2xl border border-brand-200 focus:ring-2 focus:ring-brand-500 text-sm font-semibold text-brand-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Photos */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="border-b border-brand-100 pb-3">
              <h3 className="font-display text-xl font-bold text-brand-900">
                Step 2: Realistic Photographs
              </h3>
              <p className="text-xs text-brand-muted mt-1">
                Upload genuine, high-quality photos directly from your phone camera, photo gallery, or device files. The first photo will be used as the primary listing cover card seen by adopters.
              </p>
            </div>

            {/* Hidden File Input for Device & Camera */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Direct Device Upload Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-brand-600 bg-brand-50/80 scale-[1.01]'
                  : 'border-brand-300 hover:border-brand-500 bg-brand-50/40 hover:bg-brand-50'
              }`}
            >
              {isUploadingPhoto ? (
                <div className="flex flex-col items-center justify-center py-4 space-y-2">
                  <Loader2 className="w-8 h-8 text-brand-700 animate-spin" />
                  <p className="text-sm font-bold text-brand-900">Uploading photo(s)...</p>
                  <p className="text-xs text-brand-muted">Optimizing and preparing image preview</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center shadow-sm">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold shadow-sm mb-1.5 transition-colors">
                      <UploadCloud className="w-4 h-4" />
                      <span>Choose Photos from Device or Camera</span>
                    </span>
                    <p className="text-xs text-brand-muted mt-1">
                      Drag & drop images here, or tap to browse your phone gallery / camera
                    </p>
                    <p className="text-[11px] text-brand-400 mt-0.5">
                      Supports JPEG, PNG, WEBP (up to 5MB per image)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Alternative: URL Input */}
            <div className="pt-2">
              <span className="text-[11px] font-bold text-brand-500 uppercase tracking-wider block mb-2">
                Or paste an image web URL
              </span>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 px-4 py-2.5 rounded-2xl border border-brand-200 text-xs font-medium text-brand-900 focus:ring-2 focus:ring-brand-500"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddImage}
                  leftIcon={<Upload className="w-3.5 h-3.5" />}
                >
                  Add Link
                </Button>
              </div>
            </div>

            {/* Quick Demo Photo Presets */}
            <div className="flex items-center gap-2 flex-wrap text-xs text-brand-muted pt-1">
              <span>Quick demo photos:</span>
              <button
                type="button"
                onClick={() => setImages((prev) => [...prev, 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=1200'])}
                className="text-brand-700 font-bold hover:underline"
              >
                + Labrador
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setImages((prev) => [...prev, 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&q=80&w=1200'])}
                className="text-brand-700 font-bold hover:underline"
              >
                + Retriever
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setImages((prev) => [...prev, 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=1200'])}
                className="text-brand-700 font-bold hover:underline"
              >
                + Kitten
              </button>
            </div>

            {/* Photo Gallery Grid */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-800 uppercase tracking-wider">
                  Uploaded Photos ({images.length})
                </span>
                {images.length > 0 && (
                  <span className="text-[11px] text-brand-500">
                    The first photo is the Primary Cover
                  </span>
                )}
              </div>

              {images.length === 0 ? (
                <div className="p-8 rounded-2xl bg-brand-50/50 border border-brand-200/80 text-center">
                  <ImageIcon className="w-8 h-8 text-brand-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-brand-700">No photos added yet</p>
                  <p className="text-[11px] text-brand-muted mt-0.5">Please upload at least one photo using the box above</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className={`relative rounded-2xl overflow-hidden aspect-[4/3] border-2 bg-brand-50 flex flex-col justify-between ${
                        idx === 0 ? 'border-brand-600 ring-2 ring-brand-300' : 'border-brand-200'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Pet photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Top Bar: Primary Badge & Delete Button */}
                      <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
                        {idx === 0 ? (
                          <span className="bg-brand-800 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md pointer-events-auto">
                            ★ Primary Cover
                          </span>
                        ) : (
                          <span />
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(idx);
                          }}
                          className="w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md pointer-events-auto transition-colors"
                          title="Remove photo"
                          aria-label="Remove photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Bottom Bar: Set Primary Cover button */}
                      {idx !== 0 && (
                        <div className="absolute bottom-2 left-2 right-2 flex justify-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetPrimary(idx);
                            }}
                            className="px-3 py-1 rounded-full bg-white/95 hover:bg-white text-brand-900 text-[11px] font-bold shadow-md border border-brand-200 transition-colors"
                          >
                            Set as Cover
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Personality */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="font-display text-xl font-bold text-brand-900 pb-3 border-b border-brand-100">
              Step 3: Personality & Behavioral Metrics
            </h3>

            <div>
              <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-2">
                Personality Tags (Press Enter to add)
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 text-brand-900 font-bold text-xs"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-brand-500 hover:text-brand-900 text-sm font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={personalityInput}
                onChange={(e) => setPersonalityInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Type tag (e.g. Active, Calm, Snuggly) and press Enter..."
                className="w-full px-4 py-2.5 rounded-2xl border border-brand-200 text-xs font-medium text-brand-900 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-brand-800 mb-1">
                  <span>Energy Level</span>
                  <span>{energy}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={energy}
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  className="w-full accent-brand-700"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-brand-800 mb-1">
                  <span>Friendliness</span>
                  <span>{friendliness}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={friendliness}
                  onChange={(e) => setFriendliness(Number(e.target.value))}
                  className="w-full accent-brand-700"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-brand-800 mb-1">
                  <span>Trainability</span>
                  <span>{trainability}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={trainability}
                  onChange={(e) => setTrainability(Number(e.target.value))}
                  className="w-full accent-brand-700"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-brand-800 mb-1">
                  <span>Independence</span>
                  <span>{independence}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={independence}
                  onChange={(e) => setIndependence(Number(e.target.value))}
                  className="w-full accent-brand-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Compatibility */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="font-display text-xl font-bold text-brand-900 pb-3 border-b border-brand-100">
              Step 4: Living Compatibility
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Apartment Friendly', val: apartmentFriendly, set: setApartmentFriendly },
                { label: 'Good with Children', val: goodWithChildren, set: setGoodWithChildren },
                { label: 'Good with other Dogs', val: goodWithDogs, set: setGoodWithDogs },
                { label: 'Good with Cats', val: goodWithCats, set: setGoodWithCats },
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => item.set(!item.val)}
                  className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    item.val
                      ? 'bg-brand-50 border-brand-400 text-brand-950 font-bold'
                      : 'bg-surface border-brand-200 text-brand-600'
                  }`}
                >
                  <span className="text-sm">{item.label}</span>
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      item.val ? 'bg-brand-700 text-white' : 'bg-brand-100 text-brand-400'
                    }`}
                  >
                    {item.val ? <Check className="w-4 h-4" /> : '—'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: Health */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h3 className="font-display text-xl font-bold text-brand-900 pb-3 border-b border-brand-100">
              Step 5: Health & Medical Background
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-2">
                  Vaccination Status
                </label>
                <select
                  value={vaccination}
                  onChange={(e) => setVaccination(e.target.value as VaccinationStatus)}
                  className="w-full px-4 py-3 rounded-2xl border border-brand-200 text-sm font-semibold text-brand-900"
                >
                  <option value="Fully Vaccinated">Fully Vaccinated</option>
                  <option value="Partially Vaccinated">Partially Vaccinated</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-2">
                  Sterilization / Neutered
                </label>
                <select
                  value={sterilization}
                  onChange={(e) => setSterilization(e.target.value as SterilizationStatus)}
                  className="w-full px-4 py-3 rounded-2xl border border-brand-200 text-sm font-semibold text-brand-900"
                >
                  <option value="Sterilized">Sterilized / Spayed / Neutered</option>
                  <option value="Not Sterilized">Not Sterilized</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-2">
                  Medical Notes & Vet History
                </label>
                <textarea
                  rows={2}
                  value={healthInfo}
                  onChange={(e) => setHealthInfo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-brand-200 text-xs font-medium text-brand-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-2">
                  Special Needs or Dietary Requirements
                </label>
                <input
                  type="text"
                  value={specialNeeds}
                  onChange={(e) => setSpecialNeeds(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-brand-200 text-xs font-medium text-brand-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Description */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <h3 className="font-display text-xl font-bold text-brand-900 pb-3 border-b border-brand-100">
              Step 6: Pet Story & Description
            </h3>

            <div>
              <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-2">
                About the Pet
              </label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Share the pet's journey, origin, and what makes them a wonderful companion..."
                className="w-full px-4 py-3 rounded-2xl border border-brand-200 text-sm font-medium text-brand-900 leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* STEP 7: Provider's Insight */}
        {currentStep === 7 && (
          <div className="space-y-5">
            <h3 className="font-display text-xl font-bold text-brand-900 pb-3 border-b border-brand-100">
              Step 7: Provider's Insight (Foster Knowledge)
            </h3>
            <p className="text-xs text-brand-muted">
              First-hand foster observations that help adopters understand the pet's real daily life. These 6 insights are prominently showcased on the public adoption profile.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5">
                  Foster Personality & Demeanor
                </label>
                <input
                  type="text"
                  value={personalityInsight}
                  onChange={(e) => setPersonalityInsight(e.target.value)}
                  placeholder="e.g. Affectionate, cheerful, loves morning greetings..."
                  className="w-full px-3.5 py-2 rounded-2xl border border-brand-200 text-xs font-medium text-brand-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5">
                  Daily Habits & Sleeping Spots
                </label>
                <input
                  type="text"
                  value={habits}
                  onChange={(e) => setHabits(e.target.value)}
                  placeholder="e.g. Enjoys resting near human companionship..."
                  className="w-full px-3.5 py-2 rounded-2xl border border-brand-200 text-xs font-medium text-brand-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5">
                  Favorite Treats & Likes
                </label>
                <input
                  type="text"
                  value={likes}
                  onChange={(e) => setLikes(e.target.value)}
                  placeholder="e.g. Warm treats, gentle head pats, squeaky toys..."
                  className="w-full px-3.5 py-2 rounded-2xl border border-brand-200 text-xs font-medium text-brand-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5">
                  Dislikes / Triggers
                </label>
                <input
                  type="text"
                  value={dislikes}
                  onChange={(e) => setDislikes(e.target.value)}
                  placeholder="e.g. Loud thunderstorms, vacuum cleaners..."
                  className="w-full px-3.5 py-2 rounded-2xl border border-brand-200 text-xs font-medium text-brand-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5">
                  House Behavior & Training
                </label>
                <input
                  type="text"
                  value={behavior}
                  onChange={(e) => setBehavior(e.target.value)}
                  placeholder="e.g. House-trained, responds to basic voice cues..."
                  className="w-full px-3.5 py-2 rounded-2xl border border-brand-200 text-xs font-medium text-brand-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5">
                  Daily Routine & Schedule
                </label>
                <input
                  type="text"
                  value={dailyRoutine}
                  onChange={(e) => setDailyRoutine(e.target.value)}
                  placeholder="e.g. Morning walk, quiet nap, evening park visit, dinner..."
                  className="w-full px-3.5 py-2 rounded-2xl border border-brand-200 text-xs font-medium text-brand-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5">
                  Special Care & Grooming Notes
                </label>
                <input
                  type="text"
                  value={specialCare}
                  onChange={(e) => setSpecialCare(e.target.value)}
                  placeholder="e.g. Standard grooming every two weeks, ear cleaning..."
                  className="w-full px-3.5 py-2 rounded-2xl border border-brand-200 text-xs font-medium text-brand-900"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 8: Preview & Publish */}
        {currentStep === 8 && (
          <div className="space-y-6">
            <h3 className="font-display text-xl font-bold text-brand-900 pb-3 border-b border-brand-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-500" />
              <span>Step 8: Review & Publish Listing</span>
            </h3>

            {/* Listing Preview Card */}
            <div className="p-6 rounded-3xl bg-brand-50 border border-brand-200 flex flex-col sm:flex-row items-start gap-6">
              <img
                src={images[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600'}
                alt={name || 'Pet'}
                className="w-full sm:w-44 aspect-[4/3] rounded-2xl object-cover border border-brand-200 shrink-0"
              />
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-2xl font-bold text-brand-950">
                    {name || 'Unnamed'}
                  </h4>
                  <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                    Ready to Publish
                  </span>
                </div>
                <p className="text-xs font-bold text-brand-600 uppercase tracking-wider">
                  {species} • {breed} • {age} • {gender} • {size}
                </p>
                <p className="text-xs text-brand-muted line-clamp-3 leading-relaxed">
                  {description}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="text-[11px] font-semibold bg-white border border-brand-200 px-2 py-0.5 rounded-full text-brand-800"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-surface p-4 rounded-2xl border border-brand-200 text-xs text-brand-700 flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0" />
              <span>
                Frontend Simulation: This listing will be published immediately into your local demonstration state and become visible in both Pet Discovery and your Provider listings.
              </span>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between pt-8 mt-8 border-t border-brand-100">
          <div>
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleBack}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button type="button" variant="cream" size="md" onClick={handleSaveDraft}>
              Save Draft
            </Button>

            {currentStep < STEPS.length ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleNext}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Next Step
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="lg"
                isLoading={isPublishing}
                onClick={handlePublish}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Publish Listing
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
