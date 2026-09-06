export type NotificationType = 
  | 'request_received'
  | 'request_reviewing'
  | 'request_approved'
  | 'request_rejected'
  | 'more_info_requested'
  | 'trial_started'
  | 'trial_update'
  | 'trial_extension_requested'
  | 'trial_extension_approved'
  | 'trial_extension_rejected'
  | 'adoption_completed'
  | 'provider_verified'
  | 'report_created'
  | 'system';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
  petName?: string;
  petImage?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt?: string;
}
