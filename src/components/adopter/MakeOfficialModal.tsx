import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Heart, Sparkles, Home, ShieldCheck } from 'lucide-react';

interface MakeOfficialModalProps {
  isOpen: boolean;
  petName: string;
  petImage?: string;
  providerName: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

export const MakeOfficialModal: React.FC<MakeOfficialModalProps> = ({
  isOpen,
  petName,
  petImage,
  providerName,
  onConfirm,
  onClose,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
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
      <div className="text-center space-y-6 py-2">
        {/* Heart Icon & Celebration Avatar */}
        <div className="relative inline-block mx-auto">
          {petImage ? (
            <div className="relative">
              <img
                src={petImage}
                alt={petName}
                className="w-24 h-24 rounded-full object-cover border-4 border-brand-200 shadow-md mx-auto"
              />
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-brand-700 text-white flex items-center justify-center shadow-lg animate-heart-pulse">
                <Heart className="w-5 h-5 fill-white" />
              </div>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
              <Heart className="w-8 h-8 fill-rose-600" />
            </div>
          )}
        </div>

        {/* Modal Copy */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Foster-to-Own Milestone</span>
          </div>
          <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-950">
            Ready to make {petName} part of your family?
          </h3>
          <p className="text-xs sm:text-sm text-brand-muted max-w-sm mx-auto leading-relaxed">
            Making it official means <strong className="text-brand-900">{petName}</strong> will become part of your forever family. Your adoption pledge will be recorded and an official Certificate of Adoption will be issued.
          </p>
        </div>

        {/* Milestone Card */}
        <div className="p-4 rounded-2xl bg-brand-50/80 border border-brand-200/80 text-left space-y-2 text-xs">
          <div className="flex items-center justify-between text-brand-800">
            <span className="flex items-center gap-1.5 font-semibold">
              <Home className="w-3.5 h-3.5 text-brand-600" />
              <span>Forever Sanctuary:</span>
            </span>
            <strong className="text-brand-950">Approved Adopter Home</strong>
          </div>
          <div className="flex items-center justify-between text-brand-800">
            <span className="flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
              <span>Rescue Verification:</span>
            </span>
            <strong className="text-brand-950">{providerName}</strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Not Yet
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleConfirm}
            isLoading={isSubmitting}
            leftIcon={<Heart className="w-4 h-4 fill-white" />}
            className="w-full sm:w-auto shadow-md order-1 sm:order-2"
          >
            Make It Official ❤️
          </Button>
        </div>
      </div>
    </Modal>
  );
};
