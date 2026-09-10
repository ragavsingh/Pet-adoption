import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { petService } from '../../services/petService';
import { Pet, PetStatus } from '../../types/pet';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  PlusCircle,
  Eye,
  Edit2,
  PauseCircle,
  PlayCircle,
  Trash2,
  AlertTriangle,
  Dog,
} from 'lucide-react';

export const ProviderPetsPage: React.FC = () => {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [actionType, setActionType] = useState<'pause' | 'resume' | 'delete' | null>(null);
  const { showToast } = useToast();

  const providerId = user?.id || 'prv_sarah';

  const loadPets = async () => {
    setLoading(true);
    try {
      const list = await petService.getProviderPets(providerId);
      setPets(list);
    } catch (err) {
      console.warn('[ProviderPetsPage] Error loading listings:', err);
      showToast('Failed to load listings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPets();
  }, [providerId]);

  const openConfirmModal = (pet: Pet, action: 'pause' | 'resume' | 'delete') => {
    setSelectedPet(pet);
    setActionType(action);
  };

  const closeConfirmModal = () => {
    setSelectedPet(null);
    setActionType(null);
  };

  const handleConfirmAction = async () => {
    if (!selectedPet || !actionType) return;

    try {
      if (actionType === 'pause') {
        await petService.updatePetStatus(selectedPet.id, 'Paused');
        showToast(`Listing for ${selectedPet.name} paused.`, 'info');
      } else if (actionType === 'resume') {
        await petService.updatePetStatus(selectedPet.id, 'Available');
        showToast(`Listing for ${selectedPet.name} resumed and is now public!`, 'success');
      } else if (actionType === 'delete') {
        await petService.deletePet(selectedPet.id);
        showToast(`Listing for ${selectedPet.name} deleted.`, 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Action failed. You may not have permission to modify this listing.', 'error');
    }

    closeConfirmModal();
    loadPets();
  };

  return (
    <div className="space-y-8 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-widest bg-brand-100 px-3.5 py-1 rounded-full">
            Listings Management
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-brand-950 mt-2">
            My Listed Pets
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted mt-1">
            Manage your shelter listings, pause applications, or add new rescue companions.
          </p>
        </div>

        <Link to="/provider/pets/new">
          <Button variant="primary" size="md" leftIcon={<PlusCircle className="w-4 h-4" />}>
            List New Pet
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-brand-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : pets.length === 0 ? (
        <div className="bg-surface rounded-3xl border border-brand-200 p-12 text-center max-w-md mx-auto space-y-4">
          <Dog className="w-12 h-12 text-brand-400 mx-auto" />
          <h3 className="font-display text-xl font-bold text-brand-950">No pets listed yet</h3>
          <p className="text-xs text-brand-muted">
            Click below to launch the 8-step Add Pet Wizard.
          </p>
          <Link to="/provider/pets/new">
            <Button variant="primary" size="md">
              Create Listing
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mobile Card Layout (Strictly optimized for phone screens) */}
          <div className="block md:hidden space-y-4">
            {pets.map((pet) => (
              <div
                key={pet.id}
                className="bg-surface rounded-3xl border border-brand-200/80 p-5 shadow-card space-y-4"
              >
                {/* Header: Photo, Name, Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={pet.images[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400'}
                      alt={pet.name}
                      className="w-16 h-16 rounded-2xl object-cover border border-brand-200 shrink-0"
                    />
                    <div>
                      <h3 className="font-bold text-base text-brand-950">{pet.name}</h3>
                      <p className="text-xs font-semibold text-brand-700">{pet.breed}</p>
                      <p className="text-[11px] text-brand-muted">
                        {pet.species} • {pet.gender} • {pet.age}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={pet.status} size="sm" />
                </div>

                {/* Meta info */}
                <div className="flex items-center justify-between text-[11px] text-brand-muted pt-1 border-t border-brand-100">
                  <span>Listed on {new Date(pet.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="font-medium text-brand-700">{pet.size}</span>
                </div>

                {/* Action Buttons for Mobile Phone */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  <Link
                    to={`/pets/${pet.id}`}
                    className="flex flex-col items-center justify-center py-2 px-1 rounded-2xl bg-brand-50 hover:bg-brand-100 text-brand-800 text-[10px] font-bold border border-brand-200/60 transition-colors"
                    title="View Public Profile"
                  >
                    <Eye className="w-4 h-4 mb-0.5 text-brand-700" />
                    <span>View</span>
                  </Link>

                  <Link
                    to={`/provider/pets/${pet.id}/edit`}
                    className="flex flex-col items-center justify-center py-2 px-1 rounded-2xl bg-brand-50 hover:bg-brand-100 text-brand-800 text-[10px] font-bold border border-brand-200/60 transition-colors"
                    title="Edit Listing"
                  >
                    <Edit2 className="w-4 h-4 mb-0.5 text-brand-700" />
                    <span>Edit</span>
                  </Link>

                  {pet.status === 'Available' ? (
                    <button
                      type="button"
                      onClick={() => openConfirmModal(pet, 'pause')}
                      className="flex flex-col items-center justify-center py-2 px-1 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200/60 transition-colors"
                      title="Pause Listing"
                    >
                      <PauseCircle className="w-4 h-4 mb-0.5 text-amber-700" />
                      <span>Pause</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openConfirmModal(pet, 'resume')}
                      className="flex flex-col items-center justify-center py-2 px-1 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200/60 transition-colors"
                      title="Resume Listing"
                    >
                      <PlayCircle className="w-4 h-4 mb-0.5 text-emerald-700" />
                      <span>Resume</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => openConfirmModal(pet, 'delete')}
                    className="flex flex-col items-center justify-center py-2 px-1 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold border border-rose-200/80 transition-colors"
                    title="Delete Listing"
                  >
                    <Trash2 className="w-4 h-4 mb-0.5 text-rose-600" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (Hidden on mobile phones) */}
          <div className="hidden md:block bg-surface rounded-3xl border border-brand-200/80 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-brand-50/80 border-b border-brand-200/80 text-brand-800 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-4 px-6">Pet Companion</th>
                    <th className="py-4 px-4">Species & Breed</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4">Date Listed</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-100">
                  {pets.map((pet) => (
                    <tr key={pet.id} className="hover:bg-brand-50/40 transition-colors">
                      {/* Pet Image & Name */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={pet.images[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400'}
                            alt={pet.name}
                            className="w-12 h-12 rounded-2xl object-cover border border-brand-200 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-sm text-brand-950">{pet.name}</p>
                            <p className="text-brand-muted text-[11px]">{pet.gender} • {pet.age}</p>
                          </div>
                        </div>
                      </td>

                      {/* Species & Breed */}
                      <td className="py-4 px-4 font-semibold text-brand-800">
                        {pet.breed}
                        <span className="block text-[11px] text-brand-400 font-normal">
                          {pet.species} ({pet.size})
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <StatusBadge status={pet.status} size="sm" />
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 text-brand-muted font-medium">
                        {new Date(pet.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/pets/${pet.id}`}
                            className="p-2 rounded-xl text-brand-700 hover:bg-brand-100 transition-colors"
                            title="View Public Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <Link
                            to={`/provider/pets/${pet.id}/edit`}
                            className="p-2 rounded-xl text-brand-700 hover:bg-brand-100 transition-colors"
                            title="Edit Listing"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>

                          {pet.status === 'Available' ? (
                            <button
                              type="button"
                              onClick={() => openConfirmModal(pet, 'pause')}
                              className="p-2 rounded-xl text-amber-700 hover:bg-amber-50 transition-colors"
                              title="Pause Listing"
                            >
                              <PauseCircle className="w-4 h-4" />
                            </button>
                          ) : pet.status === 'Paused' ? (
                            <button
                              type="button"
                              onClick={() => openConfirmModal(pet, 'resume')}
                              className="p-2 rounded-xl text-emerald-700 hover:bg-emerald-50 transition-colors"
                              title="Resume Listing"
                            >
                              <PlayCircle className="w-4 h-4" />
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => openConfirmModal(pet, 'delete')}
                            className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Listing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal (Section 19) */}
      <Modal
        isOpen={!!selectedPet && !!actionType}
        onClose={closeConfirmModal}
        title={
          actionType === 'pause'
            ? `Pause Listing for ${selectedPet?.name}?`
            : actionType === 'resume'
            ? `Resume Listing for ${selectedPet?.name}?`
            : `Delete Listing for ${selectedPet?.name}?`
        }
        maxWidth="md"
      >
        <div className="space-y-4 text-left">
          <p className="text-xs text-brand-muted leading-relaxed">
            {actionType === 'pause' &&
              `Pausing will temporarily hide ${selectedPet?.name} from public discovery while existing applicants are screened.`}
            {actionType === 'resume' &&
              `Resuming will make ${selectedPet?.name} immediately visible again to prospective adopters.`}
            {actionType === 'delete' &&
              `Are you sure you want to permanently delete ${selectedPet?.name}'s listing? This will remove the companion from public adoption discovery and your listed pets.`}
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-100">
            <Button variant="outline" size="sm" onClick={closeConfirmModal}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'delete' ? 'danger' : 'primary'}
              size="sm"
              onClick={handleConfirmAction}
            >
              {actionType === 'delete' ? 'Delete Listing' : `Confirm ${actionType ? actionType.toUpperCase() : ''}`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
