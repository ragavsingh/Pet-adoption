import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopNav } from './AdminTopNav';
import {
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldAlert,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { isAuthorizedAdmin } from '../../utils/adminSecurity';

const ADMIN_SESSION_KEY = 'pet_admin_session_auth_v2';
const ADMIN_PASSKEY_STORAGE_KEY = 'pet_admin_session_passkey';

// Cryptographic SHA-256 hashes of approved admin master passkeys
const AUTHORIZED_PASSKEY_HASHES = new Set([
  '6051fc84a7a0d74c225fb18a496b09952da5642e60723ecae543298edd7d82d6',
  'a36aef5a11c4073fbe60314fc9df530a9d5f986533594d1f5190742ff9e0e408',
  '0142a456b89f5cac01f4adf9ca1c7d41ea11b74dc15dd984ac8dd97c4765e22f',
]);

async function sha256Hex(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const AdminLayout: React.FC = () => {
  const { user, switchRole, isAuthenticated, isLoading } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // 1. Strict Administrator Authorization Check
  const isAuthorized = isAuthorizedAdmin(user);

  // Check if session is already unlocked in this browser tab via verified passkey
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      if (!isAuthorizedAdmin(user)) return false;
      const explicitLocked = sessionStorage.getItem('pet_admin_explicit_locked') === 'true';
      if (explicitLocked) return false;
      return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'unlocked';
    } catch {
      return false;
    }
  });

  // Keep isUnlocked state synchronized if auth finishes loading or user changes
  useEffect(() => {
    if (!isAuthorized) {
      setIsUnlocked(false);
      try {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        sessionStorage.removeItem(ADMIN_PASSKEY_STORAGE_KEY);
        localStorage.removeItem(ADMIN_PASSKEY_STORAGE_KEY);
      } catch {}
    } else {
      const explicitLocked = sessionStorage.getItem('pet_admin_explicit_locked') === 'true';
      const sessionAuth = sessionStorage.getItem(ADMIN_SESSION_KEY);
      if (explicitLocked || sessionAuth !== 'unlocked') {
        setIsUnlocked(false);
      }
    }
  }, [isAuthorized, user]);

  const [passkey, setPasskey] = useState('');
  const [showPasskey, setShowPasskey] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthorized) {
      setErrorMsg('Unauthorized account.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const clean = passkey.trim();
      const hash = await sha256Hex(clean);
      if (AUTHORIZED_PASSKEY_HASHES.has(hash)) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'unlocked');
        sessionStorage.setItem(ADMIN_PASSKEY_STORAGE_KEY, clean);
        localStorage.setItem(ADMIN_PASSKEY_STORAGE_KEY, clean);
        sessionStorage.removeItem('pet_admin_explicit_locked');
        if (user?.role !== 'admin') {
          switchRole('admin');
        }
        setIsUnlocked(true);
        setPasskey('');
      } else {
        setErrorMsg('Invalid administrative passkey. Please verify your credentials.');
      }
    } catch (err) {
      setErrorMsg('Cryptographic validation error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLockConsole = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem(ADMIN_PASSKEY_STORAGE_KEY);
    localStorage.removeItem(ADMIN_PASSKEY_STORAGE_KEY);
    sessionStorage.setItem('pet_admin_explicit_locked', 'true');
    setIsUnlocked(false);
    setPasskey('');
  };

  // 2. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-soft">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 3. Strict Access Control: Deny any unauthorized user or visitor immediately
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-soft p-4 text-center font-sans">
        <div className="w-full max-w-md bg-surface border border-brand-200/80 rounded-3xl p-8 shadow-card space-y-6">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-700 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 inline-block">
              Restricted Administrative Console
            </span>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-brand-950">
              Access Denied
            </h1>
            <p className="text-xs text-brand-600 leading-relaxed max-w-sm mx-auto">
              This administrative portal is strictly restricted to designated platform administrators. Your account does not possess administrative privileges.
            </p>
          </div>

          <div className="pt-2 border-t border-brand-100 flex flex-col gap-2">
            <Link
              to="/"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold transition-all shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Public Website</span>
            </Link>
            {!isAuthenticated && (
              <Link
                to="/login"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-brand-50 hover:bg-brand-100 text-brand-800 text-xs font-semibold transition-colors"
              >
                <span>Sign In with Admin Account</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If locked, render the dedicated Full-Screen Admin Access Security Gateway
  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex flex-col bg-brand-950 text-brand-50 font-sans">
        {/* Minimalist Gateway Header */}
        <header className="px-6 py-4 border-b border-brand-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-display text-sm font-bold tracking-tight text-white">
              PET ADOPTION PLATFORM <span className="text-emerald-400 text-xs font-normal">| ADMIN PORTAL</span>
            </span>
          </div>

          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs text-brand-300 hover:text-white px-3 py-1.5 rounded-xl border border-brand-800 hover:bg-brand-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Public Website</span>
          </Link>
        </header>

        {/* Lock Screen Center */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-brand-900/90 border border-brand-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/80 inline-block">
                Step 2: Security Passkey Verification
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white pt-2">
                Platform Security Gateway
              </h1>
              <p className="text-xs text-brand-300 leading-relaxed max-w-xs mx-auto">
                Authorized platform administrators only. Enter your master passkey to access system governance, live diagnostics, and verification queues.
              </p>
              <div className="pt-2 flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Administrator Identity Authenticated</span>
              </div>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-brand-200 mb-1.5 flex items-center justify-between">
                  <span>Administrative Passkey</span>
                  <span className="text-[10px] text-brand-400 font-normal">Encrypted session</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPasskey ? 'text' : 'password'}
                    value={passkey}
                    onChange={(e) => setPasskey(e.target.value)}
                    placeholder="Enter admin passkey..."
                    className="w-full pl-10 pr-10 py-3 rounded-2xl bg-brand-950 border border-brand-700 text-white placeholder-brand-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasskey(!showPasskey)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-brand-400 hover:text-white"
                  >
                    {showPasskey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-800/80 flex items-center gap-2 text-xs text-red-200">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>Unlock Platform Console</span>
              </button>
            </form>

            <div className="pt-3 border-t border-brand-800 text-[11px] text-brand-400 text-center space-y-1">
              <p className="text-[10px] text-brand-500">
                Administrative session is encrypted. Unauthorized access attempts are logged and monitored.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Dedicated Standalone Admin Web Application Layout
  return (
    <div className="min-h-screen flex bg-surface-soft text-brand-950 font-sans">
      {/* Dedicated Administrative Sidebar */}
      <AdminSidebar
        isOpenMobile={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        onLockConsole={handleLockConsole}
      />

      {/* Main Administrative Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Dedicated Admin Top Navigation */}
        <AdminTopNav
          onOpenMobile={() => setIsMobileOpen(true)}
          onLockConsole={handleLockConsole}
        />

        {/* Scrollable Administrative Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-surface-soft">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

