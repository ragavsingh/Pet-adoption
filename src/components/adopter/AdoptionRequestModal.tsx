import React, { useState } from 'react';
import { Pet } from '../../types/pet';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { adoptionService } from '../../services/adoptionService';
import { ShieldCheck, HeartHandshake, CheckCircle2, UserCheck, Home, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { resolveUserAvatar } from '../../utils/avatarUtils';

interface AdoptionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  pet: Pet;
  onRequestSubmitted?: (requestId: string) => void;
}

export const AdoptionRequestModal: React.FC<AdoptionRequestModalProps> = ({
  isOpen,
  onClose,
  pet,
  onRequestSubmitted,
}) => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const adopterProfile = user?.adopterProfile;

  const [message, setMessage] = useState(
    `Hello ${pet.provider.name}! I am very interested in adopting ${pet.name}. I have reviewed ${pet.name}'s personality and daily routine and believe our home would provide the loving forever sanctuary ${pet.name} deserves.`
  );
  const [homeType, setHomeType] = useState<string>(adopterProfile?.homeType || 'Apartment');
  const [existingPets, setExistingPets] = useState<string>(adopterProfile?.existingPets || 'None');
  const [children, setChildren] = useState<string>(adopterProfile?.children || 'None');
  const [petExperience, setPetExperience] = useState<string>(adopterProfile?.petExperience || 'Lifelong pet owner');
  const [timeAvailable, setTimeAvailable] = useState(adopterProfile?.timeAway ? `Home daily (${adopterProfile.timeAway} away)` : '4-6 hours daily for walking and bonding');
  const [whyTheyWantToAdopt, setWhyTheyWantToAdopt] = useState(adopterProfile?.whyTheyWantToAdopt || 'Looking for an active, loyal family companion.');
  const [confirmedAccurate, setConfirmedAccurate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmedAccurate) return;

    // Strict authentication gate: guests can NEVER submit adoption applications
    if (!isAuthenticated || !user) {
      showToast('Please sign in with an adopter account to submit an adoption request.', 'error');
      onClose();
      navigate('/login', { state: { from: `/pets/${pet.id}` } });
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await adoptionService.createRequest({
        petId: pet.id,
        petName: pet.name,
        petBreed: pet.breed,
        petImage: pet.images[0],
        providerId: pet.provider.id,
        providerName: pet.provider.name,
        providerLocation: pet.location,
        adopterId: user.id,
        adopterName: user.name,
        adopterEmail: user.email,
        adopterPhone: adopterProfile?.phone || (user as any).phone || '',
        adopterLocation: adopterProfile?.location || (user as any).city || pet.location,
        adopterAvatar: resolveUserAvatar(user),
        message,
        homeType,
        existingPets,
        children,
        petExperience,
        timeAvailable,
        whyTheyWantToAdopt,
        confirmedAccurate,
      });

      setIsSubmitting(false);
      setSubmittedSuccess(true);
      showToast(`Your adoption request for ${pet.name} was sent.`, 'success');

      if (onRequestSubmitted) {
        onRequestSubmitted(created.id);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      const errorMessage = err?.message || 'Could not submit request. Please try again.';
      showToast(errorMessage, 'error');
    }
  };

  const handleFinish = () => {
    setSubmittedSuccess(false);
    onClose();
    navigate('/adopter/requests');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={submittedSuccess ? "Request Submitted Successfully!" : `Request to Adopt ${pet.name}`}
      description={
        submittedSuccess
          ? `${pet.provider.name} has been notified and will review your profile shortly.`
          : `You are taking the first step to welcoming ${pet.name} into your home through our Foster-to-Own model.`
      }
      maxWidth="2xl"
    >
      {submittedSuccess ? (
        <div className="py-8 text-center space-y-5 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h4 className="font-display text-2xl font-bold text-brand-900">
              Adoption Request Sent to {pet.provider.name}
            </h4>
            <p className="text-sm text-brand-muted max-w-md mx-auto">
              You can track status updates, provider notes, and trial scheduling in real-time from your Adopter Dashboard.
            </p>
          </div>

          <div className="p-4 bg-brand-50 rounded-2xl border border-brand-200/80 max-w-md mx-auto flex items-center gap-3 text-left">
            <img
              src={pet.images[0]}
              alt={pet.name}
              className="w-12 h-12 rounded-xl object-cover border border-brand-200"
            />
            <div>
              <p className="text-sm font-bold text-brand-900">{pet.name}</p>
              <p className="text-xs text-brand-muted">{pet.breed} • {pet.location}</p>
              <span className="inline-block mt-0.5 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.2 rounded-full">
                Status: Pending Review
              </span>
            </div>
          </div>

          <div className="pt-4 flex justify-center gap-3">
            <Button variant="primary" size="md" onClick={handleFinish}>
              Track My Adoption Requests
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          {/* Pet & Provider Summary banner */}
          <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src={pet.images[0]}
                alt={pet.name}
                className="w-14 h-14 rounded-2xl object-cover border border-brand-200 shrink-0"
              />
              <div>
                <h4 className="font-display font-bold text-base text-brand-900">
                  {pet.name} ({pet.breed})
                </h4>
                <p className="text-xs text-brand-muted">
                  {pet.gender} • {pet.age} • {pet.location}
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-brand-700">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Provider: {pet.provider.name}</span>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="text-[11px] font-extrabold uppercase text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                Foster-to-Own Eligible
              </span>
            </div>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Home Type */}
            <div>
              <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5">
                Home Type
              </label>
              <select
                value={homeType}
                onChange={(e) => setHomeType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-brand-200 bg-surface text-xs font-semibold text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="Apartment (1-2 BHK)">Apartment (1-2 BHK)</option>
                <option value="Spacious Apartment (3+ BHK)">Spacious Apartment (3+ BHK)</option>
                <option value="Independent House with Yard">Independent House with Yard</option>
                <option value="Villa / Farmhouse">Villa / Farmhouse</option>
              </select>
            </div>

            {/* Existing Pets */}
            <div>
              <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5">
                Existing Pets in Household
              </label>
              <select
                value={existingPets}
                onChange={(e) => setExistingPets(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-brand-200 bg-surface text-xs font-semibold text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="None">None (Only this pet)</option>
                <option value="One friendly dog">One friendly dog</option>
                <option value="Multiple dogs">Multiple dogs</option>
                <option value="One or more cats">One or more cats</option>
                <option value="Other small pets">Other small pets</option>
              </select>
            </div>

            {/* Children */}
            <div>
              <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5">
                Children in Home
              </label>
              <select
                value={children}
                onChange={(e) => setChildren(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-brand-200 bg-surface text-xs font-semibold text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="None">No children</option>
                <option value="Young children (<6 yrs)">Young children (&lt;6 yrs)</option>
                <option value="Older children (6-12 yrs)">Older children (6-12 yrs)</option>
                <option value="Teens (13+ yrs)">Teens (13+ yrs)</option>
              </select>
            </div>

            {/* Pet Experience */}
            <div>
              <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5">
                Prior Pet Experience
              </label>
              <select
                value={petExperience}
                onChange={(e) => setPetExperience(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-brand-200 bg-surface text-xs font-semibold text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="Lifelong pet owner">Lifelong pet owner</option>
                <option value="Moderate experience">Moderate experience</option>
                <option value="First-time pet parent">First-time pet parent (eager to learn)</option>
              </select>
            </div>
          </div>

          {/* Time Available & Daily Schedule */}
          <div>
            <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5">
              Time Available for Exercise & Care Daily
            </label>
            <input
              type="text"
              required
              value={timeAvailable}
              onChange={(e) => setTimeAvailable(e.target.value)}
              placeholder="e.g. Work hybrid 3 days/wk, free all mornings & weekends..."
              className="w-full px-4 py-2.5 rounded-2xl border border-brand-200 bg-surface text-xs font-medium text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Why They Want To Adopt */}
          <div>
            <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5">
              Why do you want to adopt {pet.name}?
            </label>
            <input
              type="text"
              required
              value={whyTheyWantToAdopt}
              onChange={(e) => setWhyTheyWantToAdopt(e.target.value)}
              placeholder="Describe your motivation and what makes your home special..."
              className="w-full px-4 py-2.5 rounded-2xl border border-brand-200 bg-surface text-xs font-medium text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Personal Message */}
          <div>
            <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5">
              Personal Message to {pet.provider.name} <span className="text-brand-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-brand-200 bg-surface text-xs font-medium text-brand-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Mandatory Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-brand-50/80 border border-brand-200 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={confirmedAccurate}
                onChange={(e) => setConfirmedAccurate(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-brand-700 focus:ring-brand-500 border-brand-300"
              />
              <span className="text-xs font-semibold text-brand-900 leading-snug">
                I confirm that the information in my profile is accurate. I understand pets are not products and commit to a responsible adoption process.
              </span>
            </label>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-100">
            <Button type="button" variant="outline" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              disabled={!confirmedAccurate}
              leftIcon={<HeartHandshake className="w-4 h-4" />}
            >
              Send Adoption Request
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
