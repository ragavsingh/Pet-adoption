import React, { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Sparkles, User, Home, Shield, ChevronUp, ChevronDown, Check, X, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAdminPath } from '../../utils/adminSecurity';

export const DemoRoleBar: React.FC = () => {
  const { role, switchRole, logout, user } = useAuth();
  const [minimized, setMinimized] = useState(false);
  const [closed, setClosed] = useState(false);
  const navigate = useNavigate();

  // Isolate Demo Mode:
  // In production / GitHub deployments, DemoRoleBar is completely hidden by default.
  // It only renders if the URL contains ?demo=true or localStorage flag is explicitly set.
  const isDemoEnabled = useMemo(() => {
    try {
      if (typeof window === 'undefined') return false;
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('demo') === 'true') {
        localStorage.setItem('pet_enable_demo_mode', 'true');
        return true;
      }
      return localStorage.getItem('pet_enable_demo_mode') === 'true';
    } catch {
      return false;
    }
  }, []);

  if (!isDemoEnabled || closed) {
    return null;
  }

  const handleClose = () => {
    try {
      localStorage.removeItem('pet_enable_demo_mode');
    } catch {}
    setClosed(true);
  };

  const handleSwitch = (newRole: 'adopter' | 'provider' | 'admin') => {
    switchRole(newRole);
    if (newRole === 'adopter') navigate('/adopter/dashboard');
    else if (newRole === 'provider') navigate('/provider/dashboard');
    else if (newRole === 'admin') navigate(getAdminPath('dashboard'));
  };

  return (
    <div className="fixed bottom-4 left-4 z-40 select-none">
      <div className="bg-brand-950/95 text-brand-50 rounded-2xl shadow-soft-lg border border-brand-800 backdrop-blur-md overflow-hidden transition-all text-xs">
        <div className="flex items-center justify-between px-3 py-2 bg-brand-900/60 border-b border-brand-800/80 gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold tracking-wide text-brand-200 uppercase text-[10px]">
              Dev Demo Switcher
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMinimized(!minimized)}
              className="text-brand-400 hover:text-brand-100 p-0.5 rounded transition-colors"
              title={minimized ? 'Expand role bar' : 'Minimize role bar'}
            >
              {minimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleClose}
              className="text-brand-400 hover:text-red-400 p-0.5 rounded transition-colors"
              title="Close and hide demo switcher"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {!minimized && (
          <div className="p-2.5 flex items-center gap-1.5 flex-wrap max-w-md">
            {/* Adopter */}
            <button
              onClick={() => handleSwitch('adopter')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all ${
                role === 'adopter'
                  ? 'bg-brand-400 text-brand-950 font-bold shadow-sm'
                  : 'bg-brand-900/80 text-brand-300 hover:bg-brand-800'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Adopter (Raghav)</span>
              {role === 'adopter' && <Check className="w-3 h-3 ml-0.5" />}
            </button>

            {/* Provider */}
            <button
              onClick={() => handleSwitch('provider')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all ${
                role === 'provider'
                  ? 'bg-brand-400 text-brand-950 font-bold shadow-sm'
                  : 'bg-brand-900/80 text-brand-300 hover:bg-brand-800'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Provider (Sarah)</span>
              {role === 'provider' && <Check className="w-3 h-3 ml-0.5" />}
            </button>

            {/* Admin */}
            <button
              onClick={() => handleSwitch('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all ${
                role === 'admin'
                  ? 'bg-brand-400 text-brand-950 font-bold shadow-sm'
                  : 'bg-brand-900/80 text-brand-300 hover:bg-brand-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
              {role === 'admin' && <Check className="w-3 h-3 ml-0.5" />}
            </button>

            {/* Log Out to Visitor */}
            {user && (
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all bg-brand-900/80 text-brand-300 hover:bg-brand-800"
                title="Log out and view as an unauthenticated visitor"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
