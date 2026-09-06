import React, { useState } from 'react';
import { AdoptionRequest } from '../../types/adoptionRequest';
import { Button } from '../common/Button';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { TrialCountdown, calculateTrialCountdown } from '../common/TrialCountdown';
import { TrialStatusBadge } from '../common/TrialStatusBadge';
import { useToast } from '../../contexts/ToastContext';
import { adoptionService } from '../../services/adoptionService';
import { X, CheckCircle2, XCircle, MessageSquare, User, Home, Clock, HeartHandshake, FileText } from 'lucide-react';

interface RequestReviewDrawerProps {
  request: AdoptionRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated: () => void;
}

export const RequestReviewDrawer: React.FC<RequestReviewDrawerProps> = ({
  request,
  isOpen,
  onClose,
  onStatusUpdated,
}) => {
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [providerNote, setProviderNote] = useState('');
  const [showMoreInfoForm, setShowMoreInfoForm] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [confirmModalAction, setConfirmModalAction] = useState<'approve' | 'decline' | null>(null);

  if (!isOpen || !request) return null;

  const handleConfirmExtension = async (approved: boolean) => {
    try {
      setIsProcessing(true);
      await adoptionService.respondToTrialExtension(request.id, approved);
      if (approved) {
        showToast('Trial extended successfully.', 'success');
      } else {
        showToast('Extension request declined.', 'info');
      }
      onStatusUpdated();
    } catch (err: any) {
      showToast(err?.message || 'Failed to respond to extension request.', 'error');
    } finally {
      setIsProcessing(false);
      setConfirmModalAction(null);
    }
  };

  const handleApprove = async () => {
    try {
      setIsProcessing(true);
      const note = providerNote.trim() || 'Home environment pre-approved. Starting 14-day Foster-to-Own bonding trial.';
      await adoptionService.approveRequest(request.id, note);
      showToast(`Adoption approved for ${request.petName} ❤️ Foster trial initiated.`, 'success');
      setShowApproveModal(false);
      setProviderNote('');
      onStatusUpdated();
      onClose();
    } catch (err: any) {
      showToast(err?.message || 'Failed to approve adoption request.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsProcessing(true);
      const reason = providerNote.trim() || 'Home conditions not fully suitable for this specific pet profile.';
      await adoptionService.rejectRequest(request.id, reason);
      showToast('Adoption request rejected.', 'info');
      setShowRejectModal(false);
      setProviderNote('');
      onStatusUpdated();
      onClose();
    } catch (err: any) {
      showToast(err?.message || 'Failed to reject adoption request.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRequestMoreInfo = async () => {
    const question = providerNote.trim();
    if (!question) {
      showToast('Please type the question or clarification for the adopter.', 'error');
      return;
    }
    try {
      setIsProcessing(true);
      await adoptionService.requestMoreInfo(request.id, question);
      showToast('Clarification request sent to adopter.', 'info');
      setShowMoreInfoForm(false);
      setProviderNote('');
      onStatusUpdated();
    } catch (err: any) {
      showToast(err?.message || 'Failed to send question to adopter.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-xl bg-surface h-full shadow-2xl overflow-y-auto z-10 flex flex-col justify-between animate-fade-in text-left">
        <div>
          {/* Header */}
          <div className="p-6 border-b border-brand-100 flex items-center justify-between sticky top-0 bg-surface/95 backdrop-blur-md z-10">
            <div>
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
                Application Review
              </span>
              <h3 className="font-display text-xl font-bold text-brand-900 mt-0.5">
                Adoption Request #{request.id.slice(-6)}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 hover:bg-brand-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Pet & Status Header */}
            <div className="p-4 rounded-3xl bg-brand-50 border border-brand-200/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={request.petImage}
                  alt={request.petName}
                  className="w-14 h-14 rounded-2xl object-cover border border-brand-200 shrink-0"
                />
                <div>
                  <h4 className="font-display font-bold text-base text-brand-900">
                    {request.petName}
                  </h4>
                  <p className="text-xs text-brand-muted">{request.petBreed}</p>
                </div>
              </div>
              <StatusBadge status={request.status} size="sm" />
            </div>

            {/* Foster-to-Own Trial & Extension Review (if active) */}
            {request.trial && (
              <div className="p-4 rounded-3xl bg-surface border-2 border-brand-200/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-brand-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-500 block">
                      Foster-to-Own Milestone
                    </span>
                    <h4 className="font-display font-bold text-sm text-brand-950 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-4 h-4 text-brand-600" />
                      <span>Trial Period Details</span>
                    </h4>
                  </div>
                  <TrialStatusBadge
                    status={
                      request.status === 'Completed'
                        ? 'Adoption Completed'
                        : request.trial.extensionRequested
                        ? 'Extension Requested'
                        : request.trial.extension?.status === 'approved'
                        ? 'Trial Extended'
                        : 'Trial Active'
                    }
                    size="sm"
                  />
                </div>

                {/* Milestone or Live Countdown in Provider Review */}
                {request.status === 'Completed' ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Official Adoption Finalized
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                        Certificate Issued
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800">
                      Foster-to-own trial successfully concluded and forever home confirmed.
                    </p>
                    <div className="pt-1">
                      <a
                        href={`/adoption-success/${request.petId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 underline"
                      >
                        View Official Adoption Certificate →
                      </a>
                    </div>
                  </div>
                ) : (
                  <TrialCountdown
                    startDate={request.trial.startDate}
                    endDate={request.trial.endDate}
                    variant="full"
                  />
                )}

                {/* Prominent Extension Request Banner if pending */}
                {request.trial.extensionRequested && request.trial.extension?.status === 'pending' && (
                  <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-left space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-700" />
                        <span>Trial Extension Requested</span>
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold text-xs">
                        +{request.trial.extension.requestedDays} Days
                      </span>
                    </div>

                    <p className="text-xs text-amber-900 font-medium">
                      <strong>{request.adopterName}</strong> requested a trial extension for <strong>{request.petName}</strong>.
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-white/80 p-3 rounded-xl border border-amber-200">
                      <div>
                        <span className="text-brand-500 block text-[10px] font-bold uppercase">Current Trial</span>
                        <strong className="text-brand-950">
                          {calculateTrialCountdown(request.trial.startDate, request.trial.endDate).daysRemaining} days remaining
                        </strong>
                      </div>
                      <div>
                        <span className="text-brand-500 block text-[10px] font-bold uppercase">Requested Extension</span>
                        <strong className="text-brand-950">+{request.trial.extension.requestedDays} days</strong>
                      </div>
                    </div>

                    {request.trial.extension.reason && (
                      <p className="text-[11px] text-amber-800 italic bg-amber-100/60 p-2.5 rounded-xl border border-amber-200">
                        "{request.trial.extension.reason}"
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => setConfirmModalAction('approve')}
                        className="flex-1"
                      >
                        Approve Extension (+{request.trial.extension.requestedDays}d)
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmModalAction('decline')}
                        className="shrink-0"
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Adopter Profile Details */}
            <div className="space-y-3">
              <h4 className="font-display text-sm font-bold text-brand-900 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-brand-600" />
                <span>Adopter Information</span>
              </h4>

              <div className="p-4 rounded-2xl border border-brand-200 bg-surface space-y-3 text-xs">
                <div className="flex items-center gap-3 pb-3 border-b border-brand-100">
                  <img
                    src={request.adopterAvatar}
                    alt={request.adopterName}
                    className="w-11 h-11 rounded-full object-cover border border-brand-200 shrink-0"
                  />
                  <div>
                    <p className="font-bold text-sm text-brand-950">{request.adopterName}</p>
                    <p className="text-brand-muted">{request.adopterEmail} • {request.adopterPhone}</p>
                    <p className="text-brand-500 font-semibold">{request.adopterLocation}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-brand-400 block">Home Environment</span>
                    <strong className="text-brand-900 font-bold">{request.homeType}</strong>
                  </div>
                  <div>
                    <span className="text-brand-400 block">Existing Pets</span>
                    <strong className="text-brand-900 font-bold">{request.existingPets}</strong>
                  </div>
                  <div>
                    <span className="text-brand-400 block">Children in Household</span>
                    <strong className="text-brand-900 font-bold">{request.children}</strong>
                  </div>
                  <div>
                    <span className="text-brand-400 block">Experience Level</span>
                    <strong className="text-brand-900 font-bold">{request.petExperience}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-brand-100">
                  <span className="text-brand-400 block mb-0.5">Availability</span>
                  <p className="text-brand-800 font-medium">{request.timeAvailable}</p>
                </div>

                <div className="pt-2 border-t border-brand-100">
                  <span className="text-brand-400 block mb-0.5">Adoption Motivation</span>
                  <p className="text-brand-800 font-medium">{request.whyTheyWantToAdopt}</p>
                </div>
              </div>
            </div>

            {/* Applicant Message */}
            <div className="space-y-2">
              <h4 className="font-display text-sm font-bold text-brand-900 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-brand-600" />
                <span>Applicant Note</span>
              </h4>
              <div className="p-4 rounded-2xl bg-surface border border-brand-200 text-xs text-brand-800 leading-relaxed italic">
                "{request.message}"
              </div>
            </div>

            {/* Request more information box */}
            {showMoreInfoForm && (
              <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200 space-y-3 animate-fade-in">
                <label className="block text-xs font-bold text-brand-900">
                  Ask Adopter for Clarifications / Schedule Video Home Check:
                </label>
                <textarea
                  rows={3}
                  value={providerNote}
                  onChange={(e) => setProviderNote(e.target.value)}
                  placeholder="e.g. Could you share a quick 1-minute video walkaround of your balcony safety netting?"
                  className="w-full px-3 py-2 rounded-xl border border-brand-200 text-xs font-medium text-brand-950 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMoreInfoForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleRequestMoreInfo}
                  >
                    Send Clarification
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Actions Footer */}
        <div className="p-6 border-t border-brand-100 bg-surface-soft/80 flex flex-col gap-3">
          {request.status !== 'Approved' && request.status !== 'Completed' && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="primary"
                size="md"
                isLoading={isProcessing}
                onClick={() => setShowApproveModal(true)}
                className="flex-1"
                leftIcon={<CheckCircle2 className="w-4 h-4 text-white" />}
              >
                Approve & Start Foster Trial ❤️
              </Button>

              <Button
                type="button"
                variant="danger"
                size="md"
                isLoading={isProcessing}
                onClick={() => setShowRejectModal(true)}
                className="shrink-0"
              >
                Reject
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            {!showMoreInfoForm && request.status !== 'Completed' && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowMoreInfoForm(true)}
                leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
              >
                Request Clarification / More Info
              </Button>
            )}

            <Button type="button" variant="outline" size="sm" onClick={onClose} className="ml-auto">
              Close
            </Button>
          </div>
        </div>

        {/* Confirmation Modal for Extension Decision (Section 5) */}
        <Modal
          isOpen={confirmModalAction !== null}
          onClose={() => setConfirmModalAction(null)}
          title=""
          maxWidth="md"
        >
          <div className="text-left space-y-4 py-1">
            <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 mb-2">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl font-bold text-brand-950">
              {confirmModalAction === 'approve' ? 'Approve Trial Extension?' : 'Decline Extension Request?'}
            </h3>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              {confirmModalAction === 'approve'
                ? `Approving will add +${request.trial?.extension?.requestedDays || 7} days to the trial period for ${request.petName}. ${request.adopterName} will be notified immediately.`
                : `Declining will keep the current trial end date. ${request.adopterName} will be notified to continue bonding and prepare for the final decision.`}
            </p>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-brand-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmModalAction(null)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant={confirmModalAction === 'approve' ? 'primary' : 'danger'}
                size="sm"
                isLoading={isProcessing}
                onClick={() => handleConfirmExtension(confirmModalAction === 'approve')}
              >
                {confirmModalAction === 'approve' ? 'Confirm Approval' : 'Confirm Decline'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Confirmation Modal for Adoption Request Approval (Phase 10) */}
        <Modal
          isOpen={showApproveModal}
          onClose={() => setShowApproveModal(false)}
          title=""
          maxWidth="md"
        >
          <div className="text-left space-y-4 py-1">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl font-bold text-brand-950">
              Approve Adoption Request & Start Trial?
            </h3>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              Approving this application will advance <strong>{request.petName}</strong> into the Foster-to-Own bonding trial with <strong>{request.adopterName}</strong>. Any competing active applications for {request.petName} will be safely closed.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-brand-800">
                Home Check & Handover Note (Optional):
              </label>
              <textarea
                rows={2}
                value={providerNote}
                onChange={(e) => setProviderNote(e.target.value)}
                placeholder="e.g. Home environment pre-approved. Starting 14-day Foster-to-Own bonding trial."
                className="w-full px-3 py-2 rounded-xl border border-brand-200 text-xs font-medium text-brand-950 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-brand-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowApproveModal(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                isLoading={isProcessing}
                onClick={handleApprove}
                leftIcon={<CheckCircle2 className="w-4 h-4 text-white" />}
              >
                Confirm Approval ❤️
              </Button>
            </div>
          </div>
        </Modal>

        {/* Confirmation Modal for Adoption Request Rejection (Phase 10) */}
        <Modal
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          title=""
          maxWidth="md"
        >
          <div className="text-left space-y-4 py-1">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-700 mb-2">
              <XCircle className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl font-bold text-brand-950">
              Decline Adoption Application?
            </h3>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              Are you sure you want to decline this application for <strong>{request.petName}</strong>? Please provide a reason to help <strong>{request.adopterName}</strong> understand the decision.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-brand-800">
                Reason for Applicant:
              </label>
              <textarea
                rows={3}
                value={providerNote}
                onChange={(e) => setProviderNote(e.target.value)}
                placeholder="e.g. Current household dynamics or schedule not optimal for this specific high-energy breed."
                className="w-full px-3 py-2 rounded-xl border border-brand-200 text-xs font-medium text-brand-950 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-brand-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowRejectModal(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                isLoading={isProcessing}
                onClick={handleReject}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};
