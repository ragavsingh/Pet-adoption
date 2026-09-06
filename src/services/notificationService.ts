import { AppNotification } from '../types/notification';
import { INITIAL_NOTIFICATIONS } from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { isRealMode, isUUID } from '../utils/authMode';
import { formatRelativeTime } from '../utils/formatTime';

// ==============================================================================
// 1. HELPER UTILITIES (PER-USER NOTIFICATION ISOLATION)
// ==============================================================================

function getUserNotificationKey(userId: string): string {
  return `pet_notifications_${userId}`;
}

function loadLocalNotifications(userId: string): AppNotification[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(getUserNotificationKey(userId));
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[notificationService] Failed to load notifications for user', userId, e);
  }

  // Seed default notifications ONLY for the respective demo accounts
  const initial = INITIAL_NOTIFICATIONS.filter((n) => n.userId === userId);
  if (initial.length > 0) {
    saveLocalNotifications(userId, initial);
    return initial;
  }

  return [];
}

function saveLocalNotifications(userId: string, items: AppNotification[]): void {
  if (!userId) return;
  try {
    localStorage.setItem(getUserNotificationKey(userId), JSON.stringify(items));
  } catch (e) {
    console.warn('[notificationService] Failed to save notifications for user', userId, e);
  }
}

// ==============================================================================
// 2. NOTIFICATION SERVICE (DUAL-MODE + PER-USER DATA PRIVACY)
// ==============================================================================
export const notificationService = {
  /**
   * Fetches notifications for a specific user.
   * If userId is missing, returns [] immediately.
   * Real Mode: queries public.notifications for user_id ordered by created_at DESC.
   * Demo Mode: loads strictly from per-user localStorage.
   */
  async getNotifications(userId?: string, limit: number = 50): Promise<AppNotification[]> {
    if (!userId) return [];

    const isAdminUser = userId === 'usr_admin' || userId === 'a0000000-0000-0000-0000-000000000099' || userId === 'admin';

    // 1. Platform Admin Notifications (Query specialized security definer RPC)
    if (isAdminUser && isSupabaseConfigured()) {
      try {
        const { data: adminRpcData, error: adminRpcError } = await (supabase as any).rpc('get_admin_notifications');
        if (!adminRpcError && Array.isArray(adminRpcData) && adminRpcData.length > 0) {
          const dbNotifs = adminRpcData.map((row: any): AppNotification => ({
            id: row.id,
            userId: 'usr_admin',
            type: row.type || 'request_received',
            title: row.title,
            message: row.message,
            timestamp: formatRelativeTime(row.created_at),
            read: Boolean(row.is_read),
            link: row.action_url || '/admin/requests',
            petName: row.pet_name,
            petImage: row.pet_image,
            relatedEntityType: row.related_entity_type,
            relatedEntityId: row.related_entity_id,
            createdAt: row.created_at,
          }));

          const local = loadLocalNotifications('usr_admin');
          const merged = [...dbNotifs];
          for (const l of local) {
            if (!merged.some((m) => m.id === l.id || m.title === l.title)) {
              merged.push(l);
            }
          }
          return merged;
        }
      } catch (err) {
        console.warn('[notificationService] Failed to load admin notifications from RPC:', err);
      }
    }

    // 2. Real Authenticated User Notifications
    if (isRealMode() && isUUID(userId)) {
      try {
        const { data, error } = await (supabase as any)
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) {
          console.error('[notificationService] Error fetching notifications:', error);
          throw error;
        }

        if (data && Array.isArray(data)) {
          return data.map((row: any): AppNotification => ({
            id: row.id,
            userId: row.user_id,
            type: row.type,
            title: row.title,
            message: row.message,
            timestamp: formatRelativeTime(row.created_at),
            read: Boolean(row.is_read),
            link: row.action_url || undefined,
            relatedEntityType: row.related_entity_type,
            relatedEntityId: row.related_entity_id,
            createdAt: row.created_at,
          }));
        }
      } catch (err) {
        console.warn('[notificationService] Failed to query Supabase notifications:', err);
      }
    }

    // 3. User-isolated storage fallback
    return loadLocalNotifications(userId);
  },

  /**
   * Gets unread notification count for a specific user.
   */
  async getUnreadCount(userId?: string): Promise<number> {
    if (!userId) return 0;

    const isAdminUser = userId === 'usr_admin' || userId === 'a0000000-0000-0000-0000-000000000099' || userId === 'admin';

    if (isAdminUser) {
      const notifs = await this.getNotifications(userId);
      return notifs.filter((n) => !n.read).length;
    }

    if (isRealMode() && isUUID(userId)) {
      try {
        const { count, error } = await (supabase as any)
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_read', false);

        if (error) {
          console.error('[notificationService] Error counting unread notifications:', error);
        } else if (typeof count === 'number') {
          return count;
        }
      } catch (err) {
        console.warn('[notificationService] Failed to count unread notifications:', err);
      }
    }

    // Isolated local fallback
    const list = this.getNotificationsSync(userId);
    return list.filter((n) => !n.read).length;
  },

  /**
   * Synchronous getter for user notifications.
   */
  getNotificationsSync(userId?: string): AppNotification[] {
    if (!userId) return [];
    return loadLocalNotifications(userId);
  },

  /**
   * Marks a single notification as read.
   */
  async markAsRead(id: string, userId?: string): Promise<void> {
    if (isSupabaseConfigured() && isUUID(id)) {
      try {
        // Try admin RPC first
        const { error: adminRpcError } = await (supabase as any).rpc('admin_mark_notification_read', {
          p_notification_id: id,
        });

        if (!adminRpcError) {
          return;
        }

        // Attempt user RPC next
        const { error: rpcError } = await (supabase as any).rpc('mark_notification_as_read', {
          p_notification_id: id,
        });

        if (rpcError) {
          await (supabase as any)
            .from('notifications')
            .update({
              is_read: true,
              read_at: new Date().toISOString(),
            })
            .eq('id', id);
        }
        return;
      } catch (err) {
        console.warn('[notificationService] Failed to mark notification read in Supabase:', err);
      }
    }

    // Demo Mode: mark in user's isolated local list
    if (userId) {
      const all = loadLocalNotifications(userId);
      const item = all.find((n) => n.id === id);
      if (item) {
        item.read = true;
        saveLocalNotifications(userId, all);
      }
    }
  },

  /**
   * Marks all unread notifications as read for the user.
   */
  async markAllAsRead(userId: string): Promise<void> {
    if (!userId) return;

    const isAdminUser = userId === 'usr_admin' || userId === 'a0000000-0000-0000-0000-000000000099' || userId === 'admin';

    if (isAdminUser && isSupabaseConfigured()) {
      try {
        await (supabase as any).rpc('admin_mark_all_notifications_read');
      } catch (err) {
        console.warn('[notificationService] Failed to mark all admin notifications read:', err);
      }
    } else if (isRealMode() && isUUID(userId)) {
      try {
        const { error: rpcError } = await (supabase as any).rpc('mark_all_notifications_as_read');
        if (rpcError) {
          await (supabase as any)
            .from('notifications')
            .update({
              is_read: true,
              read_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .eq('is_read', false);
        }
      } catch (err) {
        console.warn('[notificationService] Failed to mark all notifications read in Supabase:', err);
      }
    }

    // Demo Mode: mark all read in user's isolated local storage
    const all = loadLocalNotifications(userId);
    all.forEach((n) => {
      n.read = true;
    });
    saveLocalNotifications(userId, all);
  },

  /**
   * Dispatches a notification to a specific user's inbox.
   */
  addNotification(
    item: Omit<AppNotification, 'id' | 'timestamp' | 'read'>
  ): AppNotification {
    const targetUserId = item.userId;
    const newNotif: AppNotification = {
      ...item,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: 'Just now',
      read: false,
    };

    if (targetUserId) {
      const userList = loadLocalNotifications(targetUserId);
      userList.unshift(newNotif);
      saveLocalNotifications(targetUserId, userList);
    }

    return newNotif;
  },
};
