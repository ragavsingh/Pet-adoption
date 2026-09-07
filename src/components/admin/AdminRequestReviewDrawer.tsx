import React, { useState, useEffect, useRef } from 'react';
import {
  AdoptionRequest,
  AdoptionVerification,
  VerificationStep,
  getDefaultVerification,
} from '../../types/adoptionRequest';
import { Button } from '../common/Button';
import { StatusBadge } from '../common/StatusBadge';
import { useToast } from '../../contexts/ToastContext';
import { adoptionService } from '../../services/adoptionService';
import { trialExtensionService } from '../../services/trialExtensionService';
import { calculateTrialCountdown } from '../common/TrialCountdown';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  Home,
  User,
  Heart,
  CheckSquare,
  Square,
  ChevronRight,
  ChevronDown,
  FileText,
  Clock,
  Calendar,
  AlertCircle,
  Sparkles,
  Check,
  Mail,
  Phone,
  MapPin,
  HelpCircle,
  BookOpen,
  Award,
  Printer,
  ExternalLink,
  Copy,
  Lock,
  Download,
  Loader2,
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { adoptionCompletionService } from '../../services/adoptionCompletionService';
import { AdoptionRecord } from '../../types/adoption';
import {
  downloadCertificateAsImage,
  printCertificateIsolated,
} from '../../utils/certificateDownloader';

interface AdminRequestReviewDrawerProps {
  request: AdoptionRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedReq: AdoptionRequest) => void;
}

type DrawerTab = 'certificate' | 'verification' | 'details' | 'trial';

export const AdminRequestReviewDrawer: React.FC<AdminRequestReviewDrawerProps> = ({
  request,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const { showToast } = useToast();
  const [verification, setVerification] = useState<AdoptionVerification>(() => {
    const base = request?.verification || getDefaultVerification(request || {});
    if (request?.status === 'Approved' || request?.status === 'Completed') {
      return {
        ...base,
        level: 4,
        percentage: 100,
        statusTitle:
          request.status === 'Completed'
            ? 'Level 4: Certified & Sealed (Adoption Completed)'
            : 'Level 4: Fully Approved & Foster-to-Own Trial Active',
        steps: base.steps.map((s) => ({
          ...s,
          completed: true,
          checks: s.checks.map((c) => ({ ...c, checked: true })),
        })),
      };
    }
    return base;
  });
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingExtension, setIsProcessingExtension] = useState(false);
  const [extensionResponseNote, setExtensionResponseNote] = useState('');
  const [activeTab, setActiveTab] = useState<DrawerTab>(() =>
    request?.status === 'Completed' ? 'certificate' : 'verification'
  );
  const [adoptionRecord, setAdoptionRecord] = useState<AdoptionRecord | null>(null);
  const [expandedLevels, setExpandedLevels] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
  });
  const certificateCardRef = useRef<HTMLDivElement>(null);
  const [isDownloadingCertificate, setIsDownloadingCertificate] = useState(false);

  // Re-sync verification and state when opened or request changes
  useEffect(() => {
    if (request) {
      let initialVer = request.verification || getDefaultVerification(request);
      if (request.status === 'Approved' || request.status === 'Completed') {
        initialVer = {
          ...initialVer,
          level: 4,
          percentage: 100,
          statusTitle:
            request.status === 'Completed'
              ? 'Level 4: Certified & Sealed (Adoption Completed)'
              : 'Level 4: Fully Approved & Foster-to-Own Trial Active',
          steps: initialVer.steps.map((s) => ({
            ...s,
            completed: true,
            checks: s.checks.map((c) => ({ ...c, checked: true })),
          })),
        };
      }
      setVerification(initialVer);
      setAdminNotes(request.reviewNotes || '');
      setExtensionResponseNote('');
      if (request.status === 'Completed') {
        setActiveTab('certificate');
        adoptionCompletionService.getAdoptionRecordByPetId(request.petId).then((rec) => {
          if (rec) setAdoptionRecord(rec);
        });
      } else {
        setActiveTab('verification');
        setAdoptionRecord(null);
      }
    }
  }, [request]);

  if (!isOpen || !request) return null;

  const isCompleted = request.status === 'Completed';
  const isApproved = request.status === 'Approved';
  const isCancelled = request.status === 'Cancelled';
  const isRejected = request.status === 'Rejected';
  const isApprovedOrCompleted = isApproved || isCompleted;
  const isLocked = isCompleted || isApproved || isCancelled || isRejected;
  const isActionable = !isLocked;

  const certificateNumber =
    adoptionRecord?.certificateNumber ||
    request.adoption?.certificateNumber ||
    `PA-2026-${request.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;

  const adoptionDateFormatted = adoptionRecord?.adoptionDate
    ? new Date(adoptionRecord.adoptionDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : request.adoption?.adoptionDate
    ? new Date(request.adoption.adoptionDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : new Date(request.updatedAt || request.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

  const handleCopyCertificateNumber = () => {
    navigator.clipboard.writeText(certificateNumber);
    showToast(`Certificate number ${certificateNumber} copied to clipboard!`, 'success');
  };

  const handleDownloadCertificate = async () => {
    if (!certificateCardRef.current || !request) return;
    setIsDownloadingCertificate(true);
    try {
      const cleanPetName = request.petName.trim().replace(/[^a-zA-Z0-9_-]/g, '-');
      const filename = `Adoption-Certificate-${cleanPetName}-${certificateNumber}`;
      const success = await downloadCertificateAsImage(certificateCardRef.current, filename);
      if (success) {
        showToast('Adoption Certificate downloaded successfully as high-resolution PNG!', 'success');
      } else {
        showToast('Direct download unavailable in current view. Opening print preview...', 'info');
        printCertificateIsolated(
          certificateCardRef.current,
          `Adoption Certificate - ${request.petName} - ${certificateNumber}`
        );
      }
    } catch (err) {
      console.error('Failed to download certificate:', err);
      showToast('Error generating certificate download.', 'error');
    } finally {
      setIsDownloadingCertificate(false);
    }
  };

  const handlePrintCertificate = () => {
    if (!certificateCardRef.current || !request) {
      window.print();
      return;
    }
    printCertificateIsolated(
      certificateCardRef.current,
      `Adoption Certificate - ${request.petName} - ${certificateNumber}`
    );
  };

  const trial = request.trial;
  const countdown =
    trial && trial.startDate && trial.endDate
      ? calculateTrialCountdown(trial.startDate, trial.endDate)
      : null;

  const hasPendingExtension = Boolean(
    trial?.extensionRequested || trial?.extension?.status === 'pending'
  );
  const pendingDays = trial?.extension?.requestedDays || 7;
  const pendingReason =
    trial?.extension?.reason || 'Continuing gradual bonding and integration.';

  // Toggle individual checklist item
  const handleToggleCheck = (stepLevel: number, checkId: string) => {
    if (isCompleted) {
      showToast('Adoption is officially completed. Verification checklist is permanently locked.', 'info');
      return;
    }
    if (isApproved) {
      showToast('Adoption trial is already approved. Verification checklist is permanently locked.', 'info');
      return;
    }
    if (isCancelled) {
      showToast('Application was cancelled by the applicant. Verification checklist is read-only.', 'info');
      return;
    }
    if (isRejected) {
      showToast('Application was declined. Verification checklist is read-only.', 'info');
      return;
    }

    const updatedSteps = verification.steps.map((step) => {
      if (step.level !== stepLevel) return step;

      const updatedChecks = step.checks.map((check) =>
        check.id === checkId ? { ...check, checked: !check.checked } : check
      );

      const allCompleted = updatedChecks.every((c) => c.checked);
      return {
        ...step,
        checks: updatedChecks,
        completed: allCompleted,
      };
    });

    recalculateProgress(updatedSteps);
  };

  // Mark an entire level as complete or incomplete (enforcing progressive verification)
  const handleToggleLevel = (stepLevel: number, complete: boolean) => {
    if (isCompleted) {
      showToast('Adoption is officially completed. Verification checklist is permanently locked.', 'info');
      return;
    }
    if (isApproved) {
      showToast('Adoption trial is already approved. Verification checklist is permanently locked.', 'info');
      return;
    }
    if (isCancelled) {
      showToast('Application was cancelled by the applicant. Verification checklist is read-only.', 'info');
      return;
    }
    if (isRejected) {
      showToast('Application was declined. Verification checklist is read-only.', 'info');
      return;
    }

    const updatedSteps = verification.steps.map((step) => {
      if (complete && step.level <= stepLevel) {
        return {
          ...step,
          completed: true,
          checks: step.checks.map((c) => ({ ...c, checked: true })),
        };
      }
      if (!complete && step.level >= stepLevel) {
        return {
          ...step,
          completed: false,
          checks: step.checks.map((c) => ({ ...c, checked: false })),
        };
      }
      return step;
    });

    recalculateProgress(updatedSteps);
  };

  const recalculateProgress = (steps: VerificationStep[]) => {
    const totalChecks = steps.reduce((acc, s) => acc + s.checks.length, 0);
    const checkedCount = steps.reduce(
      (acc, s) => acc + s.checks.filter((c) => c.checked).length,
      0
    );

    const calculatedPercentage =
      totalChecks > 0 ? Math.round((checkedCount / totalChecks) * 100) : 0;

    let level = 1;
    let statusTitle = 'Level 1: Applicant Screening & Details Verified';

    if (calculatedPercentage >= 100) {
      level = 4;
      statusTitle = 'Level 4: Fully Approved & Foster-to-Own Trial Active';
    } else if (calculatedPercentage >= 75) {
      level = 3;
      statusTitle = 'Level 3: Care Readiness & Compatibility Cleared';
    } else if (calculatedPercentage >= 50) {
      level = 2;
      statusTitle = 'Level 2: Housing & Living Environment Cleared';
    } else if (calculatedPercentage >= 25) {
      level = 1;
      statusTitle = 'Level 1: Applicant Screening & Details Verified';
    } else {
      level = 1;
      statusTitle = 'Level 1: Verification in Progress';
    }

    setVerification({
      ...verification,
      level,
      percentage: calculatedPercentage,
      statusTitle,
      steps,
      lastUpdated: new Date().toISOString(),
    });
  };

  // Save current step-wise verification without changing to Approved
  const handleSaveProgress = async () => {
    if (isLocked) {
      showToast('Verification cannot be modified for locked or concluded applications.', 'info');
      return;
    }
    try {
      setIsProcessing(true);
      const updated = await adoptionService.adminManageRequest(
        request.id,
        'update_verification',
        adminNotes.trim() || undefined,
        verification
      );
      showToast(
        `Verification updated: Level ${verification.level} (${verification.percentage}%)`,
        'success'
      );
      onUpdated(updated);
    } catch (err: any) {
      showToast(err?.message || 'Failed to save verification progress.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // 100% Full Approval (Level 4, all steps & checks completed)
  const handleApprove = async () => {
    if (isCancelled) {
      showToast('Cannot approve an application that was cancelled by the applicant.', 'error');
      return;
    }
    if (isLocked) {
      showToast('Application is already approved or concluded.', 'info');
      return;
    }
    try {
      setIsProcessing(true);
      const note = adminNotes.trim() || 'Verified and approved by Platform Administration.';

      const fullyApprovedVerification: AdoptionVerification = {
        level: 4,
        percentage: 100,
        statusTitle: 'Level 4: Fully Approved & Foster-to-Own Trial Active',
        lastUpdated: new Date().toISOString(),
        steps: verification.steps.map((s) => ({
          ...s,
          completed: true,
          checks: s.checks.map((c) => ({ ...c, checked: true })),
        })),
      };

      const updated = await adoptionService.adminManageRequest(
        request.id,
        'approve',
        note,
        fullyApprovedVerification
      );
      setVerification(fullyApprovedVerification);
      showToast(
        `Adoption application for ${request.petName} approved! 🎉 14-day Foster-to-Own trial initiated.`,
        'success'
      );
      onUpdated(updated);
      onClose();
    } catch (err: any) {
      showToast(err?.message || 'Failed to approve adoption application.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reject Application
  const handleReject = async () => {
    if (isLocked) {
      showToast('Application is already concluded and locked.', 'info');
      return;
    }
    const reason = adminNotes.trim();
    if (!reason) {
      showToast('Please provide a review note or reason for rejection.', 'error');
      return;
    }
    try {
      setIsProcessing(true);
      const updated = await adoptionService.adminManageRequest(
        request.id,
        'reject',
        reason,
        verification
      );
      showToast('Adoption application rejected.', 'info');
      onUpdated(updated);
      onClose();
    } catch (err: any) {
      showToast(err?.message || 'Failed to reject adoption application.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Admin approves trial extension request
  const handleApproveExtension = async () => {
    if (!request || !trial) return;
    try {
      setIsProcessingExtension(true);
      await trialExtensionService.approveExtension(
        trial.id || request.id,
        extensionResponseNote.trim() || undefined
      );
      showToast(
        `Trial extension of +${pendingDays} days approved! New trial end date active. Both adopter and rescue notified.`,
        'success'
      );

      const currentEnd = new Date(trial.endDate);
      currentEnd.setDate(currentEnd.getDate() + pendingDays);
      const newEndDate = currentEnd.toISOString().split('T')[0];

      const updatedTrial = {
        ...trial,
        endDate: newEndDate,
        totalDays: (trial.totalDays || 14) + pendingDays,
        extensionRequested: false,
        extension: trial.extension
          ? { ...trial.extension, status: 'approved' as const }
          : undefined,
        notes: [
          ...(trial.notes || []),
          `Platform Admin approved +${pendingDays} days extension. New trial end date: ${newEndDate}.`,
        ],
      };

      const updatedReq: AdoptionRequest = { ...request, trial: updatedTrial };
      onUpdated(updatedReq);
    } catch (err: any) {
      showToast(err?.message || 'Failed to approve extension.', 'error');
    } finally {
      setIsProcessingExtension(false);
    }
  };

  // Admin declines trial extension request
  const handleRejectExtension = async () => {
    if (!request || !trial) return;
    try {
      setIsProcessingExtension(true);
      await trialExtensionService.rejectExtension(
        trial.id || request.id,
        extensionResponseNote.trim() || 'Extension request declined by Platform Admin.'
      );
      showToast('Trial extension request declined.', 'info');

      const updatedTrial = {
        ...trial,
        extensionRequested: false,
        extension: trial.extension
          ? { ...trial.extension, status: 'declined' as const }
          : undefined,
        notes: [
          ...(trial.notes || []),
          'Platform Admin declined trial extension request.',
        ],
      };
      const updatedReq: AdoptionRequest = { ...request, trial: updatedTrial };
      onUpdated(updatedReq);
    } catch (err: any) {
      showToast(err?.message || 'Failed to decline extension.', 'error');
    } finally {
      setIsProcessingExtension(false);
    }
  };

  // Toggle accordion section
  const toggleAccordion = (level: number) => {
    setExpandedLevels((prev) => ({ ...prev, [level]: !prev[level] }));
  };

  const getProgressColor = (pct: number) => {
    if (pct >= 100) return 'from-emerald-500 to-teal-600';
    if (pct >= 75) return 'from-brand-500 to-emerald-600';
    if (pct >= 50) return 'from-blue-500 to-brand-600';
    return 'from-amber-400 to-orange-500';
  };

  const getBadgeColor = (level: number) => {
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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-fade-in">
      <div className="w-full max-w-2xl bg-surface h-full shadow-2xl flex flex-col justify-between overflow-hidden border-l border-brand-200">
        {/* Header */}
        <div className="p-6 border-b border-brand-100 bg-brand-50/50 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={request.petImage}
              alt={request.petName}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-200 shrink-0 shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display text-xl font-bold text-brand-950">
                  {request.petName}
                </h3>
                <StatusBadge status={request.status} size="sm" />
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getBadgeColor(
                    verification.level
                  )}`}
                >
                  Level {verification.level} of 4 ({verification.percentage}%)
                </span>
                {isCompleted ? (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1 shadow-xs">
                    <Sparkles className="w-3 h-3 text-emerald-700" />
                    Forever Home Finalized
                  </span>
                ) : isCancelled ? (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-900 border border-red-300 flex items-center gap-1 shadow-xs">
                    <AlertCircle className="w-3 h-3 text-red-600" />
                    Application Cancelled
                  </span>
                ) : isApproved ? (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1 shadow-xs">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Trial Active (100% Verified)
                  </span>
                ) : countdown ? (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-700" />
                    {countdown.isExpired
                      ? 'Trial Ended'
                      : `Day ${countdown.currentDay}/${countdown.totalDays} (${countdown.daysRemaining}d left)`}
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-brand-600 font-semibold mt-0.5">
                {request.petBreed} • Shelter: <span className="text-brand-900">{request.providerName}</span>
              </p>
              <p className="text-xs text-brand-muted">
                Applicant: <strong className="text-brand-900">{request.adopterName}</strong>
                {request.adopterLocation ? ` (${request.adopterLocation})` : request.adopterEmail ? ` (${request.adopterEmail})` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-brand-400 hover:text-brand-700 hover:bg-brand-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-brand-100 bg-surface px-6 pt-2 overflow-x-auto">
          {isCompleted && (
            <button
              onClick={() => setActiveTab('certificate')}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'certificate'
                  ? 'border-emerald-600 text-emerald-950 font-black'
                  : 'border-transparent text-brand-500 hover:text-brand-800'
              }`}
            >
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Adoption Certificate</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                Official
              </span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('verification')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'verification'
                ? 'border-brand-600 text-brand-900'
                : 'border-transparent text-brand-400 hover:text-brand-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Step-Wise Verification ({verification.percentage}%)</span>
            {isLocked && <Lock className="w-3 h-3 text-emerald-600" />}
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'details'
                ? 'border-brand-600 text-brand-900'
                : 'border-transparent text-brand-400 hover:text-brand-700'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Applicant Profile & Questionnaire</span>
          </button>
          {(isApprovedOrCompleted || trial) && (
            <button
              onClick={() => setActiveTab('trial')}
              className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'trial'
                  ? 'border-brand-600 text-brand-900'
                  : 'border-transparent text-brand-400 hover:text-brand-700'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isCompleted ? 'Foster Journal & History' : 'Foster Trial & Countdown'}</span>
              {hasPendingExtension && !isCompleted && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
          )}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Banner: Celebratory Adoption Hero Banner when Completed, or Alert when Cancelled, or Live Trial Countdown when in Trial */}
          {isCompleted ? (
            <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-950 via-brand-950 to-emerald-900 text-white shadow-soft-lg space-y-3.5 border-2 border-emerald-500/40 animate-fade-in">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
                        Official Adoption Complete
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/40">
                        Forever Home Confirmed ❤️
                      </span>
                    </div>
                    <h4 className="font-display text-base sm:text-lg font-bold text-white mt-0.5">
                      {request.petName} has found a forever home with {request.adopterName}!
                    </h4>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('certificate')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-brand-950 transition-colors shadow-xs shrink-0 cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>View Certificate</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                <div className="p-2.5 bg-white/5 rounded-2xl border border-white/10">
                  <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">
                    Certificate No
                  </span>
                  <span className="font-mono font-bold text-xs text-white block mt-0.5 truncate">
                    {certificateNumber}
                  </span>
                </div>
                <div className="p-2.5 bg-white/5 rounded-2xl border border-white/10">
                  <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">
                    Adoption Date
                  </span>
                  <span className="font-bold text-xs text-white block mt-0.5">
                    {adoptionDateFormatted}
                  </span>
                </div>
                <div className="p-2.5 bg-white/5 rounded-2xl border border-white/10 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">
                    Verification Status
                  </span>
                  <span className="font-bold text-xs text-emerald-200 block mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Level 4 Certified & Sealed
                  </span>
                </div>
              </div>
            </div>
          ) : isCancelled ? (
            <div className="p-5 rounded-3xl bg-gradient-to-br from-red-950 via-brand-950 to-neutral-900 text-white shadow-soft-lg space-y-2 border-2 border-red-500/40 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-400/40 flex items-center justify-center text-red-300 shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-400">
                      Application Cancelled
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/30 text-red-200 border border-red-400/40">
                      Withdrawn by Applicant
                    </span>
                  </div>
                  <h4 className="font-display text-base font-bold text-white mt-0.5">
                    This adoption application was cancelled by {request.adopterName}.
                  </h4>
                </div>
              </div>
              <p className="text-xs text-brand-200 pl-13">
                The applicant withdrew this adoption request. The verification checklist is archived and read-only.
              </p>
            </div>
          ) : isRejected ? (
            <div className="p-5 rounded-3xl bg-gradient-to-br from-neutral-900 via-brand-950 to-neutral-900 text-white shadow-soft-lg space-y-2 border-2 border-brand-500/30 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-500/20 border border-brand-400/40 flex items-center justify-center text-brand-300 shrink-0">
                  <X className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-400">
                      Application Declined
                    </span>
                  </div>
                  <h4 className="font-display text-base font-bold text-white mt-0.5">
                    This adoption request has been declined.
                  </h4>
                </div>
              </div>
              <p className="text-xs text-brand-300 pl-13">
                Verification checklist is archived and read-only.
              </p>
            </div>
          ) : (
            trial && countdown && isApprovedOrCompleted && (
              <div className="space-y-3">
                {/* Pending Day Extension Review Card */}
                {hasPendingExtension && (
                  <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border-2 border-amber-300 text-amber-950 shadow-soft-sm space-y-3 animate-fade-in">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-2xl bg-amber-200 flex items-center justify-center text-amber-800 shrink-0 font-black text-xs shadow-xs">
                          ⚡
                        </span>
                        <div>
                          <h4 className="font-display text-sm font-bold text-amber-950">
                            Adopter Requested Trial Extension: +{pendingDays} Days
                          </h4>
                          <p className="text-xs text-amber-800 mt-0.5">
                            Submitted by <strong className="text-amber-950">{request.adopterName}</strong>
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 uppercase tracking-wider">
                        Action Required
                      </span>
                    </div>

                    <div className="p-3 bg-white/90 rounded-2xl border border-amber-200 text-xs text-amber-900 italic leading-relaxed">
                      "{pendingReason}"
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <div className="text-[11px] text-amber-800 font-medium">
                        Projected End Date: <strong className="text-amber-950">
                          {new Date(
                            new Date(trial.endDate).setDate(new Date(trial.endDate).getDate() + pendingDays)
                          ).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </strong>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRejectExtension}
                          disabled={isProcessingExtension}
                          className="text-red-700 border-red-200 hover:bg-red-50 text-xs"
                        >
                          Decline
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleApproveExtension}
                          disabled={isProcessingExtension}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve (+{pendingDays} Days)</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Live Countdown Day Card */}
                <div className="p-4 sm:p-5 rounded-3xl bg-surface border-2 border-brand-200 shadow-soft-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-brand-600" />
                      <span className="text-xs font-bold text-brand-900 uppercase tracking-wider">
                        Foster-to-Own Live Countdown
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        hasPendingExtension
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : countdown.isExpired
                          ? 'bg-red-100 text-red-800 border-red-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {hasPendingExtension
                        ? 'Extension Pending Review'
                        : countdown.isExpired
                        ? 'Trial Expired'
                        : 'Trial Active'}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div>
                      <div className="font-display text-2xl sm:text-3xl font-black text-brand-950">
                        {countdown.isExpired ? (
                          <span className="text-red-600">Trial Period Ended</span>
                        ) : countdown.daysRemaining === 0 ? (
                          <span className="text-amber-700">Ends Today</span>
                        ) : (
                          <>
                            {countdown.daysRemaining}{' '}
                            <span className="text-sm font-bold text-brand-600">days left</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-brand-muted mt-0.5 font-medium">
                        Day {countdown.currentDay} of {countdown.totalDays} Total Trial Days
                      </p>
                    </div>

                    <div className="text-xs text-brand-700 bg-brand-50/80 p-3 rounded-2xl border border-brand-100 space-y-1 sm:text-right">
                      <div className="flex sm:justify-end items-center gap-1 text-[11px] text-brand-500">
                        <Calendar className="w-3 h-3" />
                        <span>Trial Duration:</span>
                      </div>
                      <div className="font-bold text-brand-900">
                        {new Date(trial.startDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        –{' '}
                        {new Date(trial.endDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-brand-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-600 via-teal-500 to-emerald-600 transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(5, (countdown.currentDay / Math.max(1, countdown.totalDays)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          )}

          {/* TAB 0: OFFICIAL ADOPTION CERTIFICATE */}
          {activeTab === 'certificate' && (
            <div className="space-y-6 animate-fade-in">
              {/* Quick Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-brand-50/70 rounded-2xl border border-brand-200">
                <div className="flex items-center gap-2 text-xs text-brand-700">
                  <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Official Certificate: <strong className="font-mono text-brand-950 font-bold">{certificateNumber}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyCertificateNumber}
                    className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl bg-surface hover:bg-brand-100 text-brand-800 border border-brand-200 transition-colors cursor-pointer shadow-2xs"
                    title="Copy Certificate Registration Number"
                  >
                    <Copy className="w-3.5 h-3.5 text-brand-600" />
                    <span>Copy ID</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadCertificate}
                    disabled={isDownloadingCertificate}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                    title="Download high-resolution PNG image of this certificate only"
                  >
                    {isDownloadingCertificate ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>{isDownloadingCertificate ? 'Generating...' : 'Download PNG'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintCertificate}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-xl bg-surface hover:bg-brand-100 text-brand-800 border border-brand-200 transition-colors cursor-pointer shadow-2xs"
                    title="Print or Save as PDF (Certificate Only)"
                  >
                    <Printer className="w-3.5 h-3.5 text-brand-600" />
                    <span>Print / PDF</span>
                  </button>
                  <a
                    href={`/adoption-success/${request.petId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-brand-100 hover:bg-brand-200 text-brand-900 border border-brand-300 transition-colors cursor-pointer shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Full Screen</span>
                  </a>
                </div>
              </div>

              {/* Elegant Certificate Card */}
              <div
                ref={certificateCardRef}
                id="printable-adoption-certificate"
                className="relative bg-surface rounded-3xl p-6 sm:p-10 border-4 border-double border-brand-300 shadow-soft-lg text-brand-950 text-center space-y-6 overflow-hidden print:border-4 print:shadow-none"
              >
                {/* Subtle Decorative Background Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                  <Heart className="w-80 h-80 fill-brand-900" />
                </div>

                {/* Certificate Header */}
                <div className="space-y-2 border-b border-brand-200 pb-5">
                  <div className="flex justify-center mb-1">
                    <Logo size="md" showTagline={false} />
                  </div>
                  <span className="text-[10px] font-extrabold tracking-[0.25em] text-brand-600 uppercase block">
                    Official Document of Care & Sanctuary
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-900 tracking-tight">
                    CERTIFICATE OF ADOPTION
                  </h3>
                  <span className="inline-block px-3 py-0.5 rounded-full bg-brand-100 text-brand-800 text-[10px] font-mono font-bold tracking-wider border border-brand-200">
                    REGISTRATION NO: {certificateNumber}
                  </span>
                </div>

                {/* Certificate Body */}
                <div className="space-y-3 py-1">
                  <p className="text-xs uppercase tracking-widest text-brand-500 font-semibold">
                    This certifies that
                  </p>

                  <div className="py-1">
                    <span className="font-display text-3xl sm:text-4xl font-extrabold text-brand-800 tracking-tight block">
                      {request.petName.toUpperCase()}
                    </span>
                    <span className="text-xs font-bold text-brand-600 tracking-wider uppercase mt-1 block">
                      {request.petBreed} • Shelter: {request.providerName}
                    </span>
                  </div>

                  <p className="text-xs uppercase tracking-widest text-brand-500 font-semibold">
                    has officially found a loving forever home with
                  </p>

                  <span className="font-display text-2xl sm:text-3xl font-bold text-brand-950 tracking-tight block">
                    {request.adopterName}
                  </span>
                </div>

                {/* Pet Image with Heart Badge */}
                <div className="flex justify-center my-3">
                  <div className="relative p-1.5 rounded-full border-2 border-brand-300 bg-brand-50 shadow-xs">
                    <img
                      src={request.petImage}
                      alt={request.petName}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover"
                    />
                    <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand-700 text-white flex items-center justify-center shadow">
                      <Heart className="w-4 h-4 fill-white" />
                    </div>
                  </div>
                </div>

                {/* Signatures & Seal */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-brand-200 text-xs">
                  <div>
                    <span className="text-brand-400 block mb-1 text-[10px] uppercase tracking-wider font-bold">
                      Date of Adoption
                    </span>
                    <p className="font-bold text-brand-900 text-xs sm:text-sm">{adoptionDateFormatted}</p>
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-emerald-500 bg-emerald-50/60 flex flex-col items-center justify-center text-emerald-800 shadow-2xs">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="text-[8px] font-extrabold uppercase mt-0.5 tracking-tight">Verified</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-brand-400 block mb-1 text-[10px] uppercase tracking-wider font-bold">
                      Verified Provider
                    </span>
                    <p className="font-bold text-brand-900 text-xs sm:text-sm">{request.providerName}</p>
                  </div>
                </div>

                {/* Ethical Pledge */}
                <p className="text-[11px] text-brand-400/90 italic max-w-md mx-auto pt-1">
                  "A pet is a lifelong promise of safety, gentleness, nutrition, and companionship."
                </p>
              </div>
            </div>
          )}

          {/* TAB 1: STEP-WISE VERIFICATION PIPELINE */}
          {activeTab === 'verification' && (
            <div className="space-y-6">
              {/* Completed & Locked Status Alert Banner */}
              {isCompleted && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-between gap-3 text-emerald-950 shadow-xs animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-200/80 flex items-center justify-center text-emerald-800 shrink-0">
                      <Lock className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                        Verification 100% Certified & Permanently Locked
                      </h5>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        This adoption was officially finalized on {adoptionDateFormatted}. All verification criteria are archived and cannot be unchecked or edited.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-900 border border-emerald-300 shrink-0 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-800" />
                    Archived
                  </span>
                </div>
              )}

              {/* Approved & Active Trial Status Alert Banner */}
              {isApproved && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-between gap-3 text-emerald-950 shadow-xs animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-200/80 flex items-center justify-center text-emerald-800 shrink-0">
                      <Lock className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                        Foster-to-Own Trial Approved & Checklist Locked
                      </h5>
                      <p className="text-[11px] text-emerald-800 mt-0.5">
                        Application passed 100% verification and is actively in its bonding trial. Verification criteria are sealed and cannot be modified.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-900 border border-emerald-300 shrink-0 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-800" />
                    Trial Active
                  </span>
                </div>
              )}

              {/* Cancelled Status Alert Banner */}
              {isCancelled && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-300 flex items-center justify-between gap-3 text-red-950 shadow-xs animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-200/80 flex items-center justify-center text-red-800 shrink-0">
                      <Lock className="w-5 h-5 text-red-700" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-red-950 uppercase tracking-wider flex items-center gap-1.5">
                        Application Cancelled by Applicant — Checklist Archived
                      </h5>
                      <p className="text-[11px] text-red-800 mt-0.5">
                        The applicant cancelled this trial request. Verification items are read-only and no approval actions are available.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-200 text-red-900 border border-red-300 shrink-0 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-red-800" />
                    Cancelled
                  </span>
                </div>
              )}

              {/* Rejected Status Alert Banner */}
              {isRejected && (
                <div className="p-4 rounded-2xl bg-brand-100 border border-brand-300 flex items-center justify-between gap-3 text-brand-950 shadow-xs animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-200/80 flex items-center justify-center text-brand-800 shrink-0">
                      <Lock className="w-5 h-5 text-brand-700" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-brand-950 uppercase tracking-wider flex items-center gap-1.5">
                        Application Declined — Checklist Archived
                      </h5>
                      <p className="text-[11px] text-brand-800 mt-0.5">
                        This adoption request has been declined. Verification criteria are archived.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-brand-200 text-brand-900 border border-brand-300 shrink-0 flex items-center gap-1">
                    <X className="w-3 h-3 text-brand-800" />
                    Declined
                  </span>
                </div>
              )}

              {/* Approval Percentage Banner */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-brand-900 via-brand-950 to-brand-900 text-white shadow-soft-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-300">
                      Adoption Verification Pipeline
                    </span>
                  </div>
                  <span className="text-lg font-black text-emerald-400">
                    {verification.percentage}%
                  </span>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full bg-white/10 h-3.5 rounded-full overflow-hidden p-0.5 border border-white/10">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(
                      verification.percentage
                    )} transition-all duration-500 ease-out`}
                    style={{ width: `${Math.max(5, verification.percentage)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-brand-200 pt-1">
                  <span>
                    Status: <strong className="text-white">{verification.statusTitle}</strong>
                  </span>
                  <span className="font-semibold text-brand-300">
                    Level {verification.level} / 4 {isLocked && '🔒'}
                  </span>
                </div>
              </div>

              {/* Step-by-Step Level Cards */}
              <div className="space-y-3">
                {verification.steps.map((step) => {
                  const isExpanded = expandedLevels[step.level] ?? true;
                  const stepChecks = step.checks || [];
                  const completedChecks = isApprovedOrCompleted
                    ? stepChecks.length
                    : stepChecks.filter((c) => c.checked).length;
                  const isFullyChecked = isApprovedOrCompleted || (completedChecks === stepChecks.length && stepChecks.length > 0);

                  return (
                    <div
                      key={step.id}
                      className={`rounded-3xl border transition-all overflow-hidden ${
                        isFullyChecked
                          ? 'border-emerald-200 bg-emerald-50/20 shadow-xs'
                          : 'border-brand-200/90 bg-surface'
                      }`}
                    >
                      {/* Level Card Header */}
                      <div
                        onClick={() => toggleAccordion(step.level)}
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-brand-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs transition-colors ${
                              isFullyChecked || isApprovedOrCompleted
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : isCancelled
                                ? 'bg-red-100 text-red-700'
                                : 'bg-brand-100 text-brand-700'
                            }`}
                          >
                            {isFullyChecked || isApprovedOrCompleted ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              step.level
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-display text-sm font-bold text-brand-950">
                                {step.title}
                              </h4>
                              <span className="text-[10px] text-brand-400 font-semibold">
                                ({completedChecks}/{stepChecks.length} verified)
                              </span>
                            </div>
                            <p className="text-xs text-brand-muted mt-0.5">
                              {step.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isCompleted ? (
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Verified & Locked</span>
                            </span>
                          ) : isApproved ? (
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Approved & Locked</span>
                            </span>
                          ) : isCancelled ? (
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                              <span>Cancelled</span>
                            </span>
                          ) : isRejected ? (
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-brand-100 text-brand-700 border border-brand-200 flex items-center gap-1">
                              <X className="w-3.5 h-3.5 text-brand-500" />
                              <span>Declined</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleLevel(step.level, !isFullyChecked);
                              }}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                                isFullyChecked
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-brand-100 text-brand-700 hover:bg-brand-200'
                              }`}
                            >
                              {isFullyChecked ? 'Completed' : `Pass Level ${step.level}`}
                            </button>
                          )}
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-brand-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-brand-400" />
                          )}
                        </div>
                      </div>

                      {/* Criteria Checklist Items */}
                      {isExpanded && (
                        <div className="px-5 pb-4 pt-1 divide-y divide-brand-100 border-t border-brand-100/60">
                          {stepChecks.map((check) => {
                            const isItemChecked = isApproved || isCompleted || check.checked;
                            return (
                              <div
                                key={check.id}
                                onClick={() => {
                                  if (isActionable) {
                                    handleToggleCheck(step.level, check.id);
                                  }
                                }}
                                className={`py-2.5 flex items-start gap-3 rounded-xl px-2 transition-colors ${
                                  !isActionable
                                    ? 'cursor-default select-none'
                                    : 'cursor-pointer group hover:bg-brand-50/30'
                                }`}
                              >
                                <div className="mt-0.5 shrink-0 text-brand-600">
                                  {isItemChecked ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <Square className={`w-4 h-4 ${isCancelled ? 'text-brand-300' : 'text-brand-300 group-hover:text-brand-500'}`} />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <span
                                    className={`text-xs font-semibold block leading-tight ${
                                      isItemChecked ? 'text-brand-950 font-bold' : 'text-brand-700'
                                    }`}
                                  >
                                    {check.label}
                                  </span>
                                  {check.description && (
                                    <span className="text-[11px] text-brand-400 block mt-0.5">
                                      {check.description}
                                    </span>
                                  )}
                                </div>
                                {isApprovedOrCompleted && (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                                    Passed
                                  </span>
                                )}
                                {isCancelled && (
                                  <span className="text-[10px] font-bold text-brand-500 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200 shrink-0">
                                    Archived
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Admin Review Notes Input */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold text-brand-900 uppercase tracking-wider">
                  Admin Verification Notes & Instructions {isLocked && '(Archived)'}
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => {
                    if (isActionable) setAdminNotes(e.target.value);
                  }}
                  readOnly={!isActionable}
                  placeholder={
                    isCompleted
                      ? 'Adoption officially completed. Verification notes are archived.'
                      : isApproved
                      ? 'Adoption trial approved and active. Verification notes are locked.'
                      : isCancelled
                      ? 'Application was cancelled by applicant. Verification notes are archived.'
                      : isRejected
                      ? 'Application was declined. Verification notes are archived.'
                      : 'E.g., Contact verified. Living space approved for medium breed. Pre-approval granted for 14-day Foster-to-Own trial.'
                  }
                  rows={3}
                  className={`w-full p-3 rounded-2xl border text-xs transition-all ${
                    !isActionable
                      ? 'bg-brand-50/50 border-brand-200 text-brand-800 cursor-not-allowed'
                      : 'border-brand-200 text-brand-900 bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-brand-300'
                  }`}
                />
              </div>
            </div>
          )}

          {/* TAB 2: APPLICANT PROFILE & QUESTIONNAIRE DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-5">
              {/* Applicant Header Card */}
              <div className="bg-brand-50/70 rounded-3xl p-5 border border-brand-200 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-brand-100">
                  {request.adopterAvatar && !request.adopterAvatar.includes('unsplash') ? (
                    <img
                      src={request.adopterAvatar}
                      alt={request.adopterName}
                      className="w-12 h-12 rounded-2xl object-cover border border-brand-200 shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-brand-700 text-white flex items-center justify-center font-display text-lg font-bold shadow-xs shrink-0">
                      {request.adopterName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="font-display text-base font-bold text-brand-950 flex items-center gap-2">
                      {request.adopterName}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Verified Applicant
                      </span>
                    </h4>
                    <p className="text-xs font-semibold text-brand-700 mt-0.5">Adopter</p>
                    <p className="text-xs text-brand-500">
                      Applied on{' '}
                      {new Date(request.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-surface rounded-2xl border border-brand-100">
                    <span className="text-brand-400 block font-semibold text-[11px] flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-brand-500" />
                      Email Address
                    </span>
                    <a
                      href={request.adopterEmail ? `mailto:${request.adopterEmail}` : undefined}
                      className="font-bold text-brand-900 hover:text-brand-600 transition-colors mt-0.5 block"
                    >
                      {request.adopterEmail || 'Verified Adopter'}
                    </a>
                  </div>

                  <div className="p-3 bg-surface rounded-2xl border border-brand-100">
                    <span className="text-brand-400 block font-semibold text-[11px] flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-brand-500" />
                      Phone Number
                    </span>
                    <span className="font-bold text-brand-950 mt-0.5 block">
                      {request.adopterPhone || 'Phone on file (Verified)'}
                    </span>
                  </div>

                  <div className="p-3 bg-surface rounded-2xl border border-brand-100 sm:col-span-2">
                    <span className="text-brand-400 block font-semibold text-[11px] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-brand-500" />
                      Residential Location
                    </span>
                    <span className="font-bold text-brand-950 mt-0.5 block">
                      {request.adopterLocation || 'India'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Living Environment & Experience */}
              <div className="bg-surface rounded-3xl p-5 border border-brand-200 space-y-4">
                <h4 className="font-display text-sm font-bold text-brand-950 flex items-center gap-2">
                  <Home className="w-4 h-4 text-brand-600" />
                  Living Environment & Lifestyle
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-brand-50/50 rounded-2xl border border-brand-100">
                    <span className="text-brand-400 block font-semibold text-[11px]">Home Type</span>
                    <span className="font-bold text-brand-950 mt-0.5 block">
                      {request.homeType || 'Apartment'}
                    </span>
                  </div>
                  <div className="p-3 bg-brand-50/50 rounded-2xl border border-brand-100">
                    <span className="text-brand-400 block font-semibold text-[11px]">Existing Pets</span>
                    <span className="font-bold text-brand-950 mt-0.5 block">
                      {request.existingPets || 'None'}
                    </span>
                  </div>
                  <div className="p-3 bg-brand-50/50 rounded-2xl border border-brand-100">
                    <span className="text-brand-400 block font-semibold text-[11px]">Children at Home</span>
                    <span className="font-bold text-brand-950 mt-0.5 block">
                      {request.children || 'None'}
                    </span>
                  </div>
                  <div className="p-3 bg-brand-50/50 rounded-2xl border border-brand-100">
                    <span className="text-brand-400 block font-semibold text-[11px]">Pet Experience</span>
                    <span className="font-bold text-brand-950 mt-0.5 block">
                      {request.petExperience || 'Moderate experience'}
                    </span>
                  </div>
                  <div className="p-3 bg-brand-50/50 rounded-2xl border border-brand-100 sm:col-span-2">
                    <span className="text-brand-400 block font-semibold text-[11px]">Daily Time Available</span>
                    <span className="font-bold text-brand-950 mt-0.5 block">
                      {request.timeAvailable || 'Home daily (Under 4 hours away)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statement & Motivation */}
              <div className="bg-surface rounded-3xl p-5 border border-brand-200 space-y-2">
                <h4 className="font-display text-sm font-bold text-brand-950 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-600" />
                  Applicant Statement & Motivation
                </h4>
                <p className="text-xs text-brand-800 leading-relaxed bg-brand-50/50 p-4 rounded-2xl border border-brand-100">
                  {request.message ||
                    request.whyTheyWantToAdopt ||
                    'Looking for a loving companion.'}
                </p>
                {request.confirmedAccurate && (
                  <div className="flex items-center gap-2 text-[11px] text-emerald-700 font-semibold pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Applicant confirmed all statements are true and accurate under penalty of disqualification.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: FOSTER TRIAL & JOURNAL LOG */}
          {activeTab === 'trial' && trial && (
            <div className="space-y-5">
              <div className="bg-surface rounded-3xl p-5 border border-brand-200 space-y-4">
                <h4 className="font-display text-sm font-bold text-brand-950 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand-600" />
                  Foster Journal & Daily Bonding Notes
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {trial.notes && trial.notes.length > 0 ? (
                    trial.notes.map((note, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-brand-50/70 border border-brand-100 text-xs text-brand-800 leading-relaxed"
                      >
                        {note}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-brand-muted italic p-3 bg-brand-50/40 rounded-2xl">
                      No journal notes recorded yet by adopter. Bonding observations will appear here.
                    </p>
                  )}
                </div>
              </div>

              {trial.extension && (
                <div className="bg-surface rounded-3xl p-5 border border-brand-200 space-y-3">
                  <h4 className="font-display text-sm font-bold text-brand-950 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-brand-600" />
                    Extension Request History
                  </h4>
                  <div className="p-3 bg-brand-50/60 rounded-2xl border border-brand-100 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-brand-900">
                      <span>Requested: +{trial.extension.requestedDays} Days</span>
                      <span className="capitalize font-semibold text-brand-600">
                        Status: {trial.extension.status}
                      </span>
                    </div>
                    {trial.extension.reason && (
                      <p className="text-brand-700 italic">"{trial.extension.reason}"</p>
                    )}
                    {trial.extension.requestedAt && (
                      <span className="text-[10px] text-brand-400 block pt-1">
                        Submitted: {new Date(trial.extension.requestedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Footer Bar */}
        <div className="p-6 border-t border-brand-100 bg-surface flex flex-wrap items-center justify-between gap-3">
          {isCompleted ? (
            <>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="md"
                  onClick={onClose}
                  className="text-brand-700"
                >
                  Close
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleDownloadCertificate}
                  disabled={isDownloadingCertificate}
                  leftIcon={
                    isDownloadingCertificate ? (
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    ) : (
                      <Download className="w-4 h-4 text-emerald-600" />
                    )
                  }
                  className="font-bold text-brand-900 border-brand-300 hover:bg-brand-50 shadow-2xs"
                >
                  {isDownloadingCertificate ? 'Downloading...' : 'Download Certificate'}
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={handlePrintCertificate}
                  leftIcon={<Printer className="w-4 h-4 text-brand-600" />}
                  className="text-brand-800"
                >
                  Print / Save PDF
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/adoption-success/${request.petId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="primary"
                    size="md"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 shadow-md"
                  >
                    <Award className="w-4 h-4" />
                    <span>Open Full Certificate</span>
                  </Button>
                </a>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Forever Home Confirmed ❤️</span>
                </div>
              </div>
            </>
          ) : isCancelled ? (
            <>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="md"
                  onClick={onClose}
                  className="text-brand-700"
                >
                  Close
                </Button>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>Application Cancelled by Applicant (Archived)</span>
              </div>
            </>
          ) : isRejected ? (
            <>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="md"
                  onClick={onClose}
                  className="text-brand-700"
                >
                  Close
                </Button>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-brand-100 border border-brand-200 text-brand-800 text-xs font-bold">
                <X className="w-4 h-4 text-brand-600" />
                <span>Application Declined (Archived)</span>
              </div>
            </>
          ) : isApproved ? (
            <>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="md"
                  onClick={onClose}
                  className="text-brand-700"
                >
                  Close
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {hasPendingExtension && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleApproveExtension}
                    disabled={isProcessingExtension}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-2 shadow-md"
                  >
                    <Check className="w-4 h-4" />
                    Approve Extension (+{pendingDays}d)
                  </Button>
                )}
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Foster-to-Own Active (Level 4 Verified & Approved)</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleSaveProgress}
                  disabled={isProcessing}
                >
                  Save Verification ({verification.percentage}%)
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="text-red-700 border-red-200 hover:bg-red-50"
                >
                  Reject
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {hasPendingExtension && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleApproveExtension}
                    disabled={isProcessingExtension}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-2 shadow-md"
                  >
                    <Check className="w-4 h-4" />
                    Approve Extension (+{pendingDays}d)
                  </Button>
                )}

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md flex items-center gap-2"
                >
                  <Heart className="w-4 h-4 fill-white" />
                  Approve Adoption (100%)
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
