import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { petService } from '../services/petService';
import { adoptionCompletionService } from '../services/adoptionCompletionService';
import { adoptionService } from '../services/adoptionService';
import { Pet } from '../types/pet';
import { AdoptionRecord } from '../types/adoption';
import { AdoptionRequest } from '../types/adoptionRequest';
import { useAuth } from '../contexts/AuthContext';
import { AdoptionCertificate } from '../components/certificate/AdoptionCertificate';
import { Button } from '../components/common/Button';
import { calculateTrialCountdown } from '../components/common/TrialCountdown';
import { ArrowLeft, Home, Compass, Clock, Heart, Award, ArrowRight } from 'lucide-react';
import { useSmartBack } from '../hooks/useSmartBack';

export const AdoptionSuccessPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [pet, setPet] = useState<Pet | null>(null);
  const [adoptionRecord, setAdoptionRecord] = useState<AdoptionRecord | null>(null);
  const [matchingRequest, setMatchingRequest] = useState<AdoptionRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const handleBack = useSmartBack(id ? `/pets/${id}` : '/pets');

  useEffect(() => {
    let isMounted = true;
    const targetId = id || 'pet_bruno';

    async function loadData() {
      setLoading(true);
      try {
        const [p, adp] = await Promise.all([
          petService.getPetById(targetId),
          adoptionCompletionService.getAdoptionRecordByPetId(targetId),
        ]);

        let req: AdoptionRequest | null = null;
        try {
          if (user?.id) {
            const userReqs = await adoptionService.getRequestsForUser(user.id, 'adopter');
            req =
              userReqs.find(
                (r) =>
                  r.petId === targetId ||
                  r.id === targetId ||
                  (p?.name && r.petName.toLowerCase() === p.name.toLowerCase())
              ) || null;
          }
          if (!req) {
            req = await adoptionService.getRequestById(targetId);
          }
        } catch (e) {
          console.warn('[AdoptionSuccessPage] Error fetching matching request:', e);
        }

        if (isMounted) {
          setPet(p);
          setAdoptionRecord(adp);
          setMatchingRequest(req);
          setLoading(false);
        }
      } catch (err) {
        console.error('[AdoptionSuccessPage] Error loading data:', err);
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id, user]);

  if (loading) {
    return (
      <div className="py-24 text-center text-xs font-bold text-brand-600 animate-pulse">
        Verifying adoption status & loading certificate...
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="py-24 text-center space-y-4">
        <h2 className="font-display text-2xl font-bold">Pet profile not found</h2>
        <Link to="/pets">
          <Button variant="primary" size="md">
            Browse Pets
          </Button>
        </Link>
      </div>
    );
  }

  // Determine official completion status
  const isCompleted = Boolean(
    (adoptionRecord && (adoptionRecord.status === 'completed' || !adoptionRecord.status)) ||
    (matchingRequest && matchingRequest.status === 'Completed') ||
    (pet.status === 'Adopted' && (!matchingRequest || matchingRequest.status === 'Completed'))
  );

  // Determine if companion is currently on Foster-to-Own bonding trial
  const isOnTrial = Boolean(
    (matchingRequest && matchingRequest.status === 'Approved') ||
    (pet.status === 'Adoption Requested' || pet.status === 'Adoption Pending')
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      {/* Back navigation */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleBack}
            type="button"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-950 px-3 py-1.5 rounded-xl bg-brand-100/60 hover:bg-brand-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-brand-600" />
            <span>Back</span>
          </button>

          <Link
            to="/adopter/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-900 px-3 py-1.5 rounded-xl hover:bg-brand-50 transition-colors"
          >
            <span>Dashboard</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/pets">
            <Button variant="outline" size="sm" leftIcon={<Compass className="w-3.5 h-3.5" />}>
              Explore More Pets
            </Button>
          </Link>

          <Link to="/">
            <Button variant="primary" size="sm" leftIcon={<Home className="w-3.5 h-3.5" />}>
              Home Page
            </Button>
          </Link>
        </div>
      </div>

      {/* CASE 1: Pet is on Foster-to-Own Trial (NOT completed yet) */}
      {!isCompleted && isOnTrial && (
        <div className="bg-surface rounded-3xl border-2 border-amber-300 p-8 sm:p-12 text-center max-w-xl mx-auto space-y-6 shadow-card animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
            <Clock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-amber-900 bg-amber-100 px-3.5 py-1 rounded-full border border-amber-200 inline-block">
              Foster-to-Own Trial in Progress
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-950 mt-2">
              {pet.name} is Currently on Trial
            </h2>
            <p className="text-xs sm:text-sm text-brand-700 leading-relaxed max-w-md mx-auto">
              Official Certificates of Adoption and family member awards are issued once the Foster-to-Own trial period is successfully finalized and the adoption pledge is signed.
            </p>
          </div>

          {matchingRequest?.trial && (
            <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 flex items-center justify-between text-left">
              <div>
                <span className="text-amber-700 block font-semibold text-[11px]">Active Trial Status:</span>
                <strong className="font-bold text-amber-950 text-sm">
                  {(() => {
                    const cd = calculateTrialCountdown(
                      matchingRequest.trial.startDate,
                      matchingRequest.trial.endDate
                    );
                    return `Day ${cd.currentDay} of ${cd.totalDays} — Active Bonding Period`;
                  })()}
                </strong>
              </div>
              <span className="text-xs font-extrabold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300">
                Trial Active
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {matchingRequest ? (
              <Link to={`/adopter/requests/${matchingRequest.id}`} className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  leftIcon={<Heart className="w-4 h-4" />}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  View Active Trial & Checklist
                </Button>
              </Link>
            ) : (
              <Link to="/adopter/requests" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  leftIcon={<Heart className="w-4 h-4" />}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Go to My Requests
                </Button>
              </Link>
            )}
            <Link to="/adopter/dashboard" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="w-full">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* CASE 2: Pet is NOT adopted and NOT on trial */}
      {!isCompleted && !isOnTrial && (
        <div className="bg-surface rounded-3xl border-2 border-brand-200 p-8 sm:p-12 text-center max-w-xl mx-auto space-y-6 shadow-card animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center mx-auto">
            <Award className="w-8 h-8 text-brand-400" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600 bg-brand-100 px-3.5 py-1 rounded-full">
              Certificate Not Available
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-950 mt-2">
              {pet.name} Has Not Been Adopted Yet
            </h2>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed max-w-md mx-auto">
              Adoption Certificates are generated exclusively for pets that have officially completed the Foster-to-Own adoption journey.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to={`/pets/${pet.id}`} className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full">
                View Pet Profile
              </Button>
            </Link>
            <Link to="/pets" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="w-full">
                Browse Available Pets
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* CASE 3: Adoption is Officially Completed -> Render Adoption Certificate */}
      {isCompleted && (
        <AdoptionCertificate
          pet={pet}
          adopterName={
            adoptionRecord?.adopterName ||
            matchingRequest?.adopterName ||
            (user?.name ? user.name : 'Raghav Singh')
          }
          providerName={
            adoptionRecord?.providerName ||
            matchingRequest?.providerName ||
            pet.provider?.name ||
            'Sanctuary'
          }
          adoptionDate={
            adoptionRecord?.adoptionDate
              ? new Date(adoptionRecord.adoptionDate).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              : matchingRequest?.updatedAt
              ? new Date(matchingRequest.updatedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              : new Date().toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
          }
          certificateNumber={
            adoptionRecord?.certificateNumber ||
            `PA-CERT-${(matchingRequest?.id || pet.id).slice(-8).toUpperCase()}`
          }
        />
      )}
    </div>
  );
};
