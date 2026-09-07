import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adoptionService } from '../../services/adoptionService';
import { adminService } from '../../services/adminService';
import { AdoptionRequest, getDefaultVerification } from '../../types/adoptionRequest';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AdminRequestReviewDrawer } from '../../components/admin/AdminRequestReviewDrawer';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import { realtimeSync } from '../../services/realtimeSync';
import { calculateTrialCountdown } from '../../components/common/TrialCountdown';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { isUUID } from '../../utils/authMode';
import {
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  ShieldCheck,
  Heart,
  SlidersHorizontal,
  Clock,
} from 'lucide-react';

export const AdminRequestsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramStatus = searchParams.get('status');
  const validStatuses = ['pending', 'under review', 'approved', 'completed', 'rejected'];
  const initialStatus = paramStatus && validStatuses.includes(paramStatus.toLowerCase()) ? paramStatus.toLowerCase() : 'all';

  const [requests, setRequests] = useState<AdoptionRequest[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<AdoptionRequest | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isLive = adminService.isLiveRealMode();
  const hasRealRequests = requests.some((r) => r.id && r.id.length > 20);

  useEffect(() => {
    const s = searchParams.get('status');
    if (s && validStatuses.includes(s.toLowerCase())) {
      setStatusFilter(s.toLowerCase());
    } else if (!s) {
      setStatusFilter('all');
    }
  }, [searchParams]);

  const openTargetRequest = useCallback(
    async (targetId?: string | null, petName?: string | null) => {
      if (!targetId && !petName) return;

      // 1. Direct in-memory lookup across requests
      let match = requests.find(
        (r) =>
          (targetId && (r.id === targetId || r.trial?.id === targetId || r.petId === targetId)) ||
          (petName && r.petName.toLowerCase() === petName.toLowerCase())
      );

      // 2. If not found and targetId looks like UUID, resolve linked records in database
      if (!match && targetId && isSupabaseConfigured() && isUUID(targetId)) {
        try {
          // Check adoptions table (for completed adoptions)
          const { data: adData } = await (supabase as any)
            .from('adoptions')
            .select('adoption_request_id, pet_id')
            .eq('id', targetId)
            .maybeSingle();

          if (adData) {
            match = requests.find(
              (r) => r.id === adData.adoption_request_id || r.petId === adData.pet_id
            );
          }

          // Check foster_trials table
          if (!match) {
            const { data: trialData } = await (supabase as any)
              .from('foster_trials')
              .select('adoption_request_id, pet_id')
              .eq('id', targetId)
              .maybeSingle();

            if (trialData) {
              match = requests.find(
                (r) => r.id === trialData.adoption_request_id || r.petId === trialData.pet_id
              );
            }
          }

          // Check pets table
          if (!match) {
            const { data: petData } = await (supabase as any)
              .from('pets')
              .select('id, name')
              .eq('id', targetId)
              .maybeSingle();

            if (petData) {
              match = requests.find(
                (r) => r.petId === petData.id || r.petName.toLowerCase() === petData.name.toLowerCase()
              );
            }
          }
        } catch (err) {
          console.warn('[AdminRequestsPage] Error resolving target request from Supabase:', err);
        }
      }

      if (match) {
        setSelectedRequest(match);
        setIsDrawerOpen(true);
      }
    },
    [requests]
  );

  // Handle direct navigation to a request or trial from URL (?id=...)
  useEffect(() => {
    const targetId = searchParams.get('id');
    if (targetId && requests.length > 0) {
      openTargetRequest(targetId);
    }
  }, [searchParams, requests, openTargetRequest]);

  // Handle immediate cross-component click event from AdminTopNav
  useEffect(() => {
    const handleAdminOpenEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { targetId, petName } = customEvent.detail || {};
      if (targetId || petName) {
        openTargetRequest(targetId, petName);
      }
    };

    window.addEventListener('admin_open_request', handleAdminOpenEvent);
    return () => {
      window.removeEventListener('admin_open_request', handleAdminOpenEvent);
    };
  }, [openTargetRequest]);

  const loadRequests = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await adoptionService.getAllRequests();
      setRequests(data);
      setSelectedRequest((curr) => {
        if (!curr) return null;
        return data.find((r) => r.id === curr.id) || curr;
      });
    } catch (err) {
      console.warn('Error loading requests:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();

    const unsubscribe = realtimeSync.subscribe((event) => {
      if (
        event.type === 'adoption_request_updated' ||
        event.type === 'adoption_request_created' ||
        event.type === 'foster_trial_updated' ||
        event.type === 'user_updated' ||
        event.type === 'user_created' ||
        event.type === 'all'
      ) {
        loadRequests(true);
      }
    });

    return () => {
      unsubscribe();
    };
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

  const handleOpenReview = (req: AdoptionRequest) => {
    setSelectedRequest(req);
    setIsDrawerOpen(true);
  };

  const handleRequestUpdated = (updatedReq: AdoptionRequest) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === updatedReq.id ? updatedReq : r))
    );
    setSelectedRequest(updatedReq);
  };

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      !search ||
      r.petName.toLowerCase().includes(search.toLowerCase()) ||
      r.adopterName.toLowerCase().includes(search.toLowerCase()) ||
      r.providerName.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase());

    let matchesStatus = true;
    if (statusFilter !== 'all') {
      matchesStatus = r.status.toLowerCase() === statusFilter.toLowerCase();
    }

    return matchesSearch && matchesStatus;
  });

  const getLevelColor = (level: number) => {
    switch (level) {
      case 4:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 3:
        return 'bg-brand-100 text-brand-800 border-brand-300';
      case 2:
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  const getProgressGradient = (pct: number) => {
    if (pct >= 100) return 'bg-emerald-500';
    if (pct >= 75) return 'bg-brand-600';
    if (pct >= 50) return 'bg-blue-500';
    return 'bg-amber-500';
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl font-bold text-brand-950">System-Wide Adoption Requests</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Verified Adoption Pipeline
            </span>
          </div>
          <p className="text-xs text-brand-muted">
            Step-wise adoption verification, criteria checklist, and full administrator approval governance.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center bg-brand-100/60 p-1 rounded-2xl border border-brand-200 text-xs">
            {(['all', 'pending', 'under review', 'approved', 'completed', 'rejected'] as const).map((s) => (
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
              placeholder="Search companion or adopter..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl border border-brand-200 text-xs text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface"
            />
          </div>

          <button
            onClick={() => loadRequests()}
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
                <th className="py-3.5 px-4">Adopter</th>
                <th className="py-3.5 px-4">Provider</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Verification & Level</th>
                <th className="py-3.5 px-4">Submitted</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-brand-400 font-medium">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
                    Loading adoption applications...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-brand-400 font-medium">
                    No adoption applications matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => {
                  const verif = r.verification || getDefaultVerification(r);

                  return (
                    <tr
                      key={r.id}
                      onClick={() => handleOpenReview(r)}
                      className="hover:bg-brand-50/60 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={r.petImage}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover border border-brand-200 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-brand-950 text-sm group-hover:text-brand-700 transition-colors">
                              {r.petName}
                            </p>
                            <span className="text-[10px] text-brand-400 font-mono">#{r.id.slice(-6)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-brand-950 text-sm block">{r.adopterName}</span>
                        <span className="text-[11px] text-brand-600 font-medium block">
                          Adopter{r.adopterLocation ? ` • ${r.adopterLocation}` : (r.homeType ? ` • ${r.homeType}` : '')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-brand-900 font-semibold block">{r.providerName}</span>
                        <span className="text-[10px] text-brand-500 font-normal block">
                          {r.providerLocation ? `Shelter • ${r.providerLocation}` : 'Shelter / Care Provider'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={r.status} size="sm" />
                        {r.trial && (r.status === 'Approved' || r.status === 'Completed') && (
                          <div className="mt-1">
                            {r.trial.extensionRequested ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 text-amber-700" />
                                <span>+{r.trial.extension?.requestedDays || 7}d Ext Pending</span>
                              </span>
                            ) : (
                              (() => {
                                const cd = calculateTrialCountdown(r.trial.startDate, r.trial.endDate);
                                return (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5 text-emerald-700" />
                                    <span>
                                      {r.status === 'Completed'
                                        ? 'Finalized'
                                        : cd.isExpired
                                        ? 'Trial Ended'
                                        : `Day ${cd.currentDay}/${cd.totalDays} (${cd.daysRemaining}d left)`}
                                    </span>
                                  </span>
                                );
                              })()
                            )}
                          </div>
                        )}
                      </td>

                      {/* Step-wise Verification & Approval % */}
                      <td className="py-3.5 px-4 min-w-[170px]">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getLevelColor(verif.level)}`}>
                              Lvl {verif.level}/4
                            </span>
                            <span className="text-[11px] font-black text-brand-900">
                              {verif.percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-brand-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${getProgressGradient(verif.percentage)} transition-all duration-300`}
                              style={{ width: `${Math.max(5, verif.percentage)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-brand-400 block truncate max-w-[160px]">
                            {verif.statusTitle.replace(/^Level \d+: /, '')}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-brand-muted whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Actions Column */}
                      <td className="py-3.5 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleOpenReview(r)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 text-brand-800 hover:bg-brand-100 font-bold border border-brand-200 transition-colors shadow-2xs"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                            <span>Review & Verify</span>
                          </button>
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

      {/* Slide-Over Review & Step-Wise Verification Drawer */}
      <ErrorBoundary>
        <AdminRequestReviewDrawer
          request={selectedRequest}
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedRequest(null);
            if (searchParams.has('id')) {
              const nextParams = new URLSearchParams(searchParams);
              nextParams.delete('id');
              setSearchParams(nextParams, { replace: true });
            }
          }}
          onUpdated={handleRequestUpdated}
        />
      </ErrorBoundary>
    </div>
  );
};
