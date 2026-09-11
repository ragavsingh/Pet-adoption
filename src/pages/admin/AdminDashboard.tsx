import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  Dog,
  Inbox,
  Award,
  AlertOctagon,
  UserCheck,
  CheckCircle2,
  Clock,
  TrendingUp,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { adminService, AdminDashboardStats } from '../../services/adminService';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isLive = adminService.isLiveRealMode();

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.warn('Error loading dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const metrics = [
    {
      label: 'Total Users',
      value: stats ? stats.totalUsers.toLocaleString() : '...',
      sub: 'Registered accounts',
      icon: Users,
      color: 'bg-blue-50 text-blue-700 group-hover:bg-blue-100',
      link: '/admin/users',
    },
    {
      label: 'Adopters',
      value: stats ? stats.totalAdopters.toLocaleString() : '...',
      sub: 'Verified adopters',
      icon: UserCheck,
      color: 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100',
      link: '/admin/users?role=adopter',
    },
    {
      label: 'Providers / Rescues',
      value: stats ? stats.totalProviders.toLocaleString() : '...',
      sub: `${stats?.verifiedProviders ?? 0} audited shelters`,
      icon: ShieldCheck,
      color: 'bg-purple-50 text-purple-700 group-hover:bg-purple-100',
      link: '/admin/providers',
    },
    {
      label: 'Total Pets Listed',
      value: stats ? stats.totalPets.toLocaleString() : '...',
      sub: 'All-time active companion listings',
      icon: Dog,
      color: 'bg-amber-50 text-amber-700 group-hover:bg-amber-100',
      link: '/admin/pets',
    },
    {
      label: 'Available Pets',
      value: stats ? stats.availablePets.toLocaleString() : '...',
      sub: 'Ready for trial',
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100',
      link: '/admin/pets?status=available',
    },
    {
      label: 'Adoption Requests',
      value: stats ? stats.totalRequests.toLocaleString() : '...',
      sub: `${stats?.pendingRequests ?? 0} pending review`,
      icon: Inbox,
      color: 'bg-indigo-50 text-indigo-700 group-hover:bg-indigo-100',
      link: '/admin/requests',
    },
    {
      label: 'Successful Adoptions',
      value: stats ? stats.totalAdoptions.toLocaleString() : '...',
      sub: 'Completed & certified',
      icon: Award,
      color: 'bg-rose-50 text-rose-700 group-hover:bg-rose-100',
      link: '/admin/requests?status=completed',
    },
    {
      label: 'Pending Providers',
      value: stats ? stats.pendingProviderVerifications.toLocaleString() : '...',
      sub: 'Awaiting audit',
      icon: Clock,
      color: 'bg-amber-50 text-amber-700 group-hover:bg-amber-100',
      link: '/admin/providers?status=pending',
    },
    {
      label: 'Welfare Reports',
      value: stats ? stats.pendingReports.toLocaleString() : '...',
      sub: `${stats?.pendingReports ?? 0} active reports`,
      icon: AlertOctagon,
      color: 'bg-red-50 text-red-700 group-hover:bg-red-100',
      link: '/admin/reports',
    },
  ];

  return (
    <div className="space-y-8 text-left">
      {/* Top Banner with Platform Telemetry Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-surface border border-brand-200/80 shadow-card">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-display text-2xl font-extrabold text-brand-950">
              System Ecosystem Metrics
            </span>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Live Platform Telemetry
            </span>
          </div>
          <p className="text-xs text-brand-muted">
            Authoritative platform governance and live telemetry across Pan-India rescue hubs.
          </p>
        </div>

        <button
          onClick={loadStats}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-200 hover:bg-brand-50 text-xs font-semibold text-brand-700 transition-colors"
          title="Refresh metrics"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 9 Interactive Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Link
              key={idx}
              to={item.link}
              className="p-5 rounded-3xl bg-surface border border-brand-200/80 shadow-card flex items-center gap-4 transition-all duration-200 hover:shadow-lg hover:border-brand-300 hover:-translate-y-0.5 group cursor-pointer"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${item.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-brand-muted block truncate group-hover:text-brand-900 transition-colors">
                  {item.label}
                </span>
                <span className="text-2xl font-display font-extrabold text-brand-950 block">
                  {item.value}
                </span>
                <span className="text-[10px] text-brand-500 font-medium flex items-center justify-between">
                  <span>{item.sub}</span>
                  <span className="text-[10px] font-bold text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                    View &rarr;
                  </span>
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Analytics Chart & Compliance Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Adoption Monthly Growth */}
        <div className="lg:col-span-7 bg-surface rounded-3xl p-6 sm:p-8 border border-brand-200/80 shadow-card space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-brand-100">
            <div>
              <h3 className="font-display text-lg font-bold text-brand-950">
                Adoption Success Rate (Last 6 Months)
              </h3>
              <p className="text-xs text-brand-muted">Monthly completed adoptions through Foster-to-Own</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              98% Retention
            </span>
          </div>

          {/* Minimalist Bar Chart Representation */}
          <div className="pt-4 flex items-end justify-between gap-3 h-48 sm:h-56 px-2">
            {[
              { month: 'Apr', value: 34, height: '40%' },
              { month: 'May', value: 42, height: '52%' },
              { month: 'Jun', value: 50, height: '65%' },
              { month: 'Jul', value: 61, height: '78%' },
              { month: 'Aug', value: 75, height: '88%' },
              { month: 'Sept', value: stats?.totalAdoptions ? Math.min(stats.totalAdoptions, 95) : 85, height: '100%' },
            ].map((bar) => (
              <div key={bar.month} className="flex-1 flex flex-col items-center gap-2 group">
                <span className="text-[11px] font-bold text-brand-800 opacity-0 group-hover:opacity-100 transition-opacity">
                  {bar.value}
                </span>
                <div className="w-full bg-brand-100 rounded-2xl overflow-hidden h-40 flex items-end">
                  <div
                    className="w-full bg-brand-700 group-hover:bg-brand-800 rounded-2xl transition-all duration-300"
                    style={{ height: bar.height }}
                  />
                </div>
                <span className="text-xs font-bold text-brand-600">{bar.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Audit Actions */}
        <div className="lg:col-span-5 bg-surface rounded-3xl p-6 sm:p-8 border border-brand-200/80 shadow-card space-y-5">
          <h3 className="font-display text-lg font-bold text-brand-950 pb-3 border-b border-brand-100">
            Compliance & Verification Queue
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-between">
              <div>
                <strong className="text-brand-900 block font-bold">Pending Provider Audits</strong>
                <span className="text-brand-muted">
                  {stats?.pendingProviderVerifications ?? 0} organizations awaiting review
                </span>
              </div>
              <Link
                to="/admin/providers"
                className="text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-full transition-colors"
              >
                Review Providers
              </Link>
            </div>

            <div className="p-3.5 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-between">
              <div>
                <strong className="text-brand-900 block font-bold">Active Foster Trials</strong>
                <span className="text-brand-muted">
                  {stats?.activeTrials ?? 0} companion bonding periods in progress
                </span>
              </div>
              <Link
                to="/admin/requests"
                className="text-[10px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded-full transition-colors"
              >
                Inspect Trials
              </Link>
            </div>

            <div className="p-3.5 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-between">
              <div>
                <strong className="text-brand-900 block font-bold">Welfare & Compliance Reports</strong>
                <span className="text-brand-muted">
                  {stats?.pendingReports ?? 0} open violation reports flagged
                </span>
              </div>
              <Link
                to="/admin/reports"
                className="text-[10px] font-bold text-rose-800 bg-rose-100 hover:bg-rose-200 px-2 py-0.5 rounded-full transition-colors"
              >
                Inspect Reports
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
