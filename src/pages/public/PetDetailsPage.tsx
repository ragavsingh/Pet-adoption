import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { petService } from '../../services/petService';
import { adoptionService } from '../../services/adoptionService';
import { Pet } from '../../types/pet';
import { AdoptionRequest } from '../../types/adoptionRequest';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { TrialCountdown } from '../../components/common/TrialCountdown';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useAuth } from '../../contexts/AuthContext';
import { Modal } from '../../components/common/Modal';
import { AdoptionRequestModal } from '../../components/adopter/AdoptionRequestModal';
import { ReportModal } from '../../components/common/ReportModal';
import {
  Heart,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowLeft,
  Share2,
  Flag,
  Activity,
  UserCheck,
  Info,
  Home,
  Check,
  Phone,
  Clock,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { realtimeSync } from '../../services/realtimeSync';

export const PetDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [pet, setPet] = useState<Pet | null>(null);
  const [activeTrial, setActiveTrial] = useState<AdoptionRequest | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const { isFavorite, toggleFavorite } = useFavorites();
  const { user, isAuthenticated, role } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleAdoptClick = () => {
    if (!isAuthenticated || !user) {
      setAuthModalOpen(true);
      return;
    }

    if (role === 'provider') {
      showToast('You are signed in as a Pet Provider. Pet adoptions can only be requested using an Adopter account.', 'info');
      return;
    }

    if (role === 'admin') {
      showToast('Administrators manage records and cannot submit personal adoption requests from this portal.', 'info');
      return;
    }

    setRequestModalOpen(true);
  };

  const handleFavoriteClick = () => {
    if (!isAuthenticated || !user) {
      showToast('Please sign in or create an account to save pets to your favorites ❤️', 'info');
      return;
    }
    if (pet) {
      toggleFavorite(pet);
    }
  };

  const fetchPetData = (showLoading = false) => {
    if (!id) return;
    if (showLoading) setLoading(true);
    petService.getPetById(id)
      .then((p) => {
        if (p) setPet(p);
      })
      .catch((err) => {
        console.warn('[PetDetailsPage] Error loading pet:', err);
      })
      .finally(() => {
        if (showLoading) setLoading(false);
      });

    adoptionService.getTrialForPet(id).then((trialReq) => {
      setActiveTrial(trialReq);
    });
  };

  useEffect(() => {
    fetchPetData(true);

    const unsubscribe = realtimeSync.subscribe((event) => {
      if (
        event.type === 'adoption_request_updated' ||
        event.type === 'foster_trial_updated' ||
        event.type === 'pet_updated' ||
        event.type === 'pet_status_updated' ||
        event.type === 'all'
      ) {
        fetchPetData(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [id]);


  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-sm font-semibold text-brand-600 animate-pulse">
          Loading pet profile...
        </p>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-display text-2xl font-bold text-brand-900">Pet Not Found</h2>
        <p className="text-sm text-brand-muted">
          This pet listing might have been removed or updated.
        </p>
        <Link to="/pets">
          <Button variant="primary" size="md">
            Browse Available Pets
          </Button>
        </Link>
      </div>
    );
  }

  const favorite = isFavorite(pet.id);
  const isAdopted = pet.status === 'Adopted';
  const isPending =
    pet.status === 'Adoption Pending' ||
    pet.status === 'Adoption Requested' ||
    (pet.status as string)?.toLowerCase() === 'pending' ||
    (pet.status as string)?.toLowerCase() === 'trial';


  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Pet profile link copied to clipboard!', 'info');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 text-left">
      {/* Back and Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/pets"
          className="inline-flex items-center gap-2 text-xs font-bold text-brand-700 hover:text-brand-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Pets</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-surface border border-brand-200 flex items-center justify-center text-brand-700 hover:text-brand-950 transition-colors shadow-sm"
            title="Share Pet Profile"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setReportModalOpen(true)}
            className="w-10 h-10 rounded-full bg-surface border border-brand-200 flex items-center justify-center text-brand-500 hover:text-rose-600 transition-colors shadow-sm"
            title="Report Listing"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Gallery & Key Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Col: Photo Gallery (Section 11) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Photo */}
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-brand-100 border border-brand-200 shadow-card">
            <img
              src={pet.images[selectedImageIndex] || pet.images[0]}
              alt={pet.name}
              className="w-full h-full object-cover object-center transition-all duration-300"
              onError={(e) => {
                const target = e.currentTarget;
                if (pet.species === 'Cat') {
                  target.src = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800';
                } else {
                  target.src = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800';
                }
              }}
            />
            <div className="absolute top-4 left-4">
              <StatusBadge status={pet.status} size="md" />
            </div>
            <button
              onClick={handleFavoriteClick}
              className={`absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center shadow-md backdrop-blur-md transition-all ${
                favorite
                  ? 'bg-white text-rose-600 scale-110'
                  : 'bg-white/80 hover:bg-white text-brand-800 hover:text-rose-600'
              }`}
              aria-label="Save to favorites"
            >
              <Heart
                className={`w-6 h-6 ${
                  favorite ? 'fill-rose-600 scale-110 animate-heart-pulse' : ''
                }`}
              />
            </button>
          </div>

          {/* Thumbnail Strip */}
          {pet.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {pet.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 transition-all ${
                    selectedImageIndex === idx
                      ? 'border-brand-700 ring-2 ring-brand-400 scale-105 shadow-sm'
                      : 'border-brand-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (pet.species === 'Cat') {
                        target.src = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=400';
                      } else {
                        target.src = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400';
                      }
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Pet Details & Action Bar */}
        <div className="lg:col-span-5 space-y-6">
          {/* Title & Breed */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-widest">
              <MapPin className="w-3.5 h-3.5 text-brand-500" />
              <span>{pet.location}</span>
              <span>•</span>
              <span>{pet.species}</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-brand-950">
              {pet.name}
            </h1>

            <p className="text-base text-brand-muted font-medium">
              {pet.breed}
            </p>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-3xl bg-surface border border-brand-200/80 shadow-sm text-center">
            <div>
              <span className="text-[11px] font-bold text-brand-400 uppercase tracking-wider block">
                Age
              </span>
              <strong className="text-sm font-bold text-brand-900">{pet.age}</strong>
            </div>
            <div className="border-x border-brand-100">
              <span className="text-[11px] font-bold text-brand-400 uppercase tracking-wider block">
                Gender
              </span>
              <strong className="text-sm font-bold text-brand-900">{pet.gender}</strong>
            </div>
            <div>
              <span className="text-[11px] font-bold text-brand-400 uppercase tracking-wider block">
                Size
              </span>
              <strong className="text-sm font-bold text-brand-900">{pet.size}</strong>
            </div>
          </div>

          {/* Personality Tags */}
          <div>
            <span className="text-xs font-bold text-brand-800 uppercase tracking-wider block mb-2">
              Personality
            </span>
            <div className="flex flex-wrap gap-2">
              {pet.personalityTags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-xs font-bold bg-brand-100 text-brand-900 border border-brand-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Behavioral Stats */}
          <div className="p-4 rounded-3xl bg-surface border border-brand-200/80 space-y-3">
            <span className="text-xs font-bold text-brand-800 uppercase tracking-wider block">
              Temperament & Energy
            </span>
            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between font-bold text-brand-800 mb-1">
                  <span>Energy Level</span>
                  <span>{pet.stats.energy}%</span>
                </div>
                <div className="h-2 rounded-full bg-brand-100 overflow-hidden">
                  <div
                    className="h-full bg-brand-700 rounded-full"
                    style={{ width: `${pet.stats.energy}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-brand-800 mb-1">
                  <span>People Friendliness</span>
                  <span>{pet.stats.friendliness}%</span>
                </div>
                <div className="h-2 rounded-full bg-brand-100 overflow-hidden">
                  <div
                    className="h-full bg-brand-700 rounded-full"
                    style={{ width: `${pet.stats.friendliness}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-brand-800 mb-1">
                  <span>Trainability</span>
                  <span>{pet.stats.trainability}%</span>
                </div>
                <div className="h-2 rounded-full bg-brand-100 overflow-hidden">
                  <div
                    className="h-full bg-brand-700 rounded-full"
                    style={{ width: `${pet.stats.trainability}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Adoption Action Box (Section 11) */}
          <div className="p-5 rounded-3xl bg-brand-100/70 border border-brand-300/80 space-y-4 shadow-sm">
            {isAdopted ? (
              <div className="space-y-2 text-center py-2">
                <span className="inline-block px-4 py-1.5 rounded-full bg-brand-800 text-white font-bold text-sm">
                  Already Adopted ❤️
                </span>
                <p className="text-xs text-brand-700 leading-relaxed">
                  {pet.name} has officially joined their forever family. You can explore other companions currently available for adoption!
                </p>
                <Link to="/pets">
                  <Button variant="outline" size="sm" className="mt-2">
                    Browse Other Companions
                  </Button>
                </Link>
              </div>
            ) : activeTrial ? (
              <div className="p-5 rounded-3xl bg-amber-50/90 border-2 border-amber-200/90 text-left space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-700" />
                    <span>Trial In Progress</span>
                  </span>
                  {activeTrial.trial && (
                    <TrialCountdown
                      startDate={activeTrial.trial.startDate}
                      endDate={activeTrial.trial.endDate}
                      variant="inline"
                    />
                  )}
                </div>

                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  {pet.name} is currently in an active <strong>Foster-to-Own bonding trial</strong> with an approved adopter ({activeTrial.adopterName}). New adoption requests are temporarily paused for this companion.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-1">
                  {user && (user.id === activeTrial.adopterId || activeTrial.adopterId?.includes(user.id)) ? (
                    <Link to="/adopter/dashboard" className="flex-1">
                      <Button
                        variant="primary"
                        size="md"
                        className="w-full shadow-sm"
                        leftIcon={<Sparkles className="w-4 h-4 text-brand-200" />}
                      >
                        View Trial Journey
                      </Button>
                    </Link>
                  ) : role === 'admin' ? (
                    <Link to="/admin/requests" className="flex-1">
                      <Button
                        variant="primary"
                        size="md"
                        className="w-full shadow-sm"
                        leftIcon={<Sparkles className="w-4 h-4 text-brand-200" />}
                      >
                        Review in Admin Console
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/pets" className="flex-1">
                      <Button
                        variant="primary"
                        size="md"
                        className="w-full shadow-sm"
                      >
                        Browse Other Companions
                      </Button>
                    </Link>
                  )}

                  <Button
                    variant="outline"
                    size="md"
                    onClick={handleFavoriteClick}
                    leftIcon={<Heart className={`w-4 h-4 ${favorite ? 'fill-rose-600 text-rose-600' : ''}`} />}
                  >
                    {favorite ? 'Saved' : 'Save Pet'}
                  </Button>
                </div>
              </div>
            ) : isPending ? (
              <div className="p-5 rounded-3xl bg-amber-50/90 border-2 border-amber-200/90 text-left space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-700" />
                    <span>Adoption In Progress</span>
                  </span>
                  <span className="text-xs font-bold text-amber-800 bg-amber-200/70 px-2.5 py-0.5 rounded-full">
                    Application Approved
                  </span>
                </div>

                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  {pet.name} is currently in an approved adoption application or bonding trial. New adoption requests are temporarily paused for this companion.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-1">
                  <Link to="/pets" className="flex-1">
                    <Button variant="outline" size="md" className="w-full">
                      Browse Available Companions
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    size="md"
                    onClick={handleFavoriteClick}
                    leftIcon={<Heart className={`w-4 h-4 ${favorite ? 'fill-rose-600 text-rose-600' : ''}`} />}
                  >
                    {favorite ? 'Saved' : 'Save Pet'}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs text-brand-800">
                  <span className="font-bold">Foster-to-Own Eligible</span>
                  <span className="text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                    14-Day Trial
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch gap-3">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleAdoptClick}
                    className="flex-1 shadow-soft"
                    leftIcon={<Heart className="w-5 h-5 fill-white text-white" />}
                  >
                    Request to Adopt {pet.name}
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleFavoriteClick}
                    leftIcon={<Heart className={`w-5 h-5 ${favorite ? 'fill-rose-600 text-rose-600' : ''}`} />}
                  >
                    {favorite ? 'Saved' : 'Save Pet'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Compatibility & Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Compatibility Matrix */}
        <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-brand-200/80 shadow-card space-y-4">
          <h3 className="font-display text-lg font-bold text-brand-900 flex items-center gap-2">
            <Home className="w-5 h-5 text-brand-600" />
            <span>Home & Living Compatibility</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3.5 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-between">
              <span className="text-brand-800 font-semibold">Apartment Friendly</span>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${pet.apartmentFriendly ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-400'}`}>
                {pet.apartmentFriendly ? '✓' : '×'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-between">
              <span className="text-brand-800 font-semibold">Good with Children</span>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${pet.goodWithChildren ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-400'}`}>
                {pet.goodWithChildren ? '✓' : '×'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-between">
              <span className="text-brand-800 font-semibold">Good with Dogs</span>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${pet.goodWithDogs ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-400'}`}>
                {pet.goodWithDogs ? '✓' : '×'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-between">
              <span className="text-brand-800 font-semibold">Good with Cats</span>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${pet.goodWithCats ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-400'}`}>
                {pet.goodWithCats ? '✓' : '×'}
              </span>
            </div>
          </div>
        </div>

        {/* Health & Medical Background */}
        <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-brand-200/80 shadow-card space-y-4">
          <h3 className="font-display text-lg font-bold text-brand-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-600" />
            <span>Health & Medical Records</span>
          </h3>

          <div className="space-y-3 pt-2 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-brand-100">
              <span className="text-brand-muted">Vaccination Record</span>
              <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {pet.vaccination}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-brand-100">
              <span className="text-brand-muted">Sterilization Status</span>
              <span className="font-bold text-brand-900 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                {pet.sterilization}
              </span>
            </div>

            <div className="py-1">
              <span className="text-brand-400 block mb-1">Veterinary Notes</span>
              <p className="text-brand-800 font-medium leading-relaxed">
                {pet.healthInfo}
              </p>
            </div>

            {pet.specialNeeds && (
              <div className="py-1">
                <span className="text-brand-400 block mb-1">Special Needs / Exercise</span>
                <p className="text-brand-800 font-medium leading-relaxed">
                  {pet.specialNeeds}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-surface rounded-3xl p-6 sm:p-10 border border-brand-200/80 shadow-card space-y-4">
        <h3 className="font-display text-2xl font-bold text-brand-950">
          About {pet.name}
        </h3>
        <p className="text-sm sm:text-base text-brand-800 leading-relaxed max-w-4xl">
          {pet.description}
        </p>
      </div>

      {/* Emotional Section: Provider's Insight (Section 11) */}
      <div className="bg-gradient-to-br from-brand-100/90 via-surface to-brand-50 rounded-3xl p-6 sm:p-10 border-2 border-brand-300 shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-brand-200">
          <div>
            <span className="text-xs font-bold text-brand-700 uppercase tracking-widest bg-brand-200/80 px-3 py-1 rounded-full">
              Foster Parent Knowledge
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-950 mt-2">
              Provider's Insight
            </h3>
          </div>
          <span className="text-xs text-brand-600 font-medium italic">
            Observed during daily foster care
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
          <div className="p-4 rounded-2xl bg-white border border-brand-200 space-y-1">
            <span className="font-bold text-brand-500 uppercase tracking-wider text-[10px]">Personality</span>
            <p className="text-brand-900 font-medium leading-relaxed">{pet.providerInsight.personality}</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-brand-200 space-y-1">
            <span className="font-bold text-brand-500 uppercase tracking-wider text-[10px]">Daily Habits</span>
            <p className="text-brand-900 font-medium leading-relaxed">{pet.providerInsight.habits}</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-brand-200 space-y-1">
            <span className="font-bold text-brand-500 uppercase tracking-wider text-[10px]">Likes & Treats</span>
            <p className="text-brand-900 font-medium leading-relaxed">{pet.providerInsight.likes}</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-brand-200 space-y-1">
            <span className="font-bold text-brand-500 uppercase tracking-wider text-[10px]">Dislikes & Triggers</span>
            <p className="text-brand-900 font-medium leading-relaxed">{pet.providerInsight.dislikes}</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-brand-200 space-y-1">
            <span className="font-bold text-brand-500 uppercase tracking-wider text-[10px]">House Behavior</span>
            <p className="text-brand-900 font-medium leading-relaxed">{pet.providerInsight.behavior}</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-brand-200 space-y-1">
            <span className="font-bold text-brand-500 uppercase tracking-wider text-[10px]">Daily Routine</span>
            <p className="text-brand-900 font-medium leading-relaxed">{pet.providerInsight.dailyRoutine}</p>
          </div>
        </div>
      </div>

      {/* Provider Profile Card (Section 11) */}
      <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-brand-200/80 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={pet.provider.avatar}
            alt={pet.provider.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-brand-300 shrink-0"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-display text-lg font-bold text-brand-950">
                {pet.provider.name}
              </h4>
              {pet.provider.verified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Provider
                </span>
              )}
            </div>
            <p className="text-xs text-brand-500 font-medium">{pet.provider.title} • {pet.provider.location}</p>
            <p className="text-xs text-brand-muted max-w-xl leading-relaxed">{pet.provider.about}</p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          <Link to="/for-providers">
            <Button variant="outline" size="sm">
              Provider Standards
            </Button>
          </Link>
        </div>
      </div>

      {/* Adoption Request Modal (Only accessible by authenticated adopters) */}
      <AdoptionRequestModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        pet={pet}
      />

      {/* Sign In Required Modal for Guests */}
      <Modal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title={`Sign In to Adopt ${pet.name}`}
        description="An active adopter account is required to send adoption applications, begin a 14-day Foster-to-Own trial, and connect with verified rescue shelters."
      >
        <div className="space-y-6 pt-2 text-left">
          <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center shrink-0 text-brand-700">
              <Heart className="w-5 h-5 fill-brand-700 text-brand-700" />
            </div>
            <div>
              <p className="text-xs font-bold text-brand-950">Why is an account required?</p>
              <p className="text-xs text-brand-muted mt-0.5 leading-relaxed">
                Rescue shelters need your verified contact details and home living information to safely review adoption requests and arrange the foster trial.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full justify-center shadow-soft font-bold"
              onClick={() => navigate('/login', { state: { from: `/pets/${pet.id}` } })}
            >
              Sign In as Adopter
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full justify-center font-bold"
              onClick={() => navigate(`/signup?role=adopter&redirect=/pets/${pet.id}`)}
            >
              Create Free Adopter Account
            </Button>

            <button
              type="button"
              onClick={() => setAuthModalOpen(false)}
              className="w-full text-center text-xs font-semibold text-brand-500 hover:text-brand-800 transition-colors pt-1"
            >
              Cancel & Continue Browsing Pets
            </button>
          </div>
        </div>
      </Modal>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        targetType="Pet Listing"
        targetId={pet.id}
        targetName={`${pet.name} (${pet.breed})`}
      />
    </div>
  );
};
