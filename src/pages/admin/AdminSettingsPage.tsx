import React from 'react';
import { Button } from '../../components/common/Button';
import { useToast } from '../../contexts/ToastContext';
import { Settings, ShieldCheck, Database, RefreshCw, Server, Lock, Mail } from 'lucide-react';
import { petService } from '../../services/petService';
import { adminService } from '../../services/adminService';
import { isSupabaseConfigured } from '../../lib/supabase';

export const AdminSettingsPage: React.FC = () => {
  const { showToast } = useToast();
  const isLive = adminService.isLiveRealMode();
  const supabaseActive = isSupabaseConfigured();

  const handleResetData = () => {
    localStorage.clear();
    petService.resetDemoPets();
    showToast('Platform cache and local storage synchronized successfully!', 'success');
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 text-left">
      <div>
        <h2 className="font-display text-2xl font-bold text-brand-950">Platform Governance & Configuration</h2>
        <p className="text-xs text-brand-muted">System parameters, security boundaries, and local state management.</p>
      </div>

      {/* System Infrastructure Telemetry Card */}
      <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-brand-200/80 shadow-card space-y-5">
        <h3 className="font-display text-lg font-bold text-brand-950 pb-3 border-b border-brand-100 flex items-center gap-2">
          <Server className="w-5 h-5 text-brand-600" />
          <span>System Architecture & Telemetry</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200 space-y-1">
            <span className="text-brand-400 block font-semibold">Backend Engine</span>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${supabaseActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <strong className="text-brand-950 font-bold">
                {supabaseActive ? 'Supabase PostgreSQL 15' : 'Local Storage Engine'}
              </strong>
            </div>
            <p className="text-[11px] text-brand-500 pt-1">
              {supabaseActive ? 'Full relational schema with Row-Level Security active.' : 'Operating in offline browser simulation.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200 space-y-1">
            <span className="text-brand-400 block font-semibold">Authorization Boundary</span>
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <strong className="text-brand-950 font-bold">Zero-Trust Server RPCs</strong>
            </div>
            <p className="text-[11px] text-brand-500 pt-1">
              Role validation enforced at database level with `is_admin()`.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200 space-y-1">
            <span className="text-brand-400 block font-semibold">Transactional Notifications</span>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <strong className="text-brand-950 font-bold">Resend + Dev Sandbox</strong>
            </div>
            <p className="text-[11px] text-brand-500 pt-1">
              Database-backed idempotency protection via `email_deliveries`.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200 space-y-1">
            <span className="text-brand-400 block font-semibold">Admin Session Mode</span>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <strong className="text-brand-950 font-bold">
                Platform Administrator
              </strong>
            </div>
            <p className="text-[11px] text-brand-500 pt-1">
              Authoritative administrative governance session.
            </p>
          </div>
        </div>
      </div>

      {/* Live System Diagnostics & Test Studio Card */}
      <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-brand-200/80 shadow-card space-y-5">
        <h3 className="font-display text-lg font-bold text-brand-950 pb-3 border-b border-brand-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-600" />
            <span>Interactive System Test Bench</span>
          </div>
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
            Active
          </span>
        </h3>

        <p className="text-xs text-brand-600 leading-relaxed">
          Test live PostgreSQL queries, RPC response latency, transactional email delivery, and in-app notification queues directly from the administrative portal.
        </p>

        <div className="pt-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.location.href = '/admin/test-bench'}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Launch System Test Bench
          </Button>
        </div>
      </div>

      {/* Storage & Cache Management Card */}
      <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-brand-200/80 shadow-card space-y-6">
        <h3 className="font-display text-lg font-bold text-brand-950 pb-3 border-b border-brand-100 flex items-center gap-2">
          <Database className="w-5 h-5 text-brand-600" />
          <span>Local Storage & Cache Management</span>
        </h3>

        <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200 space-y-2 text-xs text-brand-800">
          <p className="font-bold text-brand-950">Synchronize Local Storage & Reset Cache</p>
          <p className="leading-relaxed text-brand-600">
            Synchronizes local application cache, resets local browser state, and reloads active platform data.
          </p>
          <p className="text-[11px] text-brand-400 italic">
            Note: This action only clears local browser state (`localStorage`) and will NEVER modify or delete real PostgreSQL database records.
          </p>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetData}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Clear Cache & Re-Sync Storage
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
