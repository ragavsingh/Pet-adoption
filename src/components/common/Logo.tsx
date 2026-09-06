import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'beige' | 'auto';
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  variant = 'auto',
  showTagline = true,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: { img: 'h-9 w-9', text: 'text-base', sub: 'text-[10px]' },
    md: { img: 'h-11 w-11', text: 'text-xl', sub: 'text-xs' },
    lg: { img: 'h-16 w-16', text: 'text-2xl md:text-3xl', sub: 'text-sm' },
  }[size];

  return (
    <Link to="/" className={`inline-flex items-center gap-3 group select-none ${className}`}>
      {/* Brand Paw Icon with Face from original logo */}
      <div className="relative shrink-0 transition-transform duration-300 group-hover:scale-105">
        <img
          src="/logo-icon.png"
          alt="PET ADOPTION Paw Logo"
          className={`${sizeClasses.img} object-contain rounded-full shadow-sm`}
        />
      </div>

      <div className="flex flex-col">
        <span
          className={`font-display font-extrabold tracking-tight uppercase transition-colors leading-none ${sizeClasses.text} ${
            variant === 'light'
              ? 'text-brand-50 group-hover:text-brand-200'
              : 'text-brand-800 group-hover:text-brand-700'
          }`}
        >
          PET ADOPTION
        </span>
        {showTagline && (
          <span
            className={`font-medium italic tracking-wide mt-0.5 ${sizeClasses.sub} ${
              variant === 'light' ? 'text-brand-300/80' : 'text-brand-600/90'
            }`}
          >
            Find a friend. Give them a forever home.
          </span>
        )}
      </div>
    </Link>
  );
};
