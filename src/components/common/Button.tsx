import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'cream' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 select-none active:scale-[0.98] disabled:opacity-55 disabled:cursor-not-allowed disabled:active:scale-100';

    const sizeClasses = {
      sm: 'px-4 py-1.5 text-xs gap-1.5 h-8',
      md: 'px-5 py-2.5 text-sm gap-2 h-11',
      lg: 'px-7 py-3.5 text-base gap-2.5 h-13 shadow-soft',
    }[size];

    const variantClasses = {
      primary:
        'bg-brand-700 text-white hover:bg-brand-800 hover:shadow-card shadow-sm border border-brand-800/30',
      secondary:
        'bg-brand-400 text-brand-950 hover:bg-brand-500 hover:text-white shadow-sm border border-brand-400/40',
      cream:
        'bg-brand-100 text-brand-800 border border-brand-200 hover:bg-brand-200/70',
      outline:
        'bg-transparent border border-brand-300 text-brand-800 hover:bg-brand-50',
      ghost:
        'bg-transparent text-brand-800 hover:bg-brand-100/60',
      danger:
        'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100',
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
