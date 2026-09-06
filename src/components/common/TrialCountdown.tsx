import React from 'react';
import { Clock, AlertCircle, Calendar } from 'lucide-react';

export interface TrialCountdownData {
  daysElapsed: number;
  daysRemaining: number;
  currentDay: number;
  totalDays: number;
  progressPercent: number;
  isEndingSoon: boolean;
  isExpired: boolean;
  isUpcoming: boolean;
  statusText: string;
}

export function calculateTrialCountdown(startDateStr: string, endDateStr: string): TrialCountdownData {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const now = new Date();

  // Normalize to day boundaries
  const startMs = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const endMs = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  const nowMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const totalDurationMs = Math.max(1, endMs - startMs);
  const totalDays = Math.max(1, Math.round(totalDurationMs / (1000 * 60 * 60 * 24)));

  const elapsedMs = nowMs - startMs;
  const daysElapsed = Math.max(0, Math.floor(elapsedMs / (1000 * 60 * 60 * 24)));

  // Current day is 1-indexed (e.g., Day 1 to Day 14)
  const currentDay = Math.min(totalDays, Math.max(1, daysElapsed + 1));

  const remainingMs = endMs - nowMs;
  const daysRemaining = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));

  const progressPercent = Math.min(100, Math.max(0, Math.round((currentDay / totalDays) * 100)));

  const isUpcoming = nowMs < startMs;
  const isExpired = nowMs > endMs || daysRemaining === 0;
  const isEndingSoon = !isExpired && !isUpcoming && daysRemaining <= 3;

  let statusText = 'Active';
  if (isUpcoming) statusText = 'Upcoming';
  else if (isExpired) statusText = 'Expired';
  else if (isEndingSoon) statusText = 'Ending Soon';

  return {
    daysElapsed,
    daysRemaining,
    currentDay,
    totalDays,
    progressPercent,
    isEndingSoon,
    isExpired,
    isUpcoming,
    statusText,
  };
}

interface TrialCountdownProps {
  startDate: string;
  endDate: string;
  variant?: 'compact' | 'full' | 'inline';
  className?: string;
}

export const TrialCountdown: React.FC<TrialCountdownProps> = ({
  startDate,
  endDate,
  variant = 'full',
  className = '',
}) => {
  const { currentDay, totalDays, daysRemaining, progressPercent, isEndingSoon, isExpired, isUpcoming } =
    calculateTrialCountdown(startDate, endDate);

  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${isEndingSoon ? 'text-amber-700' : isExpired ? 'text-brand-500' : 'text-brand-800'} ${className}`}>
        <Clock className="w-3.5 h-3.5" />
        {isExpired ? (
          <span>Trial Ended</span>
        ) : isUpcoming ? (
          <span>Starts Soon</span>
        ) : daysRemaining === 0 ? (
          <span>Trial Ending Today</span>
        ) : (
          <span>{daysRemaining} day{daysRemaining === 1 ? '' : 's'} left</span>
        )}
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`p-3 rounded-2xl bg-brand-50 border border-brand-200/80 text-center ${className}`}>
        <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider block">
          Day {currentDay} of {totalDays}
        </span>
        <div className="font-display text-xl font-extrabold text-brand-900 mt-0.5">
          {isExpired ? 'Ended' : `${daysRemaining}d left`}
        </div>
      </div>
    );
  }

  // Full variant: Day counter, days remaining badge, and visual progress bar
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-brand-900 font-display">
            Day {currentDay} of {totalDays}
          </span>
          {isEndingSoon && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
              Ending Soon
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-brand-700 bg-brand-100/80 px-2.5 py-1 rounded-full">
          <Clock className="w-3.5 h-3.5" />
          <span>
            {isExpired
              ? 'Trial Ended'
              : isUpcoming
              ? 'Starts Soon'
              : daysRemaining === 0
              ? 'Trial ending today'
              : `${daysRemaining} days left`}
          </span>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="space-y-1">
        <div className="w-full h-3 rounded-full bg-brand-100 overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              isExpired
                ? 'bg-brand-400'
                : isEndingSoon
                ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                : 'bg-gradient-to-r from-brand-500 via-brand-600 to-brand-700'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[11px] text-brand-muted font-medium pt-0.5">
          <span>Start: {new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          <span>{progressPercent}% Elapsed</span>
          <span>End: {new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>
      </div>
    </div>
  );
};
