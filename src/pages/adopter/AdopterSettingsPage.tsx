import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/common/Button';
import { Bell, Shield, Lock, Eye, Check } from 'lucide-react';

export const AdopterSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [trialReminders, setTrialReminders] = useState(true);
  const [showProfileToRescues, setShowProfileToRescues] = useState(true);

  const handleSavePreferences = () => {
    showToast('Adoption preferences saved successfully!', 'success');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 text-left">
      <div>
        <span className="text-xs font-bold text-brand-600 uppercase tracking-widest bg-brand-100 px-3.5 py-1 rounded-full">
          Preferences
        </span>
        <h1 className="font-display text-3xl font-extrabold text-brand-950 mt-2">
          Account & Privacy Settings
        </h1>
        <p className="text-xs sm:text-sm text-brand-muted mt-1">
          Manage how providers interact with your profile and alert notifications.
        </p>
      </div>

      <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-brand-200/80 shadow-card space-y-6">
        <h3 className="font-display text-lg font-bold text-brand-950 pb-3 border-b border-brand-100 flex items-center gap-2">
          <Bell className="w-5 h-5 text-brand-600" />
          <span>Notification Preferences</span>
        </h3>

        <div className="space-y-4 text-xs">
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-brand-50/60 border border-brand-100 cursor-pointer">
            <div>
              <span className="font-bold text-brand-900 block text-sm">Adoption Status Email Alerts</span>
              <span className="text-brand-muted">Receive notifications whenever a provider approves or reviews your request</span>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="w-4 h-4 rounded text-brand-700 focus:ring-brand-500 border-brand-300"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-brand-50/60 border border-brand-100 cursor-pointer">
            <div>
              <span className="font-bold text-brand-900 block text-sm">Foster Trial Daily Check-in Reminders</span>
              <span className="text-brand-muted">Helpful morning prompt to note your companion's daily habits</span>
            </div>
            <input
              type="checkbox"
              checked={trialReminders}
              onChange={(e) => setTrialReminders(e.target.checked)}
              className="w-4 h-4 rounded text-brand-700 focus:ring-brand-500 border-brand-300"
            />
          </label>
        </div>
      </div>

      <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-brand-200/80 shadow-card space-y-6">
        <h3 className="font-display text-lg font-bold text-brand-950 pb-3 border-b border-brand-100 flex items-center gap-2">
          <Shield className="w-5 h-5 text-brand-600" />
          <span>Privacy & Shelter Verification</span>
        </h3>

        <div className="space-y-4 text-xs">
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-brand-50/60 border border-brand-100 cursor-pointer">
            <div>
              <span className="font-bold text-brand-900 block text-sm">Allow Verified Providers to View Lifestyle Match</span>
              <span className="text-brand-muted">Helps providers recommend compatible pets before listings go public</span>
            </div>
            <input
              type="checkbox"
              checked={showProfileToRescues}
              onChange={(e) => setShowProfileToRescues(e.target.checked)}
              className="w-4 h-4 rounded text-brand-700 focus:ring-brand-500 border-brand-300"
            />
          </label>
        </div>

        <div className="pt-2 flex justify-end">
          <Button variant="primary" size="md" onClick={handleSavePreferences}>
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
};
