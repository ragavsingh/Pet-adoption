import React, { useState } from 'react';
import { AdoptionRequest, TrialStatus } from '../../types/adoptionRequest';
import { Button } from '../common/Button';
import { TrialStatusBadge } from '../common/TrialStatusBadge';
import { TrialCountdown, calculateTrialCountdown } from '../common/TrialCountdown';
import { MakeOfficialModal } from './MakeOfficialModal';
import { ExtendTrialModal } from './ExtendTrialModal';
import { useToast } from '../../contexts/ToastContext';
import { adoptionService } from '../../services/adoptionService';
import { trialExtensionService } from '../../services/trialExtensionService';
import { trialService } from '../../services/trialService';
import {
  Calendar,
  Clock,
  Heart,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Phone,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

interface FosterTrialCardProps {
  request: AdoptionRequest;
  onUpdate?: () => void;
  className?: string;
}

export const FosterTrialCard: React.FC<FosterTrialCardProps> = ({
  request,
  onUpdate,
  className = '',
}) => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [makeOfficialOpen, setMakeOfficialOpen] = useState(false);
  const [extendTrialOpen, setExtendTrialOpen] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState('');

  const trial = request.trial;
  if (!trial) return null;

  const countdown = calculateTrialCountdown(trial.startDate, trial.endDate);

  // Derive granular status
  let derivedStatus: TrialStatus = 'Trial Active';
  if (request.status === 'Completed') {
    derivedStatus = 'Adoption Completed';
  } else if (trial.extensionRequested || trial.extension?.status === 'pending') {
    derivedStatus = 'Extension Requested';
  } else if (trial.extension?.status === 'approved') {
    derivedStatus = 'Trial Extended';
  } else if (countdown.isExpired) {
    derivedStatus = 'Trial Expired';
  } else if (countdown.isEndingSoon) {
    derivedStatus = 'Ending Soon';
  }

  const handleMakeOfficial = async () => {
    try {
      await adoptionService.makeAdoptionOfficial(trial.id || request.id);
      showToast(`IT'S OFFICIAL ❤️ Welcome ${request.petName} to your forever family!`, 'success');
      if (onUpdate) onUpdate();
      navigate(`/adoption-success/${request.petId}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to complete adoption. Please try again.', 'error');
    }
  };

  const handleRequestExtension = async (days: 3 | 7 | 14, note: string) => {
    try {
      await trialExtensionService.requestExtension(trial.id || request.id, days, note);
      showToast(`Extension request sent (+${days} days). Waiting for provider review.`, 'info');
      if (onUpdate) onUpdate();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit trial extension request.', 'error');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      if (trial.id) {
        await trialService.addJournalEntry(trial.id, newNote.trim());
      }
      if (!trial.notes) trial.notes = [];
      trial.notes.push(`Day ${countdown.currentDay}: ${newNote.trim()}`);
      setNewNote('');
      setIsAddingNote(false);
      showToast('Journal note saved to foster trial log.', 'success');
      if (onUpdate) onUpdate();
    } catch (err: any) {
      showToast(err.message || 'Failed to save note.', 'error');
    }
  };

  return (
    <div
      className={`bg-surface rounded-3xl border-2 border-brand-200/90 shadow-soft-lg p-6 sm:p-8 space-y-6 relative overflow-hidden text-left ${className}`}
    >
      {/* Decorative Warm Accent Accent Top Border */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-400 via-brand-600 to-brand-800" />

      {/* Top Banner: Pet Thumbnail, Title, Badge & Days Remaining */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-brand-100">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <img
              src={request.petImage}
              alt={request.petName}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-2 border-brand-300 shadow-md"
            />
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand-700 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <TrialStatusBadge status={derivedStatus} size="sm" />
              {trial.extensionRequested && (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                  Waiting for provider approval
                </span>
              )}
            </div>

            <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-950 tracking-tight">
              {request.petName}'s Trial Journey
            </h3>

            <p className="text-xs text-brand-muted flex flex-wrap items-center gap-2">
              <span>Rescue Provider:</span>
              <strong className="text-brand-900 font-semibold">{request.providerName}</strong>
              <span>•</span>
              <span className="text-brand-500">{request.providerLocation}</span>
            </p>
          </div>
        </div>

        {/* Big Countdown Number Callout */}
        <div className="bg-brand-50/90 rounded-2xl p-4 border border-brand-200/80 text-left md:text-right shrink-0 min-w-[180px]">
          <span className="text-[11px] font-bold text-brand-500 uppercase tracking-wider block">
            {countdown.isExpired ? 'Trial Status' : 'Remaining Time'}
          </span>
          <div className="font-display text-3xl font-extrabold text-brand-900 mt-0.5">
            {countdown.isExpired ? (
              <span className="text-brand-600">Ended</span>
            ) : countdown.daysRemaining === 0 ? (
              <span className="text-amber-700">Ends Today</span>
            ) : (
              <>
                {countdown.daysRemaining}{' '}
                <span className="text-base font-bold text-brand-600">days left</span>
              </>
            )}
          </div>
          <span className="text-xs text-brand-500 font-medium block mt-0.5">
            Day {countdown.currentDay} of {countdown.totalDays} Total
          </span>
        </div>
      </div>

      {/* Gentle Reassurance Quote (Section 1) */}
      <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-100 flex items-start gap-3">
        <Heart className="w-5 h-5 text-brand-600 shrink-0 mt-0.5 fill-brand-200" />
        <p className="text-xs sm:text-sm text-brand-800 leading-relaxed font-medium">
          "You're getting to know {request.petName}. Take your time and see how you both fit into each other's lives."
        </p>
      </div>

      {/* Dynamic Visual Countdown Component (Section 2) */}
      <div className="p-5 rounded-2xl bg-surface border border-brand-200/80 space-y-2">
        <TrialCountdown
          startDate={trial.startDate}
          endDate={trial.endDate}
          variant="full"
        />
      </div>

      {/* Trial Expired Alert Banner if applicable (Section 9) */}
      {countdown.isExpired && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2 text-xs animate-fade-in">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Your trial with {request.petName} has ended.</span>
          </div>
          <p className="text-amber-800 leading-relaxed">
            Ready to welcome {request.petName} officially into your forever family, or need to speak with {request.providerName}?
          </p>
        </div>
      )}

      {/* Prominent Pending Extension Request Banner */}
      {trial.extension && (trial.extensionRequested || trial.extension.status === 'pending') && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border-2 border-amber-300 text-amber-950 shadow-soft-sm space-y-3 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                <Clock className="w-5 h-5 text-amber-800" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-display text-base font-bold text-amber-950">
                    Trial Extension Requested (+{trial.extension.requestedDays || 3} Days)
                  </h4>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300 uppercase tracking-wider">
                    Pending Provider Review
                  </span>
                </div>
                <span className="text-xs text-amber-800 font-medium">
                  Submitted {trial.extension.requestedAt ? new Date(trial.extension.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'recently'}
                </span>
              </div>
            </div>
          </div>

          {trial.extension.reason && (
            <div className="p-3 bg-white/90 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-relaxed italic">
              "{trial.extension.reason}"
            </div>
          )}

          <p className="text-xs text-amber-800 leading-snug">
            Rescue provider <strong>{request.providerName}</strong> has received your extension request. Your current 14-day bonding trial remains active and protected while your application is reviewed.
          </p>
        </div>
      )}

      {/* Prominent Approved Extension Banner */}
      {trial.extension && trial.extension.status === 'approved' && (
        <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 shadow-soft-sm space-y-2.5 animate-fade-in">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-200 text-emerald-900 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5 text-emerald-800" />
              </div>
              <div>
                <h4 className="font-display text-base font-bold text-emerald-950">
                  Trial Extension Approved (+{trial.extension.requestedDays} Days)
                </h4>
                <span className="text-xs text-emerald-800 font-medium">
                  New trial end date: <strong>{new Date(trial.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                </span>
              </div>
            </div>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 border border-emerald-300 uppercase tracking-wider">
              Approved
            </span>
          </div>

          {trial.extension.providerResponse && (
            <div className="p-3 bg-white/90 rounded-2xl border border-emerald-200 text-xs text-emerald-900 leading-relaxed italic">
              Provider Note: "{trial.extension.providerResponse}"
            </div>
          )}
        </div>
      )}

      {/* Trial Notes / Foster Journal */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="font-display text-sm font-bold text-brand-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand-600" />
            <span>Foster Journal & Daily Bonding Notes</span>
          </h4>
          <button
            type="button"
            onClick={() => setIsAddingNote(!isAddingNote)}
            className="text-xs font-bold text-brand-700 hover:text-brand-950 transition-colors"
          >
            {isAddingNote ? 'Cancel' : '+ Add Note'}
          </button>
        </div>

        {isAddingNote && (
          <form onSubmit={handleAddNote} className="space-y-2 animate-fade-in">
            <textarea
              rows={2}
              required
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder={`Note something about ${request.petName}'s day, habits, or routine...`}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-brand-200 text-xs text-brand-950 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingNote(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save to Journal
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {trial.notes && trial.notes.length > 0 ? (
            trial.notes.map((note, i) => (
              <div
                key={i}
                className="p-3 rounded-2xl bg-brand-50/70 border border-brand-100 text-xs text-brand-800 leading-relaxed"
              >
                {note}
              </div>
            ))
          ) : (
            <p className="text-xs text-brand-muted italic py-1">
              No journal entries logged yet. Record your daily observations to celebrate milestones!
            </p>
          )}
        </div>
      </div>

      {/* Main Actions: Make It Official & Extend Trial (Section 1, 3, 4, 9) */}
      <div className="pt-4 border-t border-brand-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {countdown.isExpired ? (
            <Link to="/contact" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="w-full" leftIcon={<Phone className="w-4 h-4" />}>
                Contact Provider
              </Button>
            </Link>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setExtendTrialOpen(true)}
              disabled={trial.extensionRequested}
              className="w-full sm:w-auto"
            >
              {trial.extensionRequested ? 'Waiting for Provider Approval' : 'Extend Trial'}
            </Button>
          )}

          <Link to={`/pets/${request.petId}`} className="hidden sm:inline-block">
            <Button variant="cream" size="md">
              View Pet Profile
            </Button>
          </Link>
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={() => setMakeOfficialOpen(true)}
          leftIcon={<Heart className="w-4 h-4 fill-white" />}
          className="w-full sm:w-auto shadow-md"
        >
          Make It Official ❤️
        </Button>
      </div>

      {/* Interactive Confirmation Modals */}
      <MakeOfficialModal
        isOpen={makeOfficialOpen}
        petName={request.petName}
        petImage={request.petImage}
        providerName={request.providerName}
        onConfirm={handleMakeOfficial}
        onClose={() => setMakeOfficialOpen(false)}
      />

      <ExtendTrialModal
        isOpen={extendTrialOpen}
        petName={request.petName}
        daysRemaining={countdown.daysRemaining}
        providerName={request.providerName}
        onConfirm={handleRequestExtension}
        onClose={() => setExtendTrialOpen(false)}
      />
    </div>
  );
};
