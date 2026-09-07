import { supabase, isSupabaseConfigured } from '../lib/supabase';

type SyncEventType =
  | 'adoption_request_updated'
  | 'adoption_request_created'
  | 'foster_trial_updated'
  | 'pet_status_updated'
  | 'pet_updated'
  | 'notification_received'
  | 'user_created'
  | 'user_updated'
  | 'user_role_changed'
  | 'user_registered'
  | 'all';


export interface RealtimeSyncEvent {
  type: SyncEventType;
  entityId?: string;
  payload?: any;
  timestamp: number;
}

type SyncListener = (event: RealtimeSyncEvent) => void;

class RealtimeSyncManager {
  private listeners: Set<SyncListener> = new Set();
  private supabaseChannel: any = null;
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // 1. Same-window / same-tab custom event listener
    window.addEventListener('pet_realtime_sync', ((e: CustomEvent<RealtimeSyncEvent>) => {
      if (e.detail) {
        this.emitToListeners(e.detail);
      }
    }) as EventListener);

    // 2. Cross-tab synchronization via storage event
    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key === 'pet_sync_broadcast' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as RealtimeSyncEvent;
          this.emitToListeners(parsed);
        } catch {
          // ignore parsing error
        }
      }
    });

    // 3. Modern browser inter-tab BroadcastChannel
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('pet_realtime_sync_bc');
        bc.onmessage = (e) => {
          if (e.data && e.data.type) {
            this.emitToListeners(e.data as RealtimeSyncEvent);
          }
        };
      } catch (e) {
        console.warn('[RealtimeSync] BroadcastChannel init error:', e);
      }
    }

    // 4. Supabase Realtime Postgres Changes Subscription
    if (isSupabaseConfigured()) {
      try {
        this.supabaseChannel = supabase
          .channel('pet_adoption_platform_sync')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'profiles' },
            (payload) => {
              const eventType: SyncEventType =
                payload.eventType === 'INSERT' ? 'user_created' : 'user_updated';
              this.emitToListeners({
                type: eventType,
                entityId: (payload.new as any)?.id || (payload.old as any)?.id,
                payload: payload.new,
                timestamp: Date.now(),
              });
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'adopter_profiles' },
            (payload) => {
              this.emitToListeners({
                type: 'user_updated',
                entityId: (payload.new as any)?.id || (payload.old as any)?.id,
                payload: payload.new,
                timestamp: Date.now(),
              });
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'provider_profiles' },
            (payload) => {
              this.emitToListeners({
                type: 'user_updated',
                entityId: (payload.new as any)?.id || (payload.old as any)?.id,
                payload: payload.new,
                timestamp: Date.now(),
              });
            }
          )
          .on(
            'broadcast',
            { event: 'user_change' },
            (payload) => {
              this.emitToListeners({
                type: 'user_created',
                entityId: (payload.payload as any)?.id,
                payload: payload.payload,
                timestamp: Date.now(),
              });
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'adoption_requests' },
            (payload) => {
              const eventType: SyncEventType =
                payload.eventType === 'INSERT'
                  ? 'adoption_request_created'
                  : 'adoption_request_updated';

              this.emitToListeners({
                type: eventType,
                entityId: (payload.new as any)?.id || (payload.old as any)?.id,
                payload: payload.new,
                timestamp: Date.now(),
              });
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'notifications' },
            (payload) => {
              this.emitToListeners({
                type: 'notification_received',
                entityId: (payload.new as any)?.id,
                payload: payload.new,
                timestamp: Date.now(),
              });
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'pets' },
            (payload) => {
              this.emitToListeners({
                type: 'pet_status_updated',
                entityId: (payload.new as any)?.id,
                payload: payload.new,
                timestamp: Date.now(),
              });
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'foster_trials' },
            (payload) => {
              this.emitToListeners({
                type: 'foster_trial_updated',
                entityId: (payload.new as any)?.id || (payload.old as any)?.id,
                payload: payload.new,
                timestamp: Date.now(),
              });
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'trial_extension_requests' },
            (payload) => {
              this.emitToListeners({
                type: 'foster_trial_updated',
                entityId: (payload.new as any)?.trial_id || (payload.new as any)?.id,
                payload: payload.new,
                timestamp: Date.now(),
              });
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('[RealtimeSync] Could not initialize Supabase realtime channel:', err);
      }
    }
  }

  /**
   * Broadcast an update across all open tabs, windows, and active components.
   */
  public notifyChange(type: SyncEventType, entityId?: string, payload?: any) {
    const event: RealtimeSyncEvent = {
      type,
      entityId,
      payload,
      timestamp: Date.now(),
    };

    // Broadcast locally in this window
    this.emitToListeners(event);

    if (typeof window !== 'undefined') {
      // Dispatch DOM custom event
      window.dispatchEvent(
        new CustomEvent<RealtimeSyncEvent>('pet_realtime_sync', { detail: event })
      );

      // Broadcast to other browser tabs via BroadcastChannel
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const bc = new BroadcastChannel('pet_realtime_sync_bc');
          bc.postMessage(event);
          bc.close();
        } catch {
          // ignore
        }
      }

      // Broadcast to other browser tabs via StorageEvent
      try {
        localStorage.setItem('pet_sync_broadcast', JSON.stringify(event));
      } catch {
        // ignore quota error
      }
    }
  }

  /**
   * Subscribe a component or service to real-time events.
   * Returns an unsubscribe callback for easy cleanup in useEffect.
   */
  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emitToListeners(event: RealtimeSyncEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('[RealtimeSync] Error executing listener callback:', err);
      }
    });
  }
}

export const realtimeSync = new RealtimeSyncManager();
