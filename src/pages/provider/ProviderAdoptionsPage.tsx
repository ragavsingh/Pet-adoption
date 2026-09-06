import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { adoptionService } from '../../services/adoptionService';
import { adoptionCompletionService } from '../../services/adoptionCompletionService';
import { AdoptionRequest } from '../../types/adoptionRequest';
import { Button } from '../../components/common/Button';
import { calculateTrialCountdown } from '../../components/common/TrialCountdown';
import { Award, Heart, CheckCircle2 } from 'lucide-react';

export const ProviderAdoptionsPage: React.FC = () => {
  const { user } = useAuth();
  const [adoptions, setAdoptions] = useState<AdoptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const providerId = user?.id || 'prv_sarah';

  useEffect(() => {
    setLoading(true);
    Promise.all([
      adoptionService.getRequestsForUser(providerId, 'provider'),
      adoptionCompletionService.getCompletedAdoptions(providerId, 'provider'),
    ]).then(([reqs, realAdps]) => {
      // Strictly include only completed adoptions
      const list = reqs.filter((r) => r.status === 'Completed');
      const combined = [...list];

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
  }, [providerId]);

  return (
    <div className="space-y-8 text-left">
      <div>
        <span className="text-xs font-bold text-brand-600 uppercase tracking-widest bg-brand-100 px-3.5 py-1 rounded-full">
          Milestones
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-brand-950 mt-2">
          Successful Completed Adoptions
        </h1>
        <p className="text-xs sm:text-sm text-brand-muted mt-1">
          Officially finalized adoptions and certificates for pets placed from your rescue program.
        </p>
      </div>

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
            Once an adopter completes their Foster-to-Own trial and signs the official adoption pledge, their certificate and milestone will appear here.
          </p>
          <div className="pt-2">
            <Link to="/provider/requests">
              <Button variant="primary" size="md">
                Manage Trial & Requests
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adoptions.map((adp) => (
          <div
            key={adp.id}
            className="bg-surface rounded-3xl border border-brand-200/80 p-6 sm:p-8 shadow-card flex flex-col justify-between space-y-5"
          >
            <div className="flex items-start gap-4">
              <img
                src={adp.petImage}
                alt={adp.petName}
                className="w-18 h-18 rounded-2xl object-cover border border-brand-200 shrink-0"
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-2xl font-bold text-brand-950">{adp.petName}</h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      adp.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {adp.status === 'Completed' ? 'Officially Adopted ❤️' : 'Trial In Progress'}
                  </span>
                </div>
                <p className="text-xs text-brand-muted">{adp.petBreed}</p>
                <p className="text-xs text-brand-700 font-semibold">
                  Adopter: {adp.adopterName} ({adp.adopterLocation})
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-brand-50 border border-brand-100 text-xs text-brand-800">
              <div className="flex items-center justify-between">
                <span>Foster-to-Own Status:</span>
                <strong className="font-bold">
                  {adp.status === 'Completed'
                    ? '14 Days Completed — Family Formed'
                    : adp.trial
                    ? `Day ${calculateTrialCountdown(adp.trial.startDate, adp.trial.endDate).currentDay} of ${
                        calculateTrialCountdown(adp.trial.startDate, adp.trial.endDate).totalDays
                      } — Active Bonding Period`
                    : '14-Day Foster Trial In Progress'}
                </strong>
              </div>
            </div>

            <div className="pt-2">
              {adp.status === 'Completed' ? (
                <Link to={`/adoption-success/${adp.petId}`}>
                  <Button variant="outline" size="sm" className="w-full" leftIcon={<Award className="w-4 h-4" />}>
                    View Official Adoption Certificate
                  </Button>
                </Link>
              ) : (
                <Link to={`/provider/requests`}>
                  <Button variant="primary" size="sm" className="w-full" leftIcon={<Heart className="w-4 h-4" />}>
                    Manage Trial & Applications
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};
