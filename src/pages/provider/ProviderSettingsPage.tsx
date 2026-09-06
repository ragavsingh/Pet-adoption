import React, { useState } from 'react';
import { Button } from '../../components/common/Button';
import { useToast } from '../../contexts/ToastContext';
import { Settings, ShieldCheck, Mail, MapPin } from 'lucide-react';

export const ProviderSettingsPage: React.FC = () => {
  const { showToast } = useToast();
  const [instantEmailAlerts, setInstantEmailAlerts] = useState(true);
  const [requireVideoCheck, setRequireVideoCheck] = useState(true);

  const handleSave = () => {
    showToast('Provider settings updated.', 'success');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 text-left">
      <div>
        <span className="text-xs font-bold text-brand-600 uppercase tracking-widest bg-brand-100 px-3.5 py-1 rounded-full">
          Rescue Configuration
        </span>
        <h1 className="font-display text-3xl font-extrabold text-brand-950 mt-2">
          Provider & Shelter Settings
        </h1>
        <p className="text-xs sm:text-sm text-brand-muted mt-1">
          Configure application intake screening parameters.
        </p>
      </div>

      <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-brand-200/80 shadow-card space-y-5">
        <h3 className="font-display text-lg font-bold text-brand-950 pb-3 border-b border-brand-100">
          Adoption Intake Criteria
        </h3>

        <div className="space-y-4 text-xs">
          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-brand-50/60 border border-brand-100 cursor-pointer">
            <div>
              <span className="font-bold text-brand-900 block text-sm">Instant SMS/Email on New Applications</span>
              <span className="text-brand-muted">Receive real-time alerts when prospective adopters submit requests</span>
            </div>
            <input
              type="checkbox"
              checked={instantEmailAlerts}
              onChange={(e) => setInstantEmailAlerts(e.target.checked)}
              className="w-4 h-4 rounded text-brand-700 focus:ring-brand-500 border-brand-300"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-2xl bg-brand-50/60 border border-brand-100 cursor-pointer">
            <div>
              <span className="font-bold text-brand-900 block text-sm">Require Home Video / Virtual Walkaround</span>
              <span className="text-brand-muted">Ask applicants to provide balcony and yard safety verification before trial</span>
            </div>
            <input
              type="checkbox"
              checked={requireVideoCheck}
              onChange={(e) => setRequireVideoCheck(e.target.checked)}
              className="w-4 h-4 rounded text-brand-700 focus:ring-brand-500 border-brand-300"
            />
          </label>
        </div>

        <div className="pt-2 flex justify-end">
          <Button variant="primary" size="md" onClick={handleSave}>
            Save Provider Settings
          </Button>
        </div>
      </div>
    </div>
  );
};
