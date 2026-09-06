import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { petService } from '../../services/petService';
import { adminService } from '../../services/adminService';
import { Pet } from '../../types/pet';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Eye, Search, PauseCircle, PlayCircle, Archive, RefreshCw, AlertCircle, ShieldAlert } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { useToast } from '../../contexts/ToastContext';

export const AdminPetsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramStatus = searchParams.get('status');
  const validStatuses = ['available', 'trial', 'adopted', 'paused'];
  const initialStatus = paramStatus && validStatuses.includes(paramStatus.toLowerCase()) ? paramStatus.toLowerCase() : 'all';

  const [pets, setPets] = useState<Pet[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [targetStatus, setTargetStatus] = useState<'available' | 'paused' | 'archived' | null>(null);
  const [moderationReason, setModerationReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const isLive = adminService.isLiveRealMode();

  useEffect(() => {
    const s = searchParams.get('status');
    if (s && validStatuses.includes(s.toLowerCase())) {
      setStatusFilter(s.toLowerCase());
    } else if (!s) {
      setStatusFilter('all');
    }
  }, [searchParams]);

  const loadPets = async () => {
    setIsLoading(true);
    try {
      const data = await petService.getAllPets();
      setPets(data);
    } catch (err) {
      console.warn('Error loading pets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPets();
  }, []);

  const handleStatusFilterChange = (s: string) => {
    setStatusFilter(s);
    if (s === 'all') {
      searchParams.delete('status');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ ...Object.fromEntries(searchParams.entries()), status: s });
    }
  };

  const handleOpenModeration = (pet: Pet, status: 'available' | 'paused' | 'archived') => {
    setSelectedPet(pet);
    setTargetStatus(status);
    setModerationReason('');
  };

  const handleConfirmModeration = async () => {
    if (!selectedPet || !targetStatus) return;

    setIsSubmitting(true);
    try {
      const res = await adminService.moderatePet(selectedPet.id, targetStatus, moderationReason);
      if (res.success) {
        showToast(`Pet ${selectedPet.name} status updated to ${targetStatus}.`, 'success');
        setSelectedPet(null);
        setTargetStatus(null);
        await loadPets();
      } else {
        showToast(res.error || 'Failed to moderate pet status.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error executing pet moderation.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPets = pets.filter((pet) => {
    const matchesSearch = !search ||
      pet.name.toLowerCase().includes(search.toLowerCase()) ||
      pet.breed.toLowerCase().includes(search.toLowerCase()) ||
      pet.location.toLowerCase().includes(search.toLowerCase()) ||
      pet.provider.name.toLowerCase().includes(search.toLowerCase());

    let matchesStatus = true;
    if (statusFilter !== 'all') {
      matchesStatus = pet.status.toLowerCase() === statusFilter.toLowerCase();
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl font-bold text-brand-950">Platform-Wide Pet Listings</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Verified Companion Registry
            </span>
          </div>
          <p className="text-xs text-brand-muted">
            Total active, pending, and adopted listings across the ecosystem with safety moderation controls.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center bg-brand-100/60 p-1 rounded-2xl border border-brand-200 text-xs">
            {(['all', 'available', 'trial', 'adopted', 'paused'] as const).map((s) => (
              <button
                key={s}
                onClick={() => handleStatusFilterChange(s)}
                className={`px-3 py-1 rounded-xl font-semibold capitalize transition-all cursor-pointer ${
                  statusFilter === s
                    ? 'bg-surface text-brand-950 shadow-xs'
                    : 'text-brand-600 hover:text-brand-900'
                }`}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companion..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl border border-brand-200 text-xs text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface"
            />
          </div>

          <button
            onClick={loadPets}
            disabled={isLoading}
            className="p-2 rounded-2xl border border-brand-200 hover:bg-brand-50 text-brand-700 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-3xl border border-brand-200/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-50 border-b border-brand-200 text-brand-800 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-6">Companion</th>
                <th className="py-3.5 px-4">Breed & Location</th>
                <th className="py-3.5 px-4">Provider</th>
                <th className="py-3.5 px-4">Adoption Status</th>
                <th className="py-3.5 px-6 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-brand-400 font-medium">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
                    Loading companion listings...
                  </td>
                </tr>
              ) : filteredPets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-brand-400 font-medium">
                    No companion listings found matching filters.
                  </td>
                </tr>
              ) : (
                filteredPets.map((pet) => {
                  const s = pet.status.toLowerCase();
                  const isAvailable = s === 'available';
                  const isPaused = s === 'paused';
                  const isTrial = s === 'trial' || s === 'adoption pending';
                  const isAdopted = s === 'adopted';

                  return (
                    <tr key={pet.id} className="hover:bg-brand-50/40 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={pet.images[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=200'}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover"
                          />
                          <div>
                            <span className="font-bold text-sm text-brand-950 block">{pet.name}</span>
                            <span className="text-[10px] text-brand-400 font-mono">#{pet.id.slice(-6)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-brand-800">
                        {pet.breed} • <span className="text-brand-600">{pet.location}</span>
                      </td>
                      <td className="py-3.5 px-4 text-brand-600 font-medium">{pet.provider.name}</td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={pet.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            to={`/pets/${pet.id}`}
                            className="text-brand-700 hover:text-brand-950 font-bold hover:underline inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </Link>

                          {/* Moderation Controls */}
                          {isAvailable && (
                            <button
                              onClick={() => handleOpenModeration(pet, 'paused')}
                              className="text-[11px] font-bold text-amber-700 hover:text-amber-900 px-2 py-1 rounded-lg hover:bg-amber-50 inline-flex items-center gap-1"
                              title="Pause listing visibility"
                            >
                              <PauseCircle className="w-3.5 h-3.5" />
                              <span>Pause</span>
                            </button>
                          )}

                          {isPaused && (
                            <>
                              <button
                                onClick={() => handleOpenModeration(pet, 'available')}
                                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 px-2 py-1 rounded-lg hover:bg-emerald-50 inline-flex items-center gap-1"
                                title="Resume public visibility"
                              >
                                <PlayCircle className="w-3.5 h-3.5" />
                                <span>Resume</span>
                              </button>
                              <button
                                onClick={() => handleOpenModeration(pet, 'archived')}
                                className="text-[11px] font-bold text-zinc-600 hover:text-zinc-900 px-2 py-1 rounded-lg hover:bg-zinc-100 inline-flex items-center gap-1"
                                title="Archive listing"
                              >
                                <Archive className="w-3.5 h-3.5" />
                                <span>Archive</span>
                              </button>
                            </>
                          )}

                          {(isTrial || isAdopted) && (
                            <span className="text-[10px] font-medium text-brand-400 italic">
                              {isTrial ? 'Bonding in trial' : 'Forever home'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Moderation Modal */}
      {selectedPet && targetStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface rounded-3xl border border-brand-200 max-w-md w-full p-6 shadow-2xl space-y-5 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-brand-950">
                  Moderate Companion Listing
                </h3>
                <p className="text-xs text-brand-muted">
                  Update public listing availability
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-brand-50 border border-brand-200 text-xs space-y-1">
              <p className="font-bold text-brand-950">{selectedPet.name} ({selectedPet.breed})</p>
              <p className="text-brand-600">Provider: {selectedPet.provider.name} • Status: {selectedPet.status}</p>
              <p className="text-brand-800 font-semibold pt-1">
                Target Status: <span className="uppercase text-amber-900">{targetStatus}</span>
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-900 block">
                Moderation Reason (Optional)
              </label>
              <textarea
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                placeholder="e.g. Welfare review pending, temporary pause requested by provider, etc."
                rows={2}
                className="w-full p-3 rounded-2xl border border-brand-200 text-xs text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedPet(null);
                  setTargetStatus(null);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmModeration}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Confirm Moderation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
