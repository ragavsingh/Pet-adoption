import React from 'react';
import { TimelineEvent } from '../../types/adoptionRequest';
import { CheckCircle2, Clock, Circle, Award } from 'lucide-react';

interface RequestTimelineProps {
  timeline: TimelineEvent[];
  className?: string;
}

export const RequestTimeline: React.FC<RequestTimelineProps> = ({
  timeline,
  className = '',
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {timeline.map((event, index) => {
        const isLast = index === timeline.length - 1;

        return (
          <div key={event.step} className="relative flex items-start gap-4 group">
            {/* Connecting Vertical Line */}
            {!isLast && (
              <div
                className={`absolute left-4 top-8 -bottom-4 w-0.5 transition-colors duration-300 ${
                  event.completed ? 'bg-brand-700' : 'bg-brand-200'
                }`}
                aria-hidden="true"
              />
            )}

            {/* Step Icon Badge */}
            <div
              className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                event.completed
                  ? 'bg-brand-700 text-white shadow-sm'
                  : event.current
                  ? 'bg-amber-100 text-amber-800 border-2 border-amber-500 animate-pulse'
                  : 'bg-brand-100 text-brand-400 border border-brand-200'
              }`}
            >
              {event.completed ? (
                event.status === 'Completed' || event.status === 'Adoption Completed' ? (
                  <Award className="w-4 h-4" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )
              ) : event.current ? (
                <Clock className="w-4 h-4" />
              ) : (
                <span className="text-xs font-bold">{event.step}</span>
              )}
            </div>

            {/* Event Details */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <h4
                  className={`font-display text-sm font-bold tracking-tight ${
                    event.completed
                      ? 'text-brand-950'
                      : event.current
                      ? 'text-amber-900 font-extrabold'
                      : 'text-brand-400'
                  }`}
                >
                  {event.title}
                </h4>
                <span className="text-[11px] font-semibold text-brand-500">
                  {event.date}
                </span>
              </div>
              <p
                className={`text-xs mt-1 leading-relaxed ${
                  event.completed || event.current
                    ? 'text-brand-muted'
                    : 'text-brand-400/80'
                }`}
              >
                {event.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
