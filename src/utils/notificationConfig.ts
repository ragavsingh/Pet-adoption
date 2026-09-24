import React from 'react';
import {
  Bell,
  Heart,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  CalendarPlus,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Info,
} from 'lucide-react';
import { NotificationType } from '../types/notification';
import { getAdminPath } from './adminSecurity';

export interface NotificationVisualConfig {
  icon: React.ComponentType<{ className?: string }>;
  defaultTitle: string;
  badgeLabel: string;
  iconBgClass: string;
  iconColorClass: string;
  badgeClass: string;
  getDefaultRoute: (entityId?: string, role?: string) => string;
}

export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, NotificationVisualConfig> = {
  request_received: {
    icon: FileText,
    defaultTitle: 'New Adoption Application',
    badgeLabel: 'Application',
    iconBgClass: 'bg-blue-100',
    iconColorClass: 'text-blue-700',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    getDefaultRoute: (entityId, role) =>
      role === 'adopter'
        ? entityId ? `/adopter/requests/${entityId}` : '/adopter/requests'
        : entityId ? `/provider/requests/${entityId}` : '/provider/requests',
  },
  request_reviewing: {
    icon: Clock,
    defaultTitle: 'Application Under Review',
    badgeLabel: 'Review',
    iconBgClass: 'bg-amber-100',
    iconColorClass: 'text-amber-700',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    getDefaultRoute: (entityId) => (entityId ? `/adopter/requests/${entityId}` : '/adopter/requests'),
  },
  request_approved: {
    icon: CheckCircle2,
    defaultTitle: 'Adoption Application Approved! ❤️',
    badgeLabel: 'Approved',
    iconBgClass: 'bg-emerald-100',
    iconColorClass: 'text-emerald-700',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    getDefaultRoute: (entityId) => (entityId ? `/adopter/requests/${entityId}` : '/adopter/dashboard'),
  },
  request_rejected: {
    icon: XCircle,
    defaultTitle: 'Application Status Update',
    badgeLabel: 'Closed',
    iconBgClass: 'bg-rose-100',
    iconColorClass: 'text-rose-700',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    getDefaultRoute: (entityId) => (entityId ? `/adopter/requests/${entityId}` : '/adopter/requests'),
  },
  more_info_requested: {
    icon: HelpCircle,
    defaultTitle: 'More Information Requested',
    badgeLabel: 'Action Required',
    iconBgClass: 'bg-amber-100',
    iconColorClass: 'text-amber-800',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-200',
    getDefaultRoute: (entityId) => (entityId ? `/adopter/requests/${entityId}` : '/adopter/requests'),
  },
  trial_started: {
    icon: Clock,
    defaultTitle: 'Foster-to-Own Trial Active',
    badgeLabel: 'Trial Started',
    iconBgClass: 'bg-brand-100',
    iconColorClass: 'text-brand-700',
    badgeClass: 'bg-brand-50 text-brand-800 border-brand-200',
    getDefaultRoute: (entityId, role) =>
      role === 'provider'
        ? entityId ? `/provider/requests/${entityId}` : '/provider/requests'
        : entityId ? `/adopter/requests/${entityId}` : '/adopter/requests',
  },
  trial_update: {
    icon: Clock,
    defaultTitle: 'Foster Trial Update',
    badgeLabel: 'Trial',
    iconBgClass: 'bg-brand-100',
    iconColorClass: 'text-brand-700',
    badgeClass: 'bg-brand-50 text-brand-800 border-brand-200',
    getDefaultRoute: (entityId, role) =>
      role === 'provider'
        ? entityId ? `/provider/requests/${entityId}` : '/provider/requests'
        : entityId ? `/adopter/requests/${entityId}` : '/adopter/requests',
  },
  trial_extension_requested: {
    icon: Clock,
    defaultTitle: 'Trial Extension Requested',
    badgeLabel: 'Extension Requested',
    iconBgClass: 'bg-amber-100',
    iconColorClass: 'text-amber-700',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    getDefaultRoute: (entityId, role) =>
      role === 'adopter'
        ? entityId ? `/adopter/requests/${entityId}` : '/adopter/requests'
        : entityId ? `/provider/requests/${entityId}` : '/provider/requests',
  },
  trial_extension_approved: {
    icon: CalendarPlus,
    defaultTitle: 'Trial Extension Approved! 🎉',
    badgeLabel: 'Extended',
    iconBgClass: 'bg-emerald-100',
    iconColorClass: 'text-emerald-700',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    getDefaultRoute: (entityId, role) =>
      role === 'provider'
        ? entityId ? `/provider/requests/${entityId}` : '/provider/requests'
        : entityId ? `/adopter/requests/${entityId}` : '/adopter/requests',
  },
  trial_extension_rejected: {
    icon: Clock,
    defaultTitle: 'Trial Extension Declined',
    badgeLabel: 'Extension Declined',
    iconBgClass: 'bg-rose-100',
    iconColorClass: 'text-rose-700',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    getDefaultRoute: (entityId, role) =>
      role === 'provider'
        ? entityId ? `/provider/requests/${entityId}` : '/provider/requests'
        : entityId ? `/adopter/requests/${entityId}` : '/adopter/requests',
  },
  adoption_completed: {
    icon: Heart,
    defaultTitle: 'Adoption Official! Forever Home Found ❤️',
    badgeLabel: 'Adopted',
    iconBgClass: 'bg-rose-100',
    iconColorClass: 'text-rose-600',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    getDefaultRoute: (entityId, role) =>
      role === 'provider'
        ? '/provider/adoptions'
        : entityId ? `/adoption-success/${entityId}` : '/adopter/adoptions',
  },
  provider_verified: {
    icon: ShieldCheck,
    defaultTitle: 'Profile Verified! 🛡️',
    badgeLabel: 'Verified',
    iconBgClass: 'bg-emerald-100',
    iconColorClass: 'text-emerald-700',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    getDefaultRoute: () => '/provider/profile',
  },
  report_created: {
    icon: AlertTriangle,
    defaultTitle: 'Safety Report Filed',
    badgeLabel: 'Safety Alert',
    iconBgClass: 'bg-amber-100',
    iconColorClass: 'text-amber-700',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    getDefaultRoute: () => getAdminPath('reports'),
  },
  system: {
    icon: Info,
    defaultTitle: 'Pet Adoption Notice',
    badgeLabel: 'Notice',
    iconBgClass: 'bg-zinc-100',
    iconColorClass: 'text-zinc-700',
    badgeClass: 'bg-zinc-50 text-zinc-800 border-zinc-200',
    getDefaultRoute: () => '/',
  },
};

/**
 * Resolves visual representation configuration and destination link for any notification.
 */
export function getNotificationConfig(type: NotificationType): NotificationVisualConfig {
  return NOTIFICATION_TYPE_CONFIG[type] || {
    icon: Bell,
    defaultTitle: 'Pet Adoption Notification',
    badgeLabel: 'Update',
    iconBgClass: 'bg-brand-100',
    iconColorClass: 'text-brand-700',
    badgeClass: 'bg-brand-50 text-brand-800 border-brand-200',
    getDefaultRoute: () => '/',
  };
}

/**
 * Centrally resolves the exact logical destination URL for a notification,
 * opening the specific application or trial details page on both phones and laptops.
 */
export function resolveNotificationRoute(
  notif: {
    link?: string;
    type?: NotificationType;
    relatedEntityType?: string;
    relatedEntityId?: string;
  },
  role?: string
): string {
  // 1. Platform Admin role
  if (role === 'admin') {
    if (notif.relatedEntityId) {
      return `${getAdminPath('requests')}?id=${notif.relatedEntityId}`;
    }
    return getAdminPath('requests');
  }

  // 2. Foster trial or adoption request -> directly open the full application / trial details page!
  if (
    notif.relatedEntityId &&
    (notif.relatedEntityType === 'foster_trial' || notif.relatedEntityType === 'adoption_request')
  ) {
    return role === 'provider'
      ? `/provider/requests/${notif.relatedEntityId}`
      : `/adopter/requests/${notif.relatedEntityId}`;
  }

  // 3. Adoption finalization
  if (notif.relatedEntityType === 'adoption' || notif.type === 'adoption_completed') {
    if (role === 'provider') return '/provider/adoptions';
    return notif.relatedEntityId
      ? `/adoption-success/${notif.relatedEntityId}`
      : '/adopter/adoptions';
  }

  // 4. If explicit deep link is provided (and not just generic dashboard overview)
  if (
    notif.link &&
    notif.link !== '/adopter/dashboard' &&
    notif.link !== '/provider/dashboard' &&
    notif.link !== '/'
  ) {
    return notif.link;
  }

  // 5. If type has a specific configured route
  if (notif.type) {
    const config = getNotificationConfig(notif.type);
    const defaultRoute = config.getDefaultRoute(notif.relatedEntityId, role);
    if (defaultRoute) return defaultRoute;
  }

  // 6. Role-based fallback
  if (role === 'provider') return '/provider/requests';
  return '/adopter/requests';
}
