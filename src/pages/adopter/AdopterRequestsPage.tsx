import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { adoptionService } from '../../services/adoptionService';
import { AdoptionRequest, getDefaultVerification } from '../../types/adoptionRequest';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { FileText, ArrowRight, Clock, Calendar, CheckCircle2, Heart } from 'lucide-react';

import { realtimeSync } from '../../services/realtimeSync';

export const AdopterRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<AdoptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async (silent = false) => {
    if (!user?.id) {
      setRequests([]);
      setLoading(false);
      return;
    }

    try {
      if (!silent) setLoading(true);
      setError(null);
      const list = await adoptionService.getRequestsForUser(user.id, 'adopter');
      setRequests(list);
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
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-display text-xl font-bold text-brand-950">
            No adoption requests yet
          </h3>
          <p className="text-xs text-brand-muted">
            Browse available pets and submit a request to get started.
          </p>
          <Link to="/pets">
            <Button variant="primary" size="md">
              Browse Available Pets
            </Button>
          </Link>
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
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 text-center">
                    Trial: Day {req.trial.currentDay} of {req.trial.totalDays}
                  </span>
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
