import React from 'react';
import { TrialStatus } from '../../types/adoptionRequest';
import { Sparkles, Clock, AlertCircle, Heart, CheckCircle2, RefreshCw } from 'lucide-react';

interface TrialStatusBadgeProps {
  status: TrialStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TrialStatusBadge: React.FC<TrialStatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'Trial Active':
        return {
          label: 'Trial Active',
          classes: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
          dot: 'bg-emerald-500',
          icon: Clock,
        };
      case 'Ending Soon':
        return {
          label: 'Ending Soon',
          classes: 'bg-amber-50 text-amber-900 border-amber-300',
          dot: 'bg-amber-500 animate-pulse',
          icon: AlertCircle,
        };
      case 'Extension Requested':
        return {
          label: 'Extension Requested',
          classes: 'bg-brand-100 text-brand-900 border-brand-300',
          dot: 'bg-brand-600 animate-pulse',
          icon: RefreshCw,
        };
      case 'Trial Extended':
        return {
          label: 'Trial Extended',
          classes: 'bg-brand-50 text-brand-800 border-brand-200',
          dot: 'bg-brand-500',
          icon: CheckCircle2,
        };
      case 'Ready to Make Official':
        return {
          label: 'Ready to Make Official',
          classes: 'bg-rose-50 text-rose-800 border-rose-200 shadow-sm',
          dot: 'bg-rose-500 animate-heart-pulse',
          icon: Heart,
        };
      case 'Trial Expired':
        return {
          label: 'Trial Expired',
          classes: 'bg-zinc-100 text-zinc-700 border-zinc-300',
          dot: 'bg-zinc-400',
          icon: Clock,
        };
      case 'Adoption Completed':
        return {
          label: 'Adoption Completed ❤️',
          classes: 'bg-brand-900 text-white border-brand-950 shadow-sm',
          dot: 'bg-brand-300',
          icon: Heart,
        };
      case 'Trial Starting':
      default:
        return {
          label: 'Trial Starting',
          classes: 'bg-brand-50 text-brand-800 border-brand-200',
          dot: 'bg-brand-500',
          icon: Sparkles,
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border transition-all ${config.classes} ${sizeClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
      <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  );
};
