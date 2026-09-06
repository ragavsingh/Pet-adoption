import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, Heart, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'heart';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div 
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-3 bg-brand-950 text-brand-50 px-4 py-3.5 rounded-2xl shadow-soft-lg border border-brand-800 animate-slide-down transition-all"
          >
            {toast.type === 'heart' && (
              <div className="w-8 h-8 rounded-full bg-brand-700/80 flex items-center justify-center shrink-0 text-brand-200">
                <Heart className="w-4 h-4 fill-brand-300 stroke-brand-300" />
              </div>
            )}
            {toast.type === 'success' && (
              <div className="w-8 h-8 rounded-full bg-status-available/20 flex items-center justify-center shrink-0 text-status-available">
                <CheckCircle className="w-4 h-4" />
              </div>
            )}
            {toast.type === 'error' && (
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 text-red-400">
                <AlertCircle className="w-4 h-4" />
              </div>
            )}
            {toast.type === 'info' && (
              <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center shrink-0 text-brand-200">
                <Info className="w-4 h-4" />
              </div>
            )}
            <p className="text-sm font-medium text-brand-100 flex-1 leading-snug">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-brand-400 hover:text-brand-100 transition-colors p-1"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
