import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { adoptionService } from '../../services/adoptionService';
import { AdoptionRequest, getDefaultVerification } from '../../types/adoptionRequest';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { RequestTimeline } from '../../components/adopter/RequestTimeline';
import { FosterTrialCard } from '../../components/adopter/FosterTrialCard';
import { useToast } from '../../contexts/ToastContext';
import {
  ArrowLeft,
  Calendar,
  User,
  Home,
  MessageSquare,
  Award,
  ShieldCheck,
  Heart,
  Phone,
  XCircle,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

import { realtimeSync } from '../../services/realtimeSync';
import { useSmartBack } from '../../hooks/useSmartBack';

export const AdopterRequestDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const handleBack = useSmartBack('/adopter/requests');
  const [request, setRequest] = useState<AdoptionRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const fetchRequest = async (silent = false) => {
    if (!id) return;
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await adoptionService.getRequestById(id);
      setRequest(data);
    } catch (err: any) {
      console.error('Failed to load application:', err);
      setError(err?.message || 'Could not load application details.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!request) return;
    if (!window.confirm('Are you sure you want to withdraw this adoption request?')) return;

    try {
      setIsWithdrawing(true);
      await adoptionService.withdrawRequest(request.id);
      showToast('Adoption application withdrawn.', 'info');
      await fetchRequest();
    } catch (err: any) {
      showToast(err?.message || 'Failed to withdraw application.', 'error');
    } finally {
      setIsWithdrawing(false);
    }
  };

  useEffect(() => {
    fetchRequest();

    // Instant real-time listener for admin/provider approvals & verification updates
    const unsubscribe = realtimeSync.subscribe((event) => {
      if (
        event.type === 'adoption_request_updated' ||
        event.type === 'foster_trial_updated' ||
        event.type === 'all'
      ) {
        if (!event.entityId || event.entityId === id) {
          fetchRequest(true);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [id]);

  if (loading) {
    return <div className="py-20 text-center text-sm font-semibold text-brand-600 animate-pulse">Loading application details...</div>;
  }

  if (!request) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="font-display text-2xl font-bold text-brand-950">Request Not Found</h2>
        <Link to="/adopter/requests">
          <Button variant="primary" size="md">Return to Requests</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-left">
      {/* Back button */}
      <div>
        <button
          onClick={handleBack}
          type="button"
          className="inline-flex items-center gap-2 text-xs font-bold text-brand-700 hover:text-brand-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {/* Header Banner */}
      <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-brand-200/80 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={request.petImage}
            alt={request.petName}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-brand-200 shrink-0"
          />
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-brand-950">
                {request.petName}
              </h2>
              <StatusBadge status={request.status} size="md" />
            </div>
            <p className="text-xs text-brand-500 font-medium mt-0.5">{request.petBreed}</p>
            <p className="text-xs text-brand-muted">
              Provider: <strong className="text-brand-900">{request.providerName}</strong> ({request.providerLocation})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {(request.status === 'Pending' || request.status === 'Under Review') && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              leftIcon={<XCircle className="w-4 h-4" />}
              onClick={handleWithdraw}
              disabled={isWithdrawing}
            >
              {isWithdrawing ? 'Withdrawing...' : 'Withdraw Application'}
            </Button>
          )}
          <Link to={`/pets/${request.petId}`}>
            <Button variant="outline" size="sm">
              View Pet Profile
            </Button>
          </Link>
          {request.status === 'Completed' && (
            <Link to={`/adoption-success/${request.petId}`}>
              <Button variant="primary" size="sm" leftIcon={<Award className="w-4 h-4" />}>
                View Certificate
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Verification Level & Approval Progress Banner */}
      {(() => {
        const verif = request.verification || getDefaultVerification(request);
        return (
          <div className="bg-surface rounded-3xl p-6 border border-brand-200/80 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-brand-600" />
                <h3 className="font-display text-base font-bold text-brand-950">
                  Adoption Approval Progress
                </h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 border border-brand-200">
                  Level {verif.level} of 4
                </span>
              </div>
              <span className="text-sm font-black text-brand-900">
                {verif.percentage}% Completed
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-brand-100 h-3 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-brand-600 to-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, verif.percentage)}%` }}
              />
            </div>

            <p className="text-xs text-brand-600 font-semibold">
              Current Stage: <span className="text-brand-950 font-bold">{verif.statusTitle}</span>
            </p>

            {/* 4 Level Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {verif.steps.map((s) => (
                <div
                  key={s.id}
                  className={`p-3.5 rounded-2xl border transition-colors ${
                    s.completed
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                      : verif.level === s.level
                      ? 'bg-brand-50 border-brand-300 text-brand-950'
                      : 'bg-brand-50/30 border-brand-100 text-brand-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Level {s.level}
                    </span>
                    {s.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-brand-400" />
                    )}
                  </div>
                  <h5 className="font-display text-xs font-bold leading-snug">
                    {s.title.replace(/^Level \d+: /, '')}
                  </h5>
                  <p className="text-[10px] text-brand-500 mt-1 line-clamp-2">
                    {s.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Completed Adoption Banner with Certificate link */}
      {request.status === 'Completed' && (
        <div className="bg-gradient-to-br from-emerald-900 via-brand-950 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-500/40 shadow-soft-lg space-y-4 text-left animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
                    Forever Family Finalized
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/40">
                    Official ❤️
                  </span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-white mt-0.5">
                  Congratulations! You officially adopted {request.petName}.
                </h3>
              </div>
            </div>

            <Link to={`/adoption-success/${request.petId}`}>
              <Button
                variant="primary"
                size="md"
                className="bg-emerald-500 hover:bg-emerald-400 text-brand-950 font-bold shadow-md w-full sm:w-auto"
              >
                View Official Certificate
              </Button>
            </Link>
          </div>
          <p className="text-xs text-emerald-200/90 leading-relaxed">
            Your Foster-to-Own bonding journey is complete. Your official Adoption Certificate has been issued and registered on the platform.
          </p>
        </div>
      )}

      {/* Active Foster-to-Own Trial Card (Section 17) */}
      {request.status === 'Approved' && request.trial && (
        <FosterTrialCard request={request} onUpdate={fetchRequest} />
      )}

      {/* Timeline Section (Section 17) */}
      <div className="bg-surface rounded-3xl p-6 sm:p-10 border border-brand-200/80 shadow-card space-y-6">
        <div className="pb-4 border-b border-brand-100">
          <h3 className="font-display text-xl font-bold text-brand-950">
            Adoption Progress Timeline
          </h3>
          <p className="text-xs text-brand-muted mt-0.5">
            Stage-by-stage progression from initial application to official adoption
          </p>
        </div>

        <RequestTimeline timeline={request.timeline} />
      </div>

      {/* Application Snapshot */}
      <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-brand-200/80 shadow-card space-y-5">
        <h3 className="font-display text-lg font-bold text-brand-950 pb-3 border-b border-brand-100 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-brand-600" />
          <span>Application Summary & Note</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-brand-50 rounded-2xl border border-brand-100">
            <span className="text-brand-400 block mb-0.5">Home Type</span>
            <strong className="text-brand-900">{request.homeType}</strong>
          </div>
          <div className="p-3 bg-brand-50 rounded-2xl border border-brand-100">
            <span className="text-brand-400 block mb-0.5">Existing Pets</span>
            <strong className="text-brand-900">{request.existingPets}</strong>
          </div>
          <div className="p-3 bg-brand-50 rounded-2xl border border-brand-100">
            <span className="text-brand-400 block mb-0.5">Children</span>
            <strong className="text-brand-900">{request.children}</strong>
          </div>
          <div className="p-3 bg-brand-50 rounded-2xl border border-brand-100">
            <span className="text-brand-400 block mb-0.5">Experience</span>
            <strong className="text-brand-900">{request.petExperience}</strong>
          </div>
        </div>

        <div className="space-y-1 pt-2">
          <span className="text-xs font-bold text-brand-800 uppercase tracking-wider block">
            Your Note to Provider
          </span>
          <p className="text-xs sm:text-sm text-brand-800 bg-brand-50/70 p-4 rounded-2xl border border-brand-100 leading-relaxed italic">
            "{request.message}"
          </p>
        </div>

        {request.reviewNotes && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <span className="font-bold uppercase tracking-wider text-[10px] block">
              Provider Review Note
            </span>
            <p>{request.reviewNotes}</p>
          </div>
        )}
      </div>
    </div>
  );
};
