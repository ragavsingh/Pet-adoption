import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Activity,
  Lock,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Clock,
  Heart,
  FileText,
  Sparkles,
  Inbox,
  AlertCircle,
  Database,
  Check,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { notificationService } from '../../services/notificationService';
import { AppNotification } from '../../types/notification';
import { realtimeSync } from '../../services/realtimeSync';
import { SupabaseConnectionModal } from '../admin/SupabaseConnectionModal';
import { getAdminPath, ADMIN_BASE_PATH } from '../../utils/adminSecurity';

interface AdminTopNavProps {
  onOpenMobile: () => void;
  onLockConsole: () => void;
}

export const AdminTopNav: React.FC<AdminTopNavProps> = ({
  onOpenMobile,
  onLockConsole,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLive = adminService.isLiveRealMode();

  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);

  const getPageTitle = () => {
    const p = location.pathname;
    if (p.includes('/dashboard')) return 'Executive Telemetry Dashboard';
    if (p.includes('/requests')) return 'Adoption Requests & Step-Wise Verification';
    if (p.includes('/users')) return 'Registered Users & Access Roles';
    if (p.includes('/providers')) return 'Rescue Provider Network & Audits';
    if (p.includes('/pets')) return 'Companion Pet Listings & Safety Moderation';
    if (p.includes('/reports')) return 'Welfare & Safety Compliance Reports';
    if (p.includes('/test-bench')) return 'Live System Test Bench & Diagnostics';
    if (p.includes('/settings')) return 'Platform Governance & Storage Configuration';
    return 'Platform Administration';
  };

  const loadAdminNotifications = async () => {
    try {
      setIsLoadingNotifs(true);
      const list = await notificationService.getNotifications('usr_admin');
      setNotifications(list);
      const unread = list.filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.warn('Error loading admin notifications:', err);
    } finally {
      setIsLoadingNotifs(false);
    }
  };

  useEffect(() => {
    loadAdminNotifications();

    // Subscribe to realtime changes
    const unsubscribe = realtimeSync.subscribe((event) => {
      if (
        event.type === 'notification_received' ||
        event.type === 'foster_trial_updated' ||
        event.type === 'adoption_request_updated' ||
        event.type === 'all'
      ) {
        loadAdminNotifications();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Close notifications dropdown on outside click or Escape key
  useEffect(() => {
    if (!notifDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNotifDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [notifDropdownOpen]);

  const handleNotificationClick = async (n: AppNotification) => {
    // 1. Mark as read immediately
    await notificationService.markAsRead(n.id, 'usr_admin');
    setNotifications((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    setNotifDropdownOpen(false);

    // 2. Extract potential target ID from relatedEntityId or link query string
    let targetRequestId = n.relatedEntityId;
    if (!targetRequestId && n.link && n.link.includes('id=')) {
      try {
        const urlParams = new URLSearchParams(n.link.split('?')[1]);
        targetRequestId = urlParams.get('id') || undefined;
      } catch {
        // ignore
      }
    }

    // 3. Immediately broadcast event to AdminRequestsPage so review drawer opens instantly
    window.dispatchEvent(
      new CustomEvent('admin_open_request', {
        detail: {
          targetId: targetRequestId,
          petName: n.petName,
          entityType: n.relatedEntityType,
          notification: n,
        },
      })
    );

    // 4. Route accurately based on entity type or action_url
    if (n.relatedEntityType === 'report' || n.type === 'report_created') {
      navigate(getAdminPath('reports'));
    } else if (n.relatedEntityType === 'provider_profile' || n.type === 'provider_verified') {
      navigate(getAdminPath('providers'));
    } else if (targetRequestId) {
      navigate(`${getAdminPath('requests')}?id=${targetRequestId}`);
    } else if (n.link) {
      navigate(n.link);
    } else {
      navigate(getAdminPath('requests'));
    }
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead('usr_admin');
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'trial_extension_requested':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'request_approved':
        return <Heart className="w-4 h-4 text-emerald-600 fill-emerald-100" />;
      case 'adoption_completed':
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      case 'request_received':
        return <Inbox className="w-4 h-4 text-blue-600" />;
      default:
        return <Bell className="w-4 h-4 text-brand-600" />;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-brand-200/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 select-none">
        {/* Left: Mobile Toggle & Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobile}
            className="lg:hidden p-2 rounded-xl border border-brand-200 hover:bg-brand-50 text-brand-700 transition-colors"
            title="Open admin navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-brand-400 font-medium truncate">
              <span>Admin Console</span>
              <span>/</span>
              <span className="text-brand-700 font-semibold">
                {location.pathname.replace(ADMIN_BASE_PATH, '').replace(/^\//, '') || 'dashboard'}
              </span>
            </div>
            <h1 className="font-display text-sm sm:text-base font-bold text-brand-950 truncate">
              {getPageTitle()}
            </h1>
          </div>
        </div>

        {/* Right: Telemetry pill, Test Bench, Bell, Lock button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Live Database Status Pill (Clickable Modal Trigger) */}
          <button
            type="button"
            onClick={() => setIsDbModalOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-300 text-xs text-emerald-800 font-bold transition-all cursor-pointer shadow-2xs group"
            title="Click to view Supabase database connection details & live health telemetry"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>{isLive ? 'Supabase Live' : 'Local Storage'}</span>
            <span className="text-[10px] font-mono text-emerald-700/80 bg-emerald-200/60 px-1.5 py-0.2 rounded group-hover:bg-emerald-200 transition-colors">
              ap-south-1
            </span>
          </button>

          {/* Live Test Bench Quick Button */}
          <Link
            to={getAdminPath('test-bench')}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-900 text-white hover:bg-brand-800 text-xs font-bold transition-all shadow-xs"
            title="Run system tests and diagnostics"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Test Bench</span>
          </Link>

          {/* Notifications Bell with Clickable Interactive Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifDropdownOpen((prev) => !prev)}
              className={`relative p-2 rounded-xl border transition-all cursor-pointer ${
                notifDropdownOpen
                  ? 'border-brand-600 bg-brand-100/70 text-brand-950 shadow-xs'
                  : 'border-brand-200 hover:bg-brand-50 text-brand-700'
              }`}
              aria-label={`Admin Notifications (${unreadCount} unread)`}
              title="Admin Notifications Queue"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-[10px] text-white font-bold flex items-center justify-center animate-bounce shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Interactive Admin Notifications Dropdown */}
            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-surface rounded-3xl shadow-soft-lg border border-brand-200 p-4 z-50 animate-scale-up text-left">
                {/* Dropdown Header */}
                <div className="flex items-center justify-between pb-3 border-b border-brand-100 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-bold text-brand-950">
                      Admin Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="bg-rose-100 text-rose-800 text-[11px] px-2 py-0.5 rounded-full font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-bold text-brand-600 hover:text-brand-950 transition-colors cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="divide-y divide-brand-100 max-h-80 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-brand-muted space-y-1">
                      <Bell className="w-6 h-6 mx-auto text-brand-300 stroke-1" />
                      <p className="font-semibold">No admin notifications</p>
                      <p className="text-[11px]">All requests and trials are currently up to date.</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3 rounded-2xl cursor-pointer transition-all flex items-start gap-3 my-1 group ${
                          !n.read
                            ? 'bg-brand-50/90 hover:bg-brand-100/80 border border-brand-200/60'
                            : 'hover:bg-brand-50/50'
                        }`}
                      >
                        {/* Avatar or Icon */}
                        {n.petImage ? (
                          <img
                            src={n.petImage}
                            alt=""
                            className="w-10 h-10 rounded-2xl object-cover shrink-0 border border-brand-200 shadow-2xs group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-2xl bg-brand-100 flex items-center justify-center shrink-0 border border-brand-200 shadow-2xs group-hover:scale-105 transition-transform">
                            {getNotifIcon(n.type)}
                          </div>
                        )}

                        {/* Text Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={`text-xs font-bold truncate ${
                                !n.read ? 'text-brand-950 font-black' : 'text-brand-900'
                              }`}
                            >
                              {n.title}
                            </p>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-brand-600 mt-0.5 leading-relaxed line-clamp-2">
                            {n.message}
                          </p>
                          <div className="flex items-center justify-between mt-1 text-[10px] text-brand-400">
                            <span>{n.timestamp || 'Just now'}</span>
                            <span className="text-brand-600 group-hover:underline font-semibold">
                              Open Details →
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Dropdown Footer */}
                <div className="pt-3 border-t border-brand-100 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setNotifDropdownOpen(false);
                      navigate(getAdminPath('requests'));
                    }}
                    className="text-xs font-bold text-brand-700 hover:text-brand-950 transition-colors cursor-pointer block w-full py-1"
                  >
                    View All Adoption Applications & Trials →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Lock Console Button */}
          <button
            onClick={onLockConsole}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-100 hover:bg-brand-200 text-brand-800 text-xs font-bold transition-colors cursor-pointer"
            title="Lock administrative console session"
          >
            <Lock className="w-3.5 h-3.5 text-brand-700" />
            <span className="hidden sm:inline">Lock</span>
          </button>
        </div>
      </header>

      {/* Supabase Connection Telemetry Modal */}
      <SupabaseConnectionModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
      />
    </>
  );
};
