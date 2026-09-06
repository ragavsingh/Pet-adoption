import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { adoptionService } from '../../services/adoptionService';
import { adoptionCompletionService } from '../../services/adoptionCompletionService';
import { AdoptionRequest } from '../../types/adoptionRequest';
import { Button } from '../../components/common/Button';
import { Award, Heart, Sparkles, Calendar, ArrowRight } from 'lucide-react';

export const AdopterAdoptionsPage: React.FC = () => {
  const { user } = useAuth();
  const [adoptions, setAdoptions] = useState<AdoptionRequest[]>([]);
  const [hasActiveTrials, setHasActiveTrials] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setAdoptions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      adoptionService.getRequestsForUser(user.id, 'adopter'),
      adoptionCompletionService.getCompletedAdoptions(user.id, 'adopter'),
    ]).then(([reqs, realAdps]) => {
      // Check if user has any active Foster-to-Own trials
      const activeTrials = reqs.filter((r) => r.status === 'Approved');
      setHasActiveTrials(activeTrials.length > 0);

      // Strictly include only completed adoptions (exclude pets on active trial)
      const completedReqs = reqs.filter((r) => r.status === 'Completed');
      const combined = [...completedReqs];

      for (const realAdp of realAdps) {
        if (!combined.some((c) => c.petId === realAdp.petId)) {
          combined.push({
            id: realAdp.id,
            petId: realAdp.petId,
            petName: realAdp.petName || 'Pet',
            petBreed: realAdp.petBreed || 'Companion',
            petImage: realAdp.petImage || '',
            providerId: realAdp.providerId,
            providerName: realAdp.providerName || 'Provider',
            providerLocation: realAdp.providerLocation || '',
            adopterId: realAdp.adopterId,
            adopterName: realAdp.adopterName || 'Adopter',
            adopterEmail: '',
            adopterPhone: '',
            adopterLocation: '',
            adopterAvatar: '',
            message: '',
            homeType: '',
            existingPets: '',
            children: '',
            petExperience: '',
            timeAvailable: '',
            whyTheyWantToAdopt: '',
            confirmedAccurate: true,
            status: 'Completed',
            createdAt: realAdp.createdAt,
            updatedAt: realAdp.updatedAt,
            timeline: [],
          });
        }
      }

      setAdoptions(combined);
      setLoading(false);
    });
  }, [user]);

  return (
    <div className="space-y-8 text-left">
      <div>
        <span className="text-xs font-bold text-brand-600 uppercase tracking-widest bg-brand-100 px-3.5 py-1 rounded-full">
          Lifelong Companions
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-brand-950 mt-2">
          My Official Adoptions
        </h1>
        <p className="text-xs sm:text-sm text-brand-muted mt-1">
          Celebrated milestones and official adoption certificates for pets in your family.
        </p>
      </div>

      {hasActiveTrials && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50/90 border border-amber-200 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                You have a Foster-to-Own trial currently active!
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Official Adoption Certificates and family member awards are unlocked once the bonding trial is completed and made official.
              </p>
            </div>
          </div>
          <Link to="/adopter/requests" className="shrink-0 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs font-bold border-amber-300 text-amber-900 hover:bg-amber-100"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              View Active Trials
            </Button>
          </Link>
        </div>
      )}

      {loading ? (
        <div className="h-40 bg-brand-100 rounded-3xl animate-pulse" />
      ) : adoptions.length === 0 ? (
        <div className="bg-surface rounded-3xl border border-brand-200 p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center mx-auto">
            <Award className="w-7 h-7" />
          </div>
          <h3 className="font-display text-xl font-bold text-brand-950">
            No completed adoptions yet
          </h3>
          <p className="text-xs text-brand-muted">
            {hasActiveTrials
              ? 'Complete your active Foster-to-Own trial under My Requests to receive your official Certificate of Adoption!'
              : 'Complete a Foster-to-Own trial to receive your official Certificate of Adoption!'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {hasActiveTrials && (
              <Link to="/adopter/requests">
                <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  View Active Trials
                </Button>
              </Link>
            )}
            <Link to="/pets">
              <Button variant={hasActiveTrials ? 'outline' : 'primary'} size="md">
                Find Companions
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adoptions.map((adp) => (
            <div
              key={adp.id}
              className="bg-surface rounded-3xl border-2 border-brand-200 p-6 sm:p-8 shadow-card space-y-6 flex flex-col justify-between"
            >
              <div className="flex items-start gap-4">
                <img
                  src={adp.petImage}
                  alt={adp.petName}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-brand-300 shrink-0"
                />
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800">
                    Official Family Member ❤️
                  </span>
                  <h3 className="font-display text-2xl font-bold text-brand-950">
                    {adp.petName}
                  </h3>
                  <p className="text-xs text-brand-500 font-semibold">{adp.petBreed}</p>
                  <p className="text-[11px] text-brand-muted">
                    Provider: {adp.providerName}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-brand-50/80 border border-brand-100 text-xs space-y-2">
                <div className="flex items-center justify-between text-brand-800">
                  <span>Adoption Status:</span>
                  <strong className="font-bold text-brand-950">{adp.status}</strong>
                </div>
                <div className="flex items-center justify-between text-brand-800">
                  <span>Adoption Pledge:</span>
                  <strong className="font-bold text-emerald-700">Verified & Active</strong>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <Link to={`/adoption-success/${adp.petId}`} className="flex-1">
                  <Button variant="primary" size="md" className="w-full shadow-sm" leftIcon={<Award className="w-4 h-4" />}>
                    View Adoption Certificate
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
