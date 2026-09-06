import React from 'react';
import { PetStatus } from '../../types/pet';
import { AdoptionRequestStatus } from '../../types/adoptionRequest';
import { CheckCircle2, Clock, Heart, PauseCircle, AlertTriangle, ShieldCheck, MessageSquare } from 'lucide-react';

interface StatusBadgeProps {
  status: PetStatus | AdoptionRequestStatus | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-0.5 gap-1 font-semibold',
    md: 'text-xs px-3 py-1 gap-1.5 font-bold',
    lg: 'text-sm px-4 py-1.5 gap-2 font-bold',
  }[size];

  switch (status) {
    case 'Available':
      return (
        <span className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 ${sizeClasses} ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          Available for Adoption
        </span>
      );

    case 'Adopted':
    case 'Adoption Completed':
    case 'Completed':
      return (
        <span className={`inline-flex items-center rounded-full bg-brand-100 text-brand-800 border border-brand-300 ${sizeClasses} ${className}`}>
          <Heart className="w-3.5 h-3.5 fill-brand-700 text-brand-700" />
          Already Adopted ❤️
        </span>
      );

    case 'Adoption Pending':
    case 'Adoption Requested':
    case 'Under Review':
      return (
        <span className={`inline-flex items-center rounded-full bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses} ${className}`}>
          <Clock className="w-3.5 h-3.5 text-amber-700" />
          {status}
        </span>
      );

    case 'Pending':
      return (
        <span className={`inline-flex items-center rounded-full bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses} ${className}`}>
          <Clock className="w-3.5 h-3.5 text-amber-700" />
          Pending Review
        </span>
      );

    case 'More Information Required':
    case 'more_information_required':
      return (
        <span className={`inline-flex items-center rounded-full bg-blue-50 text-blue-800 border border-blue-200 ${sizeClasses} ${className}`}>
          <MessageSquare className="w-3.5 h-3.5 text-blue-700" />
          More Info Required
        </span>
      );

    case 'Approved':
      return (
        <span className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 ${sizeClasses} ${className}`}>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          Approved & Trial Active
        </span>
      );

    case 'Paused':
      return (
        <span className={`inline-flex items-center rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 ${sizeClasses} ${className}`}>
          <PauseCircle className="w-3.5 h-3.5 text-zinc-600" />
          Listing Paused
        </span>
      );

    case 'Rejected':
    case 'Cancelled':
      return (
        <span className={`inline-flex items-center rounded-full bg-rose-50 text-rose-800 border border-rose-200 ${sizeClasses} ${className}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          {status}
        </span>
      );

    case 'Draft':
      return (
        <span className={`inline-flex items-center rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 ${sizeClasses} ${className}`}>
          Draft
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-brand-100 text-brand-800 border border-brand-200 ${sizeClasses} ${className}`}>
          {status}
        </span>
      );
  }
};
