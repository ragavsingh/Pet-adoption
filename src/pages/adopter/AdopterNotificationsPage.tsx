import React from 'react';
import { useNotifications } from '../../contexts/NotificationsContext';
import { Button } from '../../components/common/Button';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getNotificationConfig, resolveNotificationRoute } from '../../utils/notificationConfig';

export const AdopterNotificationsPage: React.FC = () => {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-widest bg-brand-100 px-3.5 py-1 rounded-full">
            Inbox
          </span>
          <h1 className="font-display text-3xl font-extrabold text-brand-950 mt-2">
            Notifications & Updates
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            Status changes on your adoption applications and foster trials.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            leftIcon={<CheckCheck className="w-4 h-4" />}
          >
            Mark All as Read ({unreadCount})
          </Button>
        )}
      </div>

      {isLoading && notifications.length === 0 ? (
        <div className="bg-surface rounded-3xl border border-brand-200 p-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto" />
          <p className="text-xs text-brand-muted">Loading your notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-surface rounded-3xl border border-brand-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="font-display text-lg font-bold text-brand-900">
            You're all caught up!
          </h3>
          <p className="text-xs text-brand-muted">
            You will receive updates here as providers review your applications and foster trials.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const visual = getNotificationConfig(notif.type);
            const IconComponent = visual.icon;
            const targetRoute = resolveNotificationRoute(notif, 'adopter');

            return (
              <button
                key={notif.id}
                type="button"
                onClick={() => {
                  markAsRead(notif.id);
                  if (targetRoute) navigate(targetRoute);
                }}
                className={`w-full text-left p-4 sm:p-5 rounded-2xl sm:rounded-3xl border cursor-pointer transition-all flex items-start gap-3 sm:gap-4 ${
                  !notif.read
                    ? 'bg-surface border-brand-300 shadow-card hover:bg-brand-50/50'
                    : 'bg-surface/70 border-brand-200/80 hover:bg-white text-brand-700'
                }`}
              >
                {notif.petImage ? (
                  <img
                    src={notif.petImage}
                    alt=""
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl object-cover border border-brand-200 shrink-0"
                  />
                ) : (
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${visual.iconBgClass} flex items-center justify-center ${visual.iconColorClass} shrink-0`}>
                    <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start sm:items-center justify-between gap-x-2 gap-y-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
                      <h4 className="font-display text-xs sm:text-sm font-bold text-brand-950 leading-snug break-words">
                        {notif.title}
                      </h4>
                      <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-semibold border ${visual.badgeClass} shrink-0 inline-flex items-center`}>
                        {visual.badgeLabel}
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-medium text-brand-400 shrink-0 whitespace-nowrap ml-auto sm:ml-0">
                      {notif.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-brand-muted mt-1 leading-relaxed break-words">
                    {notif.message}
                  </p>
                </div>

                {!notif.read && (
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-brand-700 shrink-0 mt-1.5 sm:mt-2" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
