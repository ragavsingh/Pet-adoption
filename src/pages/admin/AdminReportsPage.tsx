import React, { useState, useEffect } from 'react';
import { adminService, AdminReportRecord } from '../../services/adminService';
import { Button } from '../../components/common/Button';
import { useToast } from '../../contexts/ToastContext';
import { AlertOctagon, CheckCircle2, XCircle, RefreshCw, ShieldCheck, Filter } from 'lucide-react';

export const AdminReportsPage: React.FC = () => {
  const [reports, setReports] = useState<AdminReportRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<AdminReportRecord | null>(null);
  const [resolutionAction, setResolutionAction] = useState<'Resolved' | 'Dismissed' | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const isLive = adminService.isLiveRealMode();

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getReports();
      setReports(data);
    } catch (err) {
      console.warn('Error loading reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleOpenAction = (rep: AdminReportRecord, action: 'Resolved' | 'Dismissed') => {
    setSelectedReport(rep);
    setResolutionAction(action);
    setResolutionNotes('');
  };

  const handleConfirmResolution = async () => {
    if (!selectedReport || !resolutionAction) return;

    setIsSubmitting(true);
    try {
      const res = await adminService.resolveReport(selectedReport.id, resolutionAction, resolutionNotes);
      if (res.success) {
        showToast(`Report marked as ${resolutionAction}.`, 'success');
        setSelectedReport(null);
        setResolutionAction(null);
        await loadReports();
      } else {
        showToast(res.error || `Failed to update report.`, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error processing report resolution.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (statusFilter === 'all') return true;
    return r.status.toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl font-bold text-brand-950">Welfare & Compliance Reports</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Compliance & Safety Registry
            </span>
          </div>
          <p className="text-xs text-brand-muted">
            Community flagged content regarding companion safety, commercial fee violations, or misinformation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center bg-brand-100/60 p-1 rounded-2xl border border-brand-200 text-xs">
            {(['all', 'pending', 'resolved', 'dismissed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-xl font-semibold capitalize transition-all ${
                  statusFilter === s
                    ? 'bg-surface text-brand-950 shadow-xs'
                    : 'text-brand-600 hover:text-brand-900'
                }`}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>

          <button
            onClick={loadReports}
            disabled={isLoading}
            className="p-2 rounded-2xl border border-brand-200 hover:bg-brand-50 text-brand-700 transition-colors"
            title="Refresh reports"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-brand-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-600" />
          <p className="text-xs font-semibold">Loading welfare and safety reports...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="p-12 text-center bg-surface rounded-3xl border border-brand-200 text-brand-500">
          <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-emerald-600" />
          <p className="text-sm font-bold text-brand-950">Queue Clean: No Reports Found</p>
          <p className="text-xs text-brand-muted mt-1">There are no reports matching the selected filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((rep) => (
            <div
              key={rep.id}
              className="bg-surface rounded-3xl border border-brand-200/80 p-6 shadow-card space-y-4 transition-all hover:shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    rep.status === 'Resolved'
                      ? 'bg-emerald-100 text-emerald-700'
                      : rep.status === 'Dismissed'
                      ? 'bg-zinc-100 text-zinc-600'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {rep.status === 'Resolved' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : rep.status === 'Dismissed' ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      <AlertOctagon className="w-4 h-4" />
                    )}
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-brand-950">{rep.reason}</h4>
                    <span className="text-[11px] text-brand-muted">Target: {rep.targetName} ({rep.targetType})</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full self-start sm:self-auto ${
                    rep.status === 'Resolved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : rep.status === 'Dismissed'
                      ? 'bg-zinc-100 text-zinc-600'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {rep.status}
                </span>
              </div>

              <p className="text-xs text-brand-700 bg-brand-50 p-3 rounded-2xl border border-brand-100 leading-relaxed">
                "{rep.description}"
              </p>

              {rep.adminNotes && (
                <div className="text-[11px] text-brand-600 bg-brand-100/40 p-2.5 rounded-xl">
                  <strong className="text-brand-900">Admin Resolution Note:</strong> {rep.adminNotes}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 text-[11px] text-brand-400 border-t border-brand-100">
                <span>Reported by {rep.reporterName} on {rep.createdAt}</span>
                {rep.status === 'Pending' && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenAction(rep, 'Dismissed')}>
                      Dismiss
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => handleOpenAction(rep, 'Resolved')}>
                      Resolve Violation
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resolution Confirmation Modal */}
      {selectedReport && resolutionAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface rounded-3xl border border-brand-200 max-w-md w-full p-6 shadow-2xl space-y-5 text-left">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                resolutionAction === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-700'
              }`}>
                {resolutionAction === 'Resolved' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-brand-950">
                  {resolutionAction === 'Resolved' ? 'Resolve Safety Violation' : 'Dismiss Report'}
                </h3>
                <p className="text-xs text-brand-muted">
                  Record official moderation disposition
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-brand-50 border border-brand-200 text-xs space-y-1">
              <p className="font-bold text-brand-950">{selectedReport.reason}</p>
              <p className="text-brand-600">Target: {selectedReport.targetName} ({selectedReport.targetType})</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-900 block">
                Resolution Notes (Optional)
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="e.g. Contacted shelter, verified valid registration documents, warning issued."
                rows={3}
                className="w-full p-3 rounded-2xl border border-brand-200 text-xs text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-surface"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedReport(null);
                  setResolutionAction(null);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant={resolutionAction === 'Resolved' ? 'primary' : 'outline'}
                size="sm"
                onClick={handleConfirmResolution}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : `Confirm ${resolutionAction}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
