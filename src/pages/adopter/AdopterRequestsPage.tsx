import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { adoptionService } from '../../services/adoptionService';
import { AdoptionRequest, getDefaultVerification } from '../../types/adoptionRequest';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { FileText, ArrowRight, Clock, Calendar, CheckCircle2, Heart, Sparkles, Award } from 'lucide-react';
import { adoptionCompletionService } from '../../services/adoptionCompletionService';

import { realtimeSync } from '../../services/realtimeSync';

export const AdopterRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<AdoptionRequest[]>([]);
  const [adoptedCount, setAdoptedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async (silent = false) => {
    if (!user?.id) {
      setRequests([]);
      setAdoptedCount(0);
      setLoading(false);
      return;
    }

    try {
      if (!silent) setLoading(true);
      setError(null);
      const [list, completedAdoptions] = await Promise.all([
        adoptionService.getRequestsForUser(user.id, 'adopter'),
        adoptionCompletionService.getCompletedAdoptions(user.id, 'adopter').catch(() => []),
      ]);

      // Collect IDs and names of pets that the user has officially adopted
      const adoptedPetIds = new Set<string>();
      const adoptedPetNames = new Set<string>();

      // 1. From completed adoptions table / service
      completedAdoptions.forEach((adp) => {
        if (adp.petId) adoptedPetIds.add(adp.petId);
        if (adp.petName) adoptedPetNames.add(adp.petName.trim().toLowerCase());
      });

      // 2. From any request with status 'Completed' or 'Adoption Completed'
      list.forEach((req) => {
        if (
          req.status === 'Completed' ||
          req.trial?.status === 'Adoption Completed' ||
          Boolean(req.adoption?.certificateNumber)
        ) {
          if (req.petId) adoptedPetIds.add(req.petId);
          if (req.petName) adoptedPetNames.add(req.petName.trim().toLowerCase());
        }
      });

      // Filter out completed requests and any requests for already-adopted pets
      const activeApplications = list.filter((req) => {
        // Exclude completed requests (they belong in My Adoptions)
        if (req.status === 'Completed' || req.trial?.status === 'Adoption Completed') {
          return false;
        }
        // Exclude any requests (whether active, rejected, or cancelled) for pets this user already officially adopted
        if (req.petId && adoptedPetIds.has(req.petId)) {
          return false;
        }
        if (req.petName && adoptedPetNames.has(req.petName.trim().toLowerCase())) {
          return false;
        }
        return true;
      });

      setRequests(activeApplications);
      setAdoptedCount(Math.max(adoptedPetIds.size, completedAdoptions.length));
    } catch (err: any) {
      console.error('Failed to load adoption requests:', err);
      setError(err?.message || 'Failed to load adoption requests. Please try again.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    const unsubscribe = realtimeSync.subscribe((event) => {
      if (
        event.type === 'adoption_request_updated' ||
        event.type === 'adoption_request_created' ||
        event.type === 'foster_trial_updated' ||
        event.type === 'all'
      ) {
        fetchRequests(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  return (
    <div className="space-y-8 text-left">
      <div>
        <span className="text-xs font-bold text-brand-600 uppercase tracking-widest bg-brand-100 px-3.5 py-1 rounded-full">
          Tracking & Status
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-brand-950 mt-2">
          My Adoption Applications
        </h1>
        <p className="text-xs sm:text-sm text-brand-muted mt-1">
          Monitor provider reviews, scheduled home visits, and active Foster-to-Own trials.
        </p>
      </div>

      {/* Subtle notification banner if user has officially adopted pets */}
      {adoptedCount > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-brand-50/90 border border-brand-200 text-brand-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-100 border border-brand-300 flex items-center justify-center text-brand-800 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-brand-900">
                You have {adoptedCount} officially adopted companion{adoptedCount > 1 ? 's' : ''}!
              </p>
              <p className="text-[11px] text-brand-600 mt-0.5">
                Official adoption certificates and lifelong companion awards are housed under My Adoptions.
              </p>
            </div>
          </div>
          <Link to="/adopter/adoptions" className="shrink-0 w-full sm:w-auto">
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="w-full sm:w-auto"
            >
              View My Adoptions
            </Button>
          </Link>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => fetchRequests()}>Retry</Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-32 bg-brand-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-surface rounded-3xl border border-brand-200 p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center mx-auto">
            {adoptedCount > 0 ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            ) : (
              <FileText className="w-6 h-6 text-brand-700" />
            )}
          </div>
          <h3 className="font-display text-xl font-bold text-brand-950">
            {adoptedCount > 0
              ? 'All Applications Successfully Finalized!'
              : 'No active adoption requests'}
          </h3>
          <p className="text-xs text-brand-muted">
            {adoptedCount > 0
              ? 'You have no active pending applications. All your adopted companions are part of your forever family!'
              : 'Browse available pets and submit a request to get started.'}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {adoptedCount > 0 ? (
              <Link to="/adopter/adoptions">
                <Button variant="primary" size="md" leftIcon={<Award className="w-4 h-4" />}>
                  View My Official Adoptions
                </Button>
              </Link>
            ) : (
              <Link to="/pets">
                <Button variant="primary" size="md">
                  Browse Available Pets
                </Button>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-surface rounded-3xl border border-brand-200/80 shadow-card hover:shadow-card-hover transition-all p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
            >
              <div className="flex items-start gap-4">
                <img
                  src={req.petImage}
                  alt={req.petName}
                  className="w-20 h-20 rounded-2xl object-cover border border-brand-200 shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-display text-xl font-bold text-brand-950">
                      {req.petName}
                    </h3>
                    <StatusBadge status={req.status} size="sm" />
                  </div>
                  <p className="text-xs text-brand-500 font-semibold">{req.petBreed}</p>
                  <p className="text-xs text-brand-muted">
                    Provider: <strong className="text-brand-900">{req.providerName}</strong> ({req.providerLocation})
                  </p>
                  <p className="text-[11px] text-brand-400">
                    Application Date: {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>

                  {/* Step-wise Verification & Approval Percent Badge */}
                  {(() => {
                    const verif = req.verification || getDefaultVerification(req);
                    return (
                      <div className="pt-2 flex flex-wrap items-center gap-2.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 border border-brand-200">
                          Level {verif.level}/4
                        </span>
                        <div className="w-28 bg-brand-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-brand-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(5, verif.percentage)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-extrabold text-brand-800">
                          {verif.percentage}% Verified
                        </span>
                        <span className="text-[11px] text-brand-500 hidden sm:inline">
                          • {verif.statusTitle.replace(/^Level \d+: /, '')}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Status Specific Highlights */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto justify-end">
                {req.trial && req.status === 'Approved' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 text-center">
                      Trial: Day {req.trial.currentDay} of {req.trial.totalDays}
                    </span>
                    {req.trial.extensionRequested && (
                      <span className="text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1.5 rounded-full border border-amber-300 flex items-center gap-1.5 animate-pulse">
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                        <span>Extension Pending (+{req.trial.extension?.requestedDays || 3}d)</span>
                      </span>
                    )}
                    {req.trial.extension?.status === 'approved' && (
                      <span className="text-xs font-bold text-emerald-900 bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Extended (+{req.trial.extension.requestedDays}d)</span>
                      </span>
                    )}
                  </div>
                )}

                <Link to={`/adopter/requests/${req.id}`}>
                  <Button variant="outline" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    View Details & Timeline
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
