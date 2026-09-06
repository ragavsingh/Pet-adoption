import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { reportService } from '../../services/reportService';
import { ReportTargetType } from '../../types/report';
import { useToast } from '../../contexts/ToastContext';
import { Flag, AlertCircle } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetName: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetName,
}) => {
  const [reason, setReason] = useState('Misleading or inaccurate pet details');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      reportService.submitReport({
        reporterName: 'Anonymous Reporter',
        targetType,
        targetId,
        targetName,
        reason,
        description,
      });

      setIsSubmitting(false);
      showToast('Report submitted for admin review. Thank you for protecting animal welfare.', 'success');
      setDescription('');
      onClose();
    }, 600);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Listing or User"
      description={`Submit a concern regarding "${targetName}". Our moderation team reviews all reports strictly.`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div>
          <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5">
            Reason for Report
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl border border-brand-200 bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm text-brand-950 font-medium"
          >
            <option value="Misleading or inaccurate pet details">Misleading or inaccurate pet details</option>
            <option value="Commercial selling or fee demand (Pets are not products)">
              Commercial selling or fee demand (Pets are not products)
            </option>
            <option value="Animal welfare or health concern">Animal welfare or health concern</option>
            <option value="Suspected fraudulent account">Suspected fraudulent account</option>
            <option value="Inappropriate communication">Inappropriate communication</option>
            <option value="Other concern">Other concern</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5">
            Detailed Description <span className="text-brand-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please provide specific details or context to help our moderators investigate..."
            className="w-full px-4 py-3 rounded-2xl border border-brand-200 bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm text-brand-950 leading-relaxed placeholder:text-brand-muted/70"
          />
        </div>

        <div className="bg-brand-50 p-3 rounded-2xl border border-brand-200/80 flex items-start gap-2.5 text-xs text-brand-700 leading-relaxed">
          <AlertCircle className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
          <span>
            PET ADOPTION has a strict zero-tolerance policy against unethical breeding, commercial selling, or pet neglect.
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            leftIcon={<Flag className="w-3.5 h-3.5" />}
          >
            Submit Report
          </Button>
        </div>
      </form>
    </Modal>
  );
};
