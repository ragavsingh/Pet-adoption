import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { ShieldCheck, PlusCircle, CheckCircle2, HeartHandshake, Inbox, Sparkles } from 'lucide-react';

export const ForProvidersPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16 text-left">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold text-brand-600 uppercase tracking-widest bg-brand-100 px-3.5 py-1 rounded-full">
          Rescues, Shelters & Foster Parents
        </span>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-brand-950 tracking-tight">
          Tools for Ethical Pet Providers
        </h1>
        <p className="text-base sm:text-lg text-brand-muted leading-relaxed">
          PET ADOPTION empowers certified rescue workers, NGOs, and individual caregivers with modern tools to screen adopters, manage foster trials, and track adoptions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-surface rounded-3xl p-8 border border-brand-200/80 shadow-card space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700">
            <PlusCircle className="w-6 h-6" />
          </div>
          <h3 className="font-display text-xl font-bold text-brand-950">
            8-Step Listing Wizard
          </h3>
          <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
            Create high-detail pet profiles covering health checks, temperament sliders, compatibility matrices, and your personal foster insights.
          </p>
        </div>

        <div className="bg-surface rounded-3xl p-8 border border-brand-200/80 shadow-card space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="font-display text-xl font-bold text-brand-950">
            Pre-Screened Applications
          </h3>
          <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
            Review detailed adopter home environments, work hours, family composition, and prior experience before accepting requests.
          </p>
        </div>

        <div className="bg-surface rounded-3xl p-8 border border-brand-200/80 shadow-card space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-display text-xl font-bold text-brand-950">
            Verified Provider Badge
          </h3>
          <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
            Earn community trust with transparent verification, ensuring adopters recognize your shelter as a responsible welfare sanctuary.
          </p>
        </div>
      </div>

      <div className="bg-brand-950 text-white rounded-3xl p-8 sm:p-12 text-center space-y-6">
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold">
          Ready to list pets and find loving forever families?
        </h2>
        <p className="text-sm text-brand-300 max-w-lg mx-auto">
          Start publishing pet profiles today with our intuitive provider dashboard.
        </p>
        <div className="pt-2 flex justify-center gap-4">
          <Link to="/provider/pets/new">
            <Button variant="secondary" size="lg" leftIcon={<PlusCircle className="w-5 h-5" />}>
              List a New Pet Listing
            </Button>
          </Link>
          <Link to="/provider/dashboard">
            <Button variant="outline" size="lg" className="border-brand-700 text-brand-200">
              Open Provider Portal
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
