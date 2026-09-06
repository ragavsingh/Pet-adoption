import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Dog,
  Inbox,
  AlertOctagon,
  Settings,
  Activity,
  Lock,
  ArrowLeft,
  CheckCircle2,
  X,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { SupabaseConnectionModal } from '../admin/SupabaseConnectionModal';

interface AdminSidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onLockConsole: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpenMobile = false,
  onCloseMobile,
  onLockConsole,
}) => {
  const isLive = adminService.isLiveRealMode();
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);

  const navItems = [
    {
      name: 'Executive Dashboard',
      path: '/admin/dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: 'Adoption Requests',
      path: '/admin/requests',
      icon: Inbox,
      badge: 'Verify',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      name: 'Users & Accounts',
      path: '/admin/users',
      icon: Users,
      badge: null,
    },
    {
      name: 'Rescue Providers',
      path: '/admin/providers',
      icon: ShieldCheck,
      badge: 'Audits',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
    {
      name: 'Companion Pet Listings',
      path: '/admin/pets',
      icon: Dog,
      badge: null,
    },
    {
      name: 'Welfare & Safety Reports',
      path: '/admin/reports',
      icon: AlertOctagon,
      badge: null,
    },
    {
      name: 'Live System Test Bench',
      path: '/admin/test-bench',
      icon: Activity,
      badge: 'Live Test',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      name: 'Settings & Telemetry',
      path: '/admin/settings',
      icon: Settings,
      badge: null,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-brand-950 text-brand-100 border-r border-brand-800/80 w-72 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-brand-800/80 flex items-center justify-between">
        <Link to="/admin/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shadow-inner">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-base font-extrabold text-white tracking-tight">
                PET ADOPTION
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-emerald-400 block -mt-0.5">
              Admin Governance
            </span>
          </div>
        </Link>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-xl hover:bg-brand-900 text-brand-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Connection & Telemetry Status Button */}
      <button
        type="button"
        onClick={() => setIsDbModalOpen(true)}
        className="w-full text-left px-5 py-3 border-b border-brand-800/60 bg-brand-900/30 hover:bg-brand-900/60 transition-colors cursor-pointer group"
        title="View Supabase PostgreSQL Connection & Cloud Telemetry"
      >
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white text-[11px] group-hover:text-emerald-300 transition-colors">
              {isLive ? 'Supabase PostgreSQL' : 'Local Storage Engine'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400/90 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800/80 group-hover:border-emerald-500/50 transition-colors">
            ap-south-1
          </span>
        </div>
      </button>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-brand-400">
          Platform Governance
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950 font-bold'
                    : 'text-brand-300 hover:text-white hover:bg-brand-900/70'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                <span className="truncate">{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full border ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom Session Card & Public Website Link */}
      <div className="p-3 border-t border-brand-800/80 bg-brand-900/40 space-y-2">
        <div className="p-3 rounded-2xl bg-brand-900/80 border border-brand-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
              AD
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block truncate">
                Admin Console
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Authorized
              </span>
            </div>
          </div>

          <button
            onClick={onLockConsole}
            className="p-1.5 rounded-xl bg-brand-950 hover:bg-brand-800 text-brand-300 hover:text-white border border-brand-700 transition-colors cursor-pointer"
            title="Lock administrative console"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>

        <Link
          to="/"
          className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-brand-300 hover:text-white hover:bg-brand-900/60 border border-brand-800/80 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit to Public Website</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block shrink-0 sticky top-0 h-screen z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop and Drawer */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 animate-slide-right">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Supabase Connection Details Modal */}
      <SupabaseConnectionModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
      />
    </>
  );
};
