import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppNotification } from '../types/notification';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { isRealMode, isUUID } from '../utils/authMode';

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const refreshNotifications = useCallback(async () => {
    if (!user) {
      if (isMountedRef.current) {
        setNotifications([]);
        setIsLoading(false);
        setError(null);
      }
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const list = await notificationService.getNotifications(user.id);
      if (isMountedRef.current) {
        setNotifications(list);
      }
    } catch (err: any) {
      console.warn('[NotificationsContext] Error refreshing notifications:', err);
      if (isMountedRef.current) {
        setError(err?.message || 'Failed to load notifications');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user]);

  // Initial and user-dependent fetch
  useEffect(() => {
    isMountedRef.current = true;
    refreshNotifications();

    return () => {
      isMountedRef.current = false;
    };
  }, [refreshNotifications]);

  // Realtime Supabase updates & tab focus listener
  useEffect(() => {
    if (!user || !isRealMode() || !isUUID(user.id)) return;

    let channel: any = null;
    try {
      channel = supabase
        .channel(`public:notifications:user_id=${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            refreshNotifications();
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('[NotificationsContext] Realtime subscription failed, using fallback:', err);
    }

    // Refresh when user returns to this browser tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshNotifications();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, refreshNotifications]);

  // Optimistic single mark as read
  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

    try {
      await notificationService.markAsRead(id, user?.id);
    } catch (err) {
      console.warn('[NotificationsContext] Error marking notification as read:', err);
      // Revert/refresh on error
      refreshNotifications();
    }
  };

  // Optimistic mark all as read
  const markAllAsRead = async () => {
    if (!user) return;

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );

    try {
      await notificationService.markAllAsRead(user.id);
    } catch (err) {
      console.warn('[NotificationsContext] Error marking all notifications as read:', err);
      refreshNotifications();
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        error,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
};
