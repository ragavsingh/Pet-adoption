import React, { useEffect } from 'react';
import { AlertTriangle, AlertCircle, X, Loader2 } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Please Confirm',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
  isLoading = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    const savedY = window.scrollY || document.documentElement.scrollTop || 0;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
      if (savedY > 0) {
        window.scrollTo({ top: savedY, behavior: 'instant' as ScrollBehavior });
      }
    };
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto overflow-x-hidden no-scrollbar-mobile"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      {/* Dark Theme Backdrop */}
      <div
        className="fixed inset-0 bg-brand-950/75 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={!isLoading ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Themed Dark Modal Card */}
      <div
        className="relative w-full max-w-sm sm:max-w-md bg-brand-950 text-brand-50 rounded-3xl shadow-soft-lg border border-brand-800/80 p-5 sm:p-7 z-10 animate-fade-in"
      >
        {/* Top Row: Icon Badge & Close Button */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              isDestructive
                ? 'bg-red-500/15 border border-red-500/30 text-red-400'
                : 'bg-brand-800/60 border border-brand-700/60 text-brand-300'
            }`}
          >
            {isDestructive ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            type="button"
            className="w-8 h-8 rounded-full bg-brand-900/70 hover:bg-brand-800 text-brand-300 hover:text-brand-100 flex items-center justify-center transition-colors shrink-0 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="text-left space-y-2">
          <h3
            id="confirm-modal-title"
            className="font-display text-lg sm:text-xl font-bold text-brand-50 tracking-tight"
          >
            {title}
          </h3>
          <p className="text-sm text-brand-200/90 leading-relaxed font-normal">
            {message}
          </p>
        </div>

        {/* Actions (Side by side on mobile and desktop) */}
        <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-brand-800/60">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-brand-200 bg-brand-900/70 hover:bg-brand-800 hover:text-brand-50 border border-brand-800/80 hover:border-brand-700 transition-all text-center disabled:opacity-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all text-center flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 active:scale-[0.98] focus-visible:outline-none ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700 text-white focus-visible:ring-2 focus-visible:ring-red-400'
                : 'bg-brand-700 hover:bg-brand-600 text-white border border-brand-600 focus-visible:ring-2 focus-visible:ring-brand-400'
            }`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
