import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { ConfirmModal } from '../components/common/ConfirmModal';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

type ConfirmFunction = (options: ConfirmOptions | string) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFunction | null>(null);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFunction>((opts) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      if (typeof opts === 'string') {
        setOptions({
          title: 'Please Confirm',
          message: opts,
          confirmText: 'Confirm',
          cancelText: 'Cancel',
          isDestructive: true,
        });
      } else {
        setOptions({
          title: opts.title || 'Please Confirm',
          message: opts.message,
          confirmText: opts.confirmText || 'Confirm',
          cancelText: opts.cancelText || 'Cancel',
          isDestructive: opts.isDestructive !== undefined ? opts.isDestructive : true,
        });
      }
      setIsLoading(false);
      setIsOpen(true);
    });
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmModal
        isOpen={isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={options.title}
        message={options.message}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        isDestructive={options.isDestructive}
        isLoading={isLoading}
      />
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return ctx;
};
