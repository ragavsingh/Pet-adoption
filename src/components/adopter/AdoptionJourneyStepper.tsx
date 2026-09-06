import React from 'react';
import { CheckCircle2, Circle, Heart, Sparkles, Clock } from 'lucide-react';

interface AdoptionJourneyStepperProps {
  petName?: string;
  currentStep?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}

export const AdoptionJourneyStepper: React.FC<AdoptionJourneyStepperProps> = ({
  petName = 'Bruno',
  currentStep = 5,
  className = '',
}) => {
  const steps = [
    { id: 1, label: 'Profile Created', desc: 'Lifestyle & home verified' },
    { id: 2, label: 'Pet Discovered', desc: `Found ${petName}` },
    { id: 3, label: 'Request Sent', desc: 'Application submitted' },
    { id: 4, label: 'Provider Approved', desc: 'Home check completed' },
    { id: 5, label: `Trial With ${petName}`, desc: 'Foster-to-own bonding' },
    { id: 6, label: 'Make It Official', desc: 'Forever family ❤️' },
  ];

  return (
    <div
      className={`bg-surface rounded-3xl border border-brand-200/80 shadow-soft p-6 sm:p-7 space-y-5 text-left ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-brand-100">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-500 block">
            Milestone Progress
          </span>
          <h3 className="font-display text-lg font-bold text-brand-950 flex items-center gap-2">
            <span>MY ADOPTION JOURNEY</span>
            <Sparkles className="w-4 h-4 text-brand-600" />
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse" />
          <span>Step {currentStep} of {steps.length}: In Progress</span>
        </div>
      </div>

      {/* Stepper Grid / Horizontal Trail */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-1">
        {steps.map((step) => {
          const isDone = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isPending = step.id > currentStep;

          return (
            <div
              key={step.id}
              className={`p-3.5 rounded-2xl border transition-all relative flex flex-col justify-between min-h-[110px] ${
                isCurrent
                  ? 'bg-brand-900 text-white border-brand-950 shadow-md ring-2 ring-brand-400 ring-offset-2 scale-102'
                  : isDone
                  ? 'bg-brand-50 text-brand-900 border-brand-200/80'
                  : 'bg-surface text-brand-400 border-brand-100 opacity-70'
              }`}
            >
              {/* Top Row: Indicator & Step Number */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                  Step 0{step.id}
                </span>

                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : isCurrent ? (
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-300 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-400" />
                  </span>
                ) : (
                  <Circle className="w-3.5 h-3.5 text-brand-300 shrink-0" />
                )}
              </div>

              {/* Title & Micro Description */}
              <div className="pt-2">
                <span
                  className={`text-xs font-bold block leading-tight ${
                    isCurrent ? 'text-white font-display text-sm' : isDone ? 'text-brand-950' : 'text-brand-500'
                  }`}
                >
                  {isDone ? `✓ ${step.label}` : isCurrent ? `● ${step.label}` : `○ ${step.label}`}
                </span>
                <span
                  className={`text-[10px] mt-1 block leading-tight ${
                    isCurrent ? 'text-brand-200' : isDone ? 'text-brand-600' : 'text-brand-400'
                  }`}
                >
                  {step.desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
