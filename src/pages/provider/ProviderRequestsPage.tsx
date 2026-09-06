import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { adoptionService } from '../../services/adoptionService';
import { AdoptionRequest } from '../../types/adoptionRequest';
import { StatusBadge } from '../../components/common/StatusBadge';
import { TrialStatusBadge } from '../../components/common/TrialStatusBadge';
import { calculateTrialCountdown } from '../../components/common/TrialCountdown';
import { Button } from '../../components/common/Button';
import { RequestReviewDrawer } from '../../components/provider/RequestReviewDrawer';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { Inbox, CheckCircle2, User, Clock, ArrowRight, Sparkles } from 'lucide-react';

import { realtimeSync } from '../../services/realtimeSync';

export const ProviderRequestsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [requests, setRequests] = useState<AdoptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<AdoptionRequest | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { showToast } = useToast();

  const providerId = user?.id || 'prv_sarah';

  const loadRequests = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const list = await adoptionService.getRequestsForUser(providerId, 'provider');
      setRequests(list);

      // Deep link support: if :id is provided in URL, auto-select that request
      if (id) {
        const found = list.find((r) => r.id === id || r.trial?.id === id || r.petId === id);
        if (found) {
          setSelectedRequest(found);
          setDrawerOpen(true);
        }
      }
    } catch (err) {
      console.warn('[ProviderRequestsPage] Error loading requests:', err);
      if (!silent) showToast('Failed to load incoming requests', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (id && requests.length > 0) {
      const found = requests.find((r) => r.id === id || r.trial?.id === id || r.petId === id);
      if (found) {
        setSelectedRequest(found);
        setDrawerOpen(true);
      }
    }
  }, [id, requests]);

  useEffect(() => {
    loadRequests();

    const unsubscribe = realtimeSync.subscribe((event) => {
      if (
        event.type === 'adoption_request_updated' ||
        event.type === 'adoption_request_created' ||
        event.type === 'foster_trial_updated' ||
        event.type === 'all'
      ) {
        loadRequests(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [providerId, id]);

  const handleReview = (req: AdoptionRequest) => {
    setSelectedRequest(req);
    setDrawerOpen(true);
  };

  const handleQuickApprove = async (req: AdoptionRequest) => {
    if (!window.confirm(`Approve adoption application for ${req.petName} from ${req.adopterName} and start 14-day Foster-to-Own bonding trial?`)) {
      return;
    }
    try {
      await adoptionService.approveRequest(req.id, 'Home environment pre-approved. Starting 14-day Foster-to-Own trial.');
      showToast(`Adoption approved for ${req.petName} ❤️`, 'success');
      loadRequests();
    } catch (err: any) {
      showToast(err?.message || 'Failed to approve adoption request.', 'error');
    }
  };

  return (
    <div className="space-y-8 text-left">
      <div>
        <span className="text-xs font-bold text-brand-600 uppercase tracking-widest bg-brand-100 px-3.5 py-1 rounded-full">
          Applicant Screening
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-brand-950 mt-2">
          Incoming Adoption Requests
        </h1>
        <p className="text-xs sm:text-sm text-brand-muted mt-1">
          Review adopter home environments, send questions, and approve 14-day Foster-to-Own bonding trials.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-28 bg-brand-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-surface rounded-3xl border border-brand-200 p-12 text-center max-w-md mx-auto space-y-3">
          <Inbox className="w-12 h-12 text-brand-400 mx-auto" />
          <h3 className="font-display text-xl font-bold text-brand-950">
            No incoming applications
          </h3>
          <p className="text-xs text-brand-muted">
            New adoption requests for your pets will appear here for screening.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-surface rounded-3xl border border-brand-200/80 shadow-card hover:shadow-card-hover transition-all p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
            >
              {/* Pet and Applicant Info */}
              <div className="flex items-start gap-4">
                <img
                  src={req.petImage}
                  alt={req.petName}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-brand-200 shrink-0"
                />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-xl font-bold text-brand-950">
                      {req.petName}
                    </h3>
                    <StatusBadge status={req.status} size="sm" />
                    {req.trial && (
                      <span className="text-[11px] font-bold text-brand-800 bg-brand-100 px-2.5 py-0.5 rounded-full border border-brand-200">
                        Day {calculateTrialCountdown(req.trial.startDate, req.trial.endDate).currentDay} of {req.trial.totalDays} ({calculateTrialCountdown(req.trial.startDate, req.trial.endDate).daysRemaining}d left)
                      </span>
                    )}
                    {req.trial?.extensionRequested && req.trial.extension?.status === 'pending' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-700" />
                        <span>Extension Requested (+{req.trial.extension.requestedDays}d)</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-brand-700">
                    Applicant: <strong className="text-brand-950">{req.adopterName}</strong> ({req.adopterLocation})
                  </p>
                  <p className="text-xs text-brand-muted">
                    Home: {req.homeType} • Experience: {req.petExperience}
                  </p>
                  <p className="text-[11px] text-brand-400">
                    Received: {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Actions: Review, Quick Approve */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto justify-end">
                {req.status !== 'Approved' && req.status !== 'Completed' && (
                  <Button
                    variant="cream"
                    size="sm"
                    onClick={() => handleQuickApprove(req)}
                    leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                  >
                    Quick Approve ❤️
                  </Button>
                )}

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleReview(req)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Review Full Application
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Drawer (Section 21) */}
      <RequestReviewDrawer
        request={selectedRequest}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onStatusUpdated={loadRequests}
      />
    </div>
  );
};
