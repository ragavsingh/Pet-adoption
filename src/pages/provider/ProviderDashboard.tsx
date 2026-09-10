import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { petService } from '../../services/petService';
import { adoptionService } from '../../services/adoptionService';
import { Pet } from '../../types/pet';
import { AdoptionRequest } from '../../types/adoptionRequest';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import {
  Dog,
  Inbox,
  Award,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  User,
  Heart,
  Eye,
  Sliders,
} from 'lucide-react';

export const ProviderDashboard: React.FC = () => {
  const { user } = useAuth();
  const [providerPets, setProviderPets] = useState<Pet[]>([]);
  const [requests, setRequests] = useState<AdoptionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const providerId = user?.id || 'prv_sarah';

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const pets = await petService.getProviderPets(providerId);
    setProviderPets(pets);
    const reqs = await adoptionService.getRequestsForUser(providerId, 'provider');
    setRequests(reqs);
    setLoading(false);
  };

  const activeListingsCount = providerPets.filter((p) => p.status === 'Available').length;
  const pendingRequestsCount = requests.filter((r) => r.status === 'Pending' || r.status === 'Under Review').length;
  const successfulAdoptionsCount = user?.providerProfile?.successfulAdoptionsCount ?? (user?.id === 'prv_sarah' ? 38 : 0);

  return (
    <div className="space-y-8 text-left">
      {/* Provider Greeting Banner (Section 18) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-brand-900 via-brand-800 to-brand-950 text-white shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-800/80 border border-brand-600 text-brand-200 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{user?.providerProfile?.verified ? 'Verified Pet Provider & Rescue Foster' : 'Pet Provider & Rescue Foster'}</span>
          </div>
          <h2 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight">
            Good evening, {user?.name ? user.name.split(' ')[0] : 'there'} 👋
          </h2>
          <p className="text-xs sm:text-sm text-brand-200 max-w-lg leading-relaxed">
            {pendingRequestsCount > 0
              ? `You have ${pendingRequestsCount} pending adoption application${pendingRequestsCount > 1 ? 's' : ''} awaiting screening.`
              : 'All incoming adoption applications are currently up to date.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link to="/provider/pets/new">
            <Button
              variant="secondary"
              size="md"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              className="shadow-md"
            >
              Add New Pet
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Statistics Cards (Section 18) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pets */}
        <Link
          to="/provider/pets"
          className="p-5 rounded-3xl bg-surface border border-brand-200/80 shadow-card hover:shadow-card-hover transition-all group flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-2xl bg-brand-100 text-brand-800 flex items-center justify-center mb-3">
            <Dog className="w-5 h-5" />
          </div>
          <div>
            <span className="text-3xl font-display font-extrabold text-brand-950 block">
              {providerPets.length}
            </span>
            <span className="text-xs font-semibold text-brand-muted group-hover:text-brand-800 transition-colors">
              My Pets
            </span>
          </div>
        </Link>

        {/* Active Listings */}
        <Link
          to="/provider/pets"
          className="p-5 rounded-3xl bg-surface border border-brand-200/80 shadow-card hover:shadow-card-hover transition-all group flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-3xl font-display font-extrabold text-brand-950 block">
              {activeListingsCount}
            </span>
            <span className="text-xs font-semibold text-brand-muted group-hover:text-brand-800 transition-colors">
              Active Listings
            </span>
          </div>
        </Link>

        {/* Pending Requests */}
        <Link
          to="/provider/requests"
          className="p-5 rounded-3xl bg-surface border border-brand-200/80 shadow-card hover:shadow-card-hover transition-all group flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-3xl font-display font-extrabold text-brand-950 block">
              {pendingRequestsCount}
            </span>
            <span className="text-xs font-semibold text-brand-muted group-hover:text-brand-800 transition-colors">
              Pending Requests
            </span>
          </div>
        </Link>

        {/* Successful Adoptions */}
        <Link
          to="/provider/adoptions"
          className="p-5 rounded-3xl bg-surface border border-brand-200/80 shadow-card hover:shadow-card-hover transition-all group flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-3xl font-display font-extrabold text-brand-950 block">
              {successfulAdoptionsCount}
            </span>
            <span className="text-xs font-semibold text-brand-muted group-hover:text-brand-800 transition-colors">
              Successful Adoptions
            </span>
          </div>
        </Link>
      </div>

      {/* Quick Actions (Section 18) */}
      <div className="bg-surface rounded-3xl p-6 border border-brand-200/80 shadow-card space-y-3">
        <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block">
          Quick Actions
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/provider/pets/new"
            className="p-3.5 rounded-2xl bg-brand-50 hover:bg-brand-100 border border-brand-200/70 text-brand-900 text-xs font-bold transition-all flex items-center gap-2.5"
          >
            <PlusCircle className="w-4 h-4 text-brand-700 shrink-0" />
            <span>Add Pet Listing</span>
          </Link>
          <Link
            to="/provider/requests"
            className="p-3.5 rounded-2xl bg-brand-50 hover:bg-brand-100 border border-brand-200/70 text-brand-900 text-xs font-bold transition-all flex items-center gap-2.5"
          >
            <Inbox className="w-4 h-4 text-brand-700 shrink-0" />
            <span>View Requests</span>
          </Link>
          <Link
            to="/provider/pets"
            className="p-3.5 rounded-2xl bg-brand-50 hover:bg-brand-100 border border-brand-200/70 text-brand-900 text-xs font-bold transition-all flex items-center gap-2.5"
          >
            <Dog className="w-4 h-4 text-brand-700 shrink-0" />
            <span>Manage Pets</span>
          </Link>
          <Link
            to="/provider/profile"
            className="p-3.5 rounded-2xl bg-brand-50 hover:bg-brand-100 border border-brand-200/70 text-brand-900 text-xs font-bold transition-all flex items-center gap-2.5"
          >
            <User className="w-4 h-4 text-brand-700 shrink-0" />
            <span>Edit Profile</span>
          </Link>
        </div>
      </div>

      {/* Incoming Requests & Active Listings Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Incoming Requests */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-brand-950">
              Pending Applications
            </h3>
            <Link to="/provider/requests" className="text-xs font-bold text-brand-700 hover:text-brand-950">
              View All ({requests.length}) →
            </Link>
          </div>

          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="p-8 rounded-3xl bg-surface border border-brand-200 text-center text-xs text-brand-muted">
                No incoming requests right now.
              </div>
            ) : (
              requests.slice(0, 3).map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-3xl bg-surface border border-brand-200/80 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={req.petImage}
                      alt={req.petName}
                      className="w-12 h-12 rounded-2xl object-cover border border-brand-200 shrink-0"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-brand-950">
                        {req.petName} — from {req.adopterName}
                      </h4>
                      <p className="text-xs text-brand-muted">{req.adopterLocation} • {req.homeType}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <StatusBadge status={req.status} size="sm" />
                    <Link to="/provider/requests">
                      <Button variant="outline" size="sm">
                        Review Application
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Pets Overview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-brand-950">
              My Current Listings
            </h3>
            <Link to="/provider/pets" className="text-xs font-bold text-brand-700 hover:text-brand-950">
              Manage All →
            </Link>
          </div>

          <div className="space-y-3">
            {providerPets.slice(0, 4).map((pet) => (
              <div
                key={pet.id}
                className="p-3.5 rounded-2xl bg-surface border border-brand-200/80 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={pet.images[0]}
                    alt={pet.name}
                    className="w-11 h-11 rounded-xl object-cover border border-brand-200 shrink-0"
                  />
                  <div>
                    <h4 className="font-bold text-xs text-brand-950">{pet.name}</h4>
                    <p className="text-[11px] text-brand-muted">{pet.breed}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={pet.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
