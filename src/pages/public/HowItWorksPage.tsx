import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import {
  Heart,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Users,
  Compass,
  ArrowRight,
  Clock,
  Home,
  FileCheck,
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16 text-left">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold text-brand-600 uppercase tracking-widest bg-brand-100 px-3.5 py-1 rounded-full">
          The Foster-to-Own Journey
        </span>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-brand-950 tracking-tight">
          How Foster-to-Own Protects Pets & Adopters
        </h1>
        <p className="text-base sm:text-lg text-brand-muted leading-relaxed">
          Permanent pet parenthood is a lifetime pledge. Our Foster-to-Own trial ensures that you and your companion bond happily before signing the official adoption certificate.
        </p>
      </div>

      {/* 4 Steps in Detail */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          {
            num: '01',
            title: 'Create Your Adopter Profile',
            desc: 'Tell providers about your lifestyle, living conditions (apartment vs independent home), daily schedule, and experience with animals. This profile serves as your universal application.',
            badge: 'Universal Application',
            icon: Users,
          },
          {
            num: '02',
            title: 'Discover Verified Pets',
            desc: 'Browse dogs and cats listed by verified rescues. Every pet profile includes Provider Insights detailing personality quirks, favorite treats, energy levels, and house manners.',
            badge: 'Verified Rescues',
            icon: Compass,
          },
          {
            num: '03',
            title: 'Submit an Adoption Request',
            desc: 'Apply directly through our structured modal. The provider reviews your profile and conducts a mutual interview or home check to confirm safety.',
            badge: 'Structured Review',
            icon: FileCheck,
          },
          {
            num: '04',
            title: 'The 14-Day Foster Trial',
            desc: 'Bring the pet home on a defined trial period. Keep a daily foster journal in your dashboard, request extensions if needed, or make the adoption official with a Certificate of Adoption.',
            badge: 'Bonding Guaranteed',
            icon: Calendar,
          },
        ].map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.num}
              className="bg-surface rounded-3xl p-8 border border-brand-200/80 shadow-card flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-display text-4xl font-extrabold text-brand-300">
                    {step.num}
                  </span>
                  <span className="text-xs font-bold text-brand-700 bg-brand-100 px-3 py-1 rounded-full">
                    {step.badge}
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold text-brand-950 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-brand-muted leading-relaxed">
                  {step.desc}
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-brand-100 flex items-center text-brand-700 text-xs font-bold gap-2">
                <Icon className="w-4 h-4 text-brand-600" />
                <span>Phase {step.num} of Adoption</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trial Explainer Box */}
      <div className="bg-brand-950 text-white rounded-3xl p-8 sm:p-12 space-y-6">
        <div className="max-w-2xl space-y-3">
          <span className="text-xs font-bold text-brand-300 uppercase tracking-widest bg-brand-900 px-3 py-1 rounded-full border border-brand-800">
            Why Foster First?
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            Reducing pet returns from 20% down to under 2%.
          </h2>
          <p className="text-sm text-brand-300 leading-relaxed">
            In standard adoptions, unpredictable behavioral friction can lead to heartbreak and surrendered pets. The Foster-to-Own model creates a compassionate buffer where adjustments, trainer tips, and genuine love blossom naturally.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-brand-800">
          <div>
            <h4 className="text-brand-100 font-bold text-sm">Real Compatibility</h4>
            <p className="text-brand-400 text-xs mt-1">See how the pet interacts with your furniture, schedule, and neighbors.</p>
          </div>
          <div>
            <h4 className="text-brand-100 font-bold text-sm">Provider Support</h4>
            <p className="text-brand-400 text-xs mt-1">The rescue caregiver stays available via chat throughout the 14 days.</p>
          </div>
          <div>
            <h4 className="text-brand-100 font-bold text-sm">Official Certificate</h4>
            <p className="text-brand-400 text-xs mt-1">Finalize adoption with an official legal pledge and adoption certificate.</p>
          </div>
        </div>

        <div className="pt-2">
          <Link to="/pets">
            <Button variant="secondary" size="lg">
              Explore Available Pets
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
