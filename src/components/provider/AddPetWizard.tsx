import React, { useState } from 'react';
import { Pet, PetSpecies, PetGender, PetSize, VaccinationStatus, SterilizationStatus } from '../../types/pet';
import { Button } from '../common/Button';
import { useToast } from '../../contexts/ToastContext';
import { petService } from '../../services/petService';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Upload,
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
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1200',
  ]);
  const [imageUrlInput, setImageUrlInput] = useState('');

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
  const [personalityInsight, setPersonalityInsight] = useState('Affectionate and cheerful.');
  const [habits, setHabits] = useState('Enjoys resting near human companionship.');
  const [likes, setLikes] = useState('Warm treats, gentle head pats, squeaky toys.');
  const [dislikes, setDislikes] = useState('Loud thunderstorms.');
  const [behavior, setBehavior] = useState('House-trained and responsive to basic voice cues.');
  const [specialCare, setSpecialCare] = useState('Standard grooming every two weeks.');
  const [dailyRoutine, setDailyRoutine] = useState('Morning walk, quiet nap, evening park visit, dinner.');

  const [isPublishing, setIsPublishing] = useState(false);

  // Photos helper
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
    showToast('Image preview added to gallery.', 'info');
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSetPrimary = (index: number) => {
    const selected = images[index];
    const rest = images.filter((_, i) => i !== index);
    setImages([selected, ...rest]);
    showToast('Primary cover image updated.', 'info');
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
        showToast('Please add at least one photograph.', 'error');
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
        status: 'Draft',
      });
      showToast('Listing saved as Draft.', 'info');
      navigate('/provider/pets');
    } catch (err: any) {
      showToast(err.message || 'Failed to save draft.', 'error');
    }
  };

  const handlePublish = async () => {
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
            <h3 className="font-display text-xl font-bold text-brand-900 pb-3 border-b border-brand-100">
              Step 2: Realistic Photographs
            </h3>
            <p className="text-xs text-brand-muted">
              Add clear, natural photography of the pet. The first photo will be used as the primary listing card cover.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="Paste image URL (e.g. from Unsplash or camera upload)..."
                className="flex-1 px-4 py-3 rounded-2xl border border-brand-200 text-sm font-medium text-brand-900 focus:ring-2 focus:ring-brand-500"
              />
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleAddImage}
                leftIcon={<Upload className="w-4 h-4" />}
              >
                Add Image
              </Button>
            </div>

            {/* Quick Demo Photo Presets */}
            <div className="flex items-center gap-2 flex-wrap text-xs text-brand-muted">
              <span>Quick add realistic demo photography:</span>
              <button
                type="button"
                onClick={() => setImages([...images, 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=1200'])}
                className="text-brand-700 font-bold hover:underline"
              >
                + Labrador
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setImages([...images, 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&q=80&w=1200'])}
                className="text-brand-700 font-bold hover:underline"
              >
                + Retriever
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setImages([...images, 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=1200'])}
                className="text-brand-700 font-bold hover:underline"
              >
                + Cat
              </button>
            </div>

            {/* Image Preview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
              {images.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-2xl overflow-hidden aspect-[4/3] border-2 border-brand-200 bg-brand-50"
                >
                  <img
                    src={imgUrl}
                    alt={`Pet upload ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {idx === 0 && (
                    <span className="absolute top-2 left-2 bg-brand-800 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow">
                      Primary Cover
                    </span>
                  )}
                  <div className="absolute inset-0 bg-brand-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {idx !== 0 && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(idx)}
                        className="px-2 py-1 rounded-full bg-white text-brand-900 text-xs font-bold hover:bg-brand-100 shadow"
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="p-2 rounded-full bg-rose-600 text-white hover:bg-rose-700 shadow"
                      aria-label="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
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
              First-hand foster observations that help adopters understand the pet's real daily life.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5">
                  Habits
                </label>
                <input
                  type="text"
                  value={habits}
                  onChange={(e) => setHabits(e.target.value)}
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
                  className="w-full px-3.5 py-2 rounded-2xl border border-brand-200 text-xs font-medium text-brand-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5">
                  Daily Routine
                </label>
                <input
                  type="text"
                  value={dailyRoutine}
                  onChange={(e) => setDailyRoutine(e.target.value)}
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
                src={images[0]}
                alt={name}
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
