import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { adoptionService } from '../../services/adoptionService';
import { petService } from '../../services/petService';
import { AdoptionRequest } from '../../types/adoptionRequest';
import { Pet } from '../../types/pet';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PetCard } from '../../components/common/PetCard';
import { Button } from '../../components/common/Button';
import { FosterTrialCard } from '../../components/adopter/FosterTrialCard';
import { AdoptionJourneyStepper } from '../../components/adopter/AdoptionJourneyStepper';
import {
  Heart,
  FileText,
  CheckCircle2,
  Award,
  Bell,
  ArrowRight,
  Compass,
  Calendar,
  Sparkles,
  UserCheck,
} from 'lucide-react';

export const AdopterDashboard: React.FC = () => {
  const { user } = useAuth();
  const { favoriteCount, favorites } = useFavorites();
  const [requests, setRequests] = useState<AdoptionRequest[]>([]);
  const [savedPets, setSavedPets] = useState<Pet[]>([]);
  const [recommendedPets, setRecommendedPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user, favorites]);

  const loadData = async () => {
    if (!user?.id) {
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const reqs = await adoptionService.getRequestsForUser(user.id, 'adopter');
    setRequests(reqs);

    const allPets = await petService.getAllPets();
    const favPets = allPets.filter((p) => favorites.includes(p.id));
    setSavedPets(favPets);

    // Recommended
    const recs = allPets.filter((p) => p.status === 'Available' && !favorites.includes(p.id)).slice(0, 3);
    setRecommendedPets(recs);
    setLoading(false);
  };

  const pendingCount = requests.filter((r) => r.status === 'Pending' || r.status === 'Under Review').length;
  const approvedCount = requests.filter((r) => r.status === 'Approved').length;
  const completedCount = requests.filter((r) => r.status === 'Completed').length;

  const activeTrialRequest = requests.find((r) => r.status === 'Approved' && r.trial);

  const profileCompletion = user?.adopterProfile?.profileCompletion || 80;

  return (
    <div className="space-y-8 text-left">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-brand-800 via-brand-700 to-brand-900 text-white shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-900/70 border border-brand-600 text-brand-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Adopter Dashboard</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name.split(' ')[0]}! 👋
          </h2>
          <p className="text-xs sm:text-sm text-brand-200 max-w-lg leading-relaxed">
            Your journey toward welcoming a forever companion is progressing. Track your applications and trial periods below.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-4 bg-brand-900/50 p-4 rounded-2xl border border-brand-600">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-12 h-12 -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                className="text-brand-800"
                fill="none"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray="125.6"
                strokeDashoffset={125.6 - (125.6 * profileCompletion) / 100}
                className="text-brand-300"
                fill="none"
              />
            </svg>
            <span className="absolute text-xs font-bold text-white">{profileCompletion}%</span>
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Profile Completion</span>
            <Link to="/adopter/profile" className="text-[11px] text-brand-300 hover:text-white underline">
              Complete Lifestyle Details →
            </Link>
          </div>
        </div>
      </div>

      {/* 5 Statistic Cards (Section 13) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Saved Pets */}
        <Link
          to="/adopter/favorites"
          className="p-5 rounded-3xl bg-surface border border-brand-200/80 shadow-card hover:shadow-card-hover transition-all group flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
            <Heart className="w-5 h-5 fill-rose-600" />
          </div>
          <div>
            <span className="text-2xl font-display font-extrabold text-brand-950 block">
              {favoriteCount}
            </span>
            <span className="text-xs font-semibold text-brand-muted group-hover:text-brand-800 transition-colors">
              Saved Pets
            </span>
          </div>
        </Link>

        {/* Pending Requests */}
        <Link
          to="/adopter/requests"
          className="p-5 rounded-3xl bg-surface border border-brand-200/80 shadow-card hover:shadow-card-hover transition-all group flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-display font-extrabold text-brand-950 block">
              {pendingCount}
            </span>
            <span className="text-xs font-semibold text-brand-muted group-hover:text-brand-800 transition-colors">
              Pending Requests
            </span>
          </div>
        </Link>

        {/* Approved / Active Trials */}
        <Link
          to="/adopter/requests"
          className="p-5 rounded-3xl bg-surface border border-brand-200/80 shadow-card hover:shadow-card-hover transition-all group flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-display font-extrabold text-brand-950 block">
              {approvedCount}
            </span>
            <span className="text-xs font-semibold text-brand-muted group-hover:text-brand-800 transition-colors">
              Approved Trials
            </span>
          </div>
        </Link>

        {/* Adopted Pets */}
        <Link
          to="/adopter/adoptions"
          className="p-5 rounded-3xl bg-surface border border-brand-200/80 shadow-card hover:shadow-card-hover transition-all group flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-2xl bg-brand-100 text-brand-800 flex items-center justify-center mb-3">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-display font-extrabold text-brand-950 block">
              {completedCount}
            </span>
            <span className="text-xs font-semibold text-brand-muted group-hover:text-brand-800 transition-colors">
              Adopted Companions
            </span>
          </div>
        </Link>

        {/* Notifications */}
        <Link
          to="/adopter/notifications"
          className="p-5 rounded-3xl bg-surface border border-brand-200/80 shadow-card hover:shadow-card-hover transition-all group flex flex-col justify-between col-span-2 lg:col-span-1"
        >
          <div className="w-10 h-10 rounded-2xl bg-brand-100 text-brand-800 flex items-center justify-center mb-3">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-display font-extrabold text-brand-950 block">
              Recent
            </span>
            <span className="text-xs font-semibold text-brand-muted group-hover:text-brand-800 transition-colors">
              Notification Inbox
            </span>
          </div>
        </Link>
      </div>

      {/* Active Foster Trial Banner & Journey Stepper */}
      {activeTrialRequest && (
        <div className="space-y-6">
          <AdoptionJourneyStepper
            petName={activeTrialRequest.petName}
            currentStep={activeTrialRequest.status === 'Completed' ? 6 : 5}
          />
          <FosterTrialCard request={activeTrialRequest} onUpdate={loadData} />
        </div>
      )}

      {/* Two Column Layout: Recent Requests & Recently Saved */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Requests */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-brand-950">
              Recent Adoption Applications
            </h3>
            <Link to="/adopter/requests" className="text-xs font-bold text-brand-700 hover:text-brand-950">
              View All ({requests.length}) →
            </Link>
          </div>

          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="p-8 rounded-3xl bg-surface border border-brand-200 text-center space-y-3">
                <p className="text-xs text-brand-muted">No adoption requests sent yet.</p>
                <Link to="/pets">
                  <Button variant="primary" size="sm">
                    Discover Pets to Adopt
                  </Button>
                </Link>
              </div>
            ) : (
              requests.slice(0, 3).map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-3xl bg-surface border border-brand-200/80 shadow-card hover:shadow-card-hover transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={req.petImage}
                      alt={req.petName}
                      className="w-14 h-14 rounded-2xl object-cover border border-brand-200 shrink-0"
                    />
                    <div>
                      <h4 className="font-display font-bold text-base text-brand-950">
                        {req.petName}
                      </h4>
                      <p className="text-xs text-brand-muted">{req.petBreed} • Provider: {req.providerName}</p>
                      <span className="text-[10px] text-brand-400">
                        Submitted: {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <StatusBadge status={req.status} size="sm" />
                    <Link to={`/adopter/requests/${req.id}`}>
                      <Button variant="outline" size="sm">
                        Track Status
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recently Saved Pets */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-brand-950">
              Saved Pets
            </h3>
            <Link to="/adopter/favorites" className="text-xs font-bold text-brand-700 hover:text-brand-950">
              View Favorites ({savedPets.length}) →
            </Link>
          </div>

          <div className="space-y-3">
            {savedPets.length === 0 ? (
              <div className="p-8 rounded-3xl bg-surface border border-brand-200 text-center space-y-3">
                <p className="text-xs text-brand-muted">You haven't saved any pets yet.</p>
                <Link to="/pets">
                  <Button variant="outline" size="sm">
                    Browse Pets
                  </Button>
                </Link>
              </div>
            ) : (
              savedPets.slice(0, 3).map((pet) => (
                <div
                  key={pet.id}
                  className="p-3 rounded-2xl bg-surface border border-brand-200/80 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={pet.images[0]}
                      alt={pet.name}
                      className="w-12 h-12 rounded-xl object-cover border border-brand-200 shrink-0"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-brand-950">{pet.name}</h4>
                      <p className="text-[11px] text-brand-muted">{pet.breed} • {pet.location}</p>
                    </div>
                  </div>
                  <Link to={`/pets/${pet.id}`}>
                    <Button variant="cream" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recommended Pets For You */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-xl font-bold text-brand-950">
              Recommended For Your Lifestyle
            </h3>
            <p className="text-xs text-brand-muted">
              Matches your active schedule & apartment-friendly preferences
            </p>
          </div>
          <Link to="/pets">
            <Button variant="outline" size="sm">
              See All Available
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {recommendedPets.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      </div>
    </div>
  );
};
