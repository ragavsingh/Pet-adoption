import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Clock, Calendar, MessageSquare, Send } from 'lucide-react';

interface ExtendTrialModalProps {
  isOpen: boolean;
  petName: string;
  daysRemaining: number;
  providerName: string;
  onConfirm: (days: 3 | 7 | 14, note: string) => Promise<void> | void;
  onClose: () => void;
}

export const ExtendTrialModal: React.FC<ExtendTrialModalProps> = ({
  isOpen,
  petName,
  daysRemaining,
  providerName,
  onConfirm,
  onClose,
}) => {
  const [selectedDays, setSelectedDays] = useState<3 | 7 | 14>(7);
  const [reason, setReason] = useState('We are continuing gradual bonding with our daily routine and would love a few more days.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirm(selectedDays, reason);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="text-left space-y-6 py-1">
        {/* Header Icon & Title */}
        <div className="space-y-1.5 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 mx-auto sm:mx-0 mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="font-display text-2xl font-bold text-brand-950">
            Need a little more time?
          </h3>
          <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
            You can request a trial extension from <strong className="text-brand-900">{providerName}</strong> to continue getting to know {petName}.
          </p>
        </div>

        {/* Current Trial Info Card */}
        <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200/80 flex items-center justify-between text-xs">
          <div>
            <span className="text-brand-500 font-bold uppercase tracking-wider text-[10px] block">
              Current Trial Status
            </span>
            <span className="font-bold text-sm text-brand-950 font-display">
              {daysRemaining} days remaining
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-brand-100 text-brand-800 font-semibold text-[11px]">
            Active Foster Period
          </span>
        </div>

        {/* Duration Selection (3, 7, 14 days) */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider">
            Select Extension Period
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {[3, 7, 14].map((d) => {
              const days = d as 3 | 7 | 14;
              const isSelected = selectedDays === days;
              return (
                <button
                  key={days}
                  type="button"
                  onClick={() => setSelectedDays(days)}
                  className={`p-3.5 rounded-2xl border-2 text-center transition-all ${
                    isSelected
                      ? 'border-brand-700 bg-brand-100/50 text-brand-950 shadow-sm'
                      : 'border-brand-200 hover:border-brand-300 bg-surface text-brand-800'
                  }`}
                >
                  <span className="text-lg font-extrabold font-display block">+{days}</span>
                  <span className="text-[11px] font-semibold text-brand-600 block">Days</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Reason / Note to Provider */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider">
            Note to Provider (Optional)
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Share why you'd like more time with your foster pet..."
            className="w-full px-3.5 py-2.5 rounded-2xl border border-brand-200 text-xs text-brand-950 leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-brand-100">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            leftIcon={<Send className="w-4 h-4" />}
            className="shadow-sm"
          >
            Request Extension (+{selectedDays}d)
          </Button>
        </div>
      </form>
    </Modal>
  );
};
