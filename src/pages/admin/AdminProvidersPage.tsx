import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, MapPin, CheckCircle, ExternalLink, RefreshCw, XCircle, Search, AlertCircle } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { adminService, AdminProviderRecord } from '../../services/adminService';
import { useToast } from '../../contexts/ToastContext';

export const AdminProvidersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramStatus = searchParams.get('status');
  const initialStatus = (paramStatus === 'pending' || paramStatus === 'verified' || paramStatus === 'rejected') ? paramStatus : 'all';

  const [providers, setProviders] = useState<AdminProviderRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>(initialStatus);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<AdminProviderRecord | null>(null);
  const [actionType, setActionType] = useState<'verify' | 'reject' | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const isLive = adminService.isLiveRealMode();

  useEffect(() => {
    const s = searchParams.get('status');
    if (s === 'pending' || s === 'verified' || s === 'rejected') {
      setStatusFilter(s);
    } else if (!s) {
      setStatusFilter('all');
    }
  }, [searchParams]);

  const loadProviders = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getProviders(search, statusFilter);
      setProviders(data);
    } catch (err) {
      console.warn('Error loading providers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, [search, statusFilter]);

  const handleStatusFilterChange = (s: 'all' | 'pending' | 'verified' | 'rejected') => {
    setStatusFilter(s);
    if (s === 'all') {
      searchParams.delete('status');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ ...Object.fromEntries(searchParams.entries()), status: s });
    }
  };

  const handleOpenAction = (p: AdminProviderRecord, type: 'verify' | 'reject') => {
    setSelectedProvider(p);
    setActionType(type);
    setActionNote('');
  };

  const handleConfirmAction = async () => {
    if (!selectedProvider || !actionType) return;

    if (actionType === 'reject' && !actionNote.trim()) {
      showToast('Please provide a reason for rejecting the provider verification.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (actionType === 'verify') {
        const res = await adminService.verifyProvider(selectedProvider.id, actionNote);
        if (res.success) {
          showToast(`Verified ${selectedProvider.org}. Provider notified & verification email queued.`, 'success');
          setSelectedProvider(null);
          setActionType(null);
          await loadProviders();
        } else {
          showToast(res.error || 'Failed to verify provider.', 'error');
        }
      } else {
        const res = await adminService.rejectProvider(selectedProvider.id, actionNote);
        if (res.success) {
          showToast(`Provider ${selectedProvider.org} verification rejected.`, 'info');
          setSelectedProvider(null);
          setActionType(null);
          await loadProviders();
        } else {
          showToast(res.error || 'Failed to reject provider.', 'error');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Error processing provider verification.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl font-bold text-brand-950">Rescue Provider Network</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Verified Shelter & Provider Registry
            </span>
          </div>
          <p className="text-xs text-brand-muted">
            Registered animal shelters, welfare societies, and rescue foster networks undergoing compliance checks.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center bg-brand-100/60 p-1 rounded-2xl border border-brand-200 text-xs">
            {(['all', 'pending', 'verified', 'rejected'] as const).map((s) => (
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
              placeholder="Search shelters & cities..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl border border-brand-200 text-xs text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface"
            />
          </div>

          <button
            onClick={loadProviders}
            disabled={isLoading}
            className="p-2 rounded-2xl border border-brand-200 hover:bg-brand-50 text-brand-700 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-brand-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-600" />
          <p className="text-xs font-semibold">Loading provider network records...</p>
        </div>
      ) : providers.length === 0 ? (
        <div className="p-12 text-center bg-surface rounded-3xl border border-brand-200 text-brand-500">
          <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-brand-300" />
          <p className="text-sm font-bold text-brand-900">No Providers Found</p>
          <p className="text-xs text-brand-muted mt-1">Try clearing search terms or selecting a different status filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {providers.map((p) => (
            <div key={p.id} className="bg-surface rounded-3xl p-6 border border-brand-200 shadow-card space-y-4 transition-all hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-bold text-brand-950">{p.name}</h3>
                    {p.verificationStatus === 'verified' ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </span>
                    ) : p.verificationStatus === 'rejected' ? (
                      <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-rose-300">
                        <XCircle className="w-3 h-3" /> Rejected
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-300">
                        <AlertCircle className="w-3 h-3" /> Pending Audit
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-brand-700 font-semibold">{p.org} • <span className="text-brand-500">{p.providerType}</span></p>
                  <p className="text-[11px] text-brand-400 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {p.location}
                  </p>
                </div>
              </div>

              {p.description && (
                <p className="text-xs text-brand-600 line-clamp-2 leading-relaxed bg-brand-50/50 p-2.5 rounded-xl border border-brand-100">
                  {p.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-brand-50 text-xs">
                <div>
                  <span className="text-brand-400 block">Active Listings</span>
                  <strong className="text-brand-900 font-bold">{p.listings} Pets</strong>
                </div>
                <div>
                  <span className="text-brand-400 block">All-time Adoptions</span>
                  <strong className="text-brand-900 font-bold">{p.adoptions} Placed</strong>
                </div>
              </div>

              {p.verificationNotes && (
                <div className="text-[11px] text-brand-600 bg-brand-100/40 p-2 rounded-xl">
                  <span className="font-bold text-brand-900">Audit Notes:</span> {p.verificationNotes}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-brand-100">
                <span className="text-[11px] text-brand-400">
                  Registered {p.createdAt ? p.createdAt.split('T')[0] : 'Earlier'}
                </span>

                <div className="flex items-center gap-2">
                  {p.verificationStatus !== 'verified' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenAction(p, 'verify')}
                      leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
                    >
                      Verify Provider
                    </Button>
                  )}
                  {p.verificationStatus !== 'rejected' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenAction(p, 'reject')}
                      leftIcon={<XCircle className="w-3.5 h-3.5" />}
                    >
                      Reject
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {selectedProvider && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface rounded-3xl border border-brand-200 max-w-md w-full p-6 shadow-2xl space-y-5 text-left">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                actionType === 'verify' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {actionType === 'verify' ? <ShieldCheck className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-brand-950">
                  {actionType === 'verify' ? 'Approve Provider Verification' : 'Reject Provider Application'}
                </h3>
                <p className="text-xs text-brand-muted">
                  {actionType === 'verify' ? 'Grant Trust & Safety verified badge' : 'Provide formal rejection explanation'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-brand-50 border border-brand-200 text-xs space-y-1">
              <p className="font-bold text-brand-950">{selectedProvider.org}</p>
              <p className="text-brand-600">Contact: {selectedProvider.name} • {selectedProvider.location}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-900 block">
                {actionType === 'verify' ? 'Compliance Verification Notes (Optional)' : 'Rejection Reason (Required)'}
              </label>
              <textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder={
                  actionType === 'verify'
                    ? 'e.g. Registered NGO documents inspected and confirmed valid.'
                    : 'e.g. Incomplete shelter registration certificate or unreachable phone.'
                }
                rows={3}
                className="w-full p-3 rounded-2xl border border-brand-200 text-xs text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface"
              />
            </div>

            {actionType === 'verify' && (
              <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                ✅ Approving this provider automatically sends an in-app notification and dispatches a verified badge confirmation email.
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedProvider(null);
                  setActionType(null);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant={actionType === 'verify' ? 'primary' : 'outline'}
                size="sm"
                onClick={handleConfirmAction}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : actionType === 'verify' ? 'Confirm Verification' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
