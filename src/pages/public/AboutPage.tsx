import React from 'react';
import {
  ShieldCheck,
  Heart,
  Users,
  Compass,
  FileText,
  Clock,
  CheckCircle2,
  Building2,
  Bell,
  Shield,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16 text-left">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold text-brand-600 uppercase tracking-widest bg-brand-100 px-3.5 py-1 rounded-full">
          About PET ADOPTION
        </span>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-brand-950 tracking-tight">
          Pets Are Not Products.
        </h1>
        <p className="text-base sm:text-lg text-brand-muted leading-relaxed">
          PET ADOPTION is an ethical platform designed to eliminate the commercialization of animals and connect loving people with pets in need of rescue, foster, and lifelong care.
        </p>
      </div>

      {/* Core Principles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-surface rounded-3xl p-8 border border-brand-200/80 shadow-card space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="font-display text-xl font-bold text-brand-950">
            Welfare First Philosophy
          </h3>
          <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
            Every decision on our platform is evaluated against animal health, safety, and psychological well-being. We firmly reject commercial breeding and puppy mills.
          </p>
        </div>

        <div className="bg-surface rounded-3xl p-8 border border-brand-200/80 shadow-card space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-display text-xl font-bold text-brand-950">
            Transparency & Verification
          </h3>
          <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
            Every provider is audited and verified. Pet listings must disclose full medical history, vaccination records, quirks, and daily routine needs.
          </p>
        </div>

        <div className="bg-surface rounded-3xl p-8 border border-brand-200/80 shadow-card space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-display text-xl font-bold text-brand-950">
            Foster-to-Own Innovation
          </h3>
          <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
            We pioneered the 14-day bonding trial period, giving adopters and pets time to build trust and ensure mutual compatibility before permanent legal adoption.
          </p>
        </div>
      </div>

      {/* Platform Journey Overview */}
      <div className="bg-surface rounded-3xl p-8 sm:p-12 border border-brand-200/80 shadow-card space-y-6">
        <div className="max-w-3xl space-y-4">
          <span className="text-xs font-bold text-brand-600 uppercase tracking-widest bg-brand-100 px-3.5 py-1 rounded-full">
            Ecosystem Overview
          </span>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-950 tracking-tight">
            More Than Pet Listings. A Complete Adoption Journey.
          </h2>
          <p className="text-sm sm:text-base text-brand-muted leading-relaxed">
            PET ADOPTION is a modern digital platform designed to make pet adoption safer, more transparent, and more meaningful. From discovering the right companion and submitting an adoption request to experiencing a Foster-to-Own trial and making the adoption official, the platform brings the entire adoption journey into one connected ecosystem.
          </p>
        </div>
      </div>

      {/* Supporting Capabilities Section */}
      <div className="space-y-8">
        <div className="text-left space-y-2">
          <span className="text-xs font-bold text-brand-600 uppercase tracking-widest bg-brand-100 px-3.5 py-1 rounded-full">
            Platform Capabilities
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-950 tracking-tight">
            Built for the Complete Adoption Journey
          </h2>
          <p className="text-sm text-brand-muted max-w-2xl leading-relaxed">
            Every feature is purpose-built to guide adopters and rescue providers through a responsible, transparent, and bonded transition.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-surface rounded-3xl p-6 border border-brand-200/80 shadow-card space-y-3 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 shrink-0">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-extrabold text-brand-400 font-mono">01</span>
            </div>
            <h3 className="font-display text-base font-bold text-brand-950">
              Smart Pet Discovery
            </h3>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              Explore detailed pet profiles and discover companions based on meaningful information and preferences.
            </p>
          </div>

          <div className="bg-surface rounded-3xl p-6 border border-brand-200/80 shadow-card space-y-3 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-extrabold text-brand-400 font-mono">02</span>
            </div>
            <h3 className="font-display text-base font-bold text-brand-950">
              Adoption Management
            </h3>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              Submit, review, approve, reject, and manage adoption requests through a structured and transparent workflow.
            </p>
          </div>

          <div className="bg-surface rounded-3xl p-6 border border-brand-200/80 shadow-card space-y-3 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 shrink-0">
                <Heart className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-extrabold text-brand-400 font-mono">03</span>
            </div>
            <h3 className="font-display text-base font-bold text-brand-950">
              Foster-to-Own
            </h3>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              Give adopters the opportunity to experience life with a pet during a trial period before making a permanent commitment.
            </p>
          </div>

          <div className="bg-surface rounded-3xl p-6 border border-brand-200/80 shadow-card space-y-3 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-extrabold text-brand-400 font-mono">04</span>
            </div>
            <h3 className="font-display text-base font-bold text-brand-950">
              Trial Management
            </h3>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              Track trial duration, countdowns, extensions, and important milestones throughout the Foster-to-Own journey.
            </p>
          </div>

          <div className="bg-surface rounded-3xl p-6 border border-brand-200/80 shadow-card space-y-3 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-extrabold text-brand-400 font-mono">05</span>
            </div>
            <h3 className="font-display text-base font-bold text-brand-950">
              Secure Adoption Completion
            </h3>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              Move from a successful trial to permanent adoption through a verified and structured completion process.
            </p>
          </div>

          <div className="bg-surface rounded-3xl p-6 border border-brand-200/80 shadow-card space-y-3 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-extrabold text-brand-400 font-mono">06</span>
            </div>
            <h3 className="font-display text-base font-bold text-brand-950">
              Provider Management
            </h3>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              Help shelters, rescuers, and pet welfare organizations manage pets, adoption requests, and adoption journeys.
            </p>
          </div>

          <div className="bg-surface rounded-3xl p-6 border border-brand-200/80 shadow-card space-y-3 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-extrabold text-brand-400 font-mono">07</span>
            </div>
            <h3 className="font-display text-base font-bold text-brand-950">
              Notifications & Communication
            </h3>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              Keep adopters and providers informed through in-platform notifications and transactional email updates.
            </p>
          </div>

          <div className="bg-surface rounded-3xl p-6 border border-brand-200/80 shadow-card space-y-3 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-extrabold text-brand-400 font-mono">08</span>
            </div>
            <h3 className="font-display text-base font-bold text-brand-950">
              Administrative Oversight
            </h3>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              Provide secure tools for provider verification, pet moderation, reports, user management, and platform governance.
            </p>
          </div>

          <div className="bg-surface rounded-3xl p-6 border border-brand-200/80 shadow-card space-y-3 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-extrabold text-brand-400 font-mono">09</span>
            </div>
            <h3 className="font-display text-base font-bold text-brand-950">
              Privacy & Security
            </h3>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              Protect users and platform operations through authentication, authorization, role-based access control, database security, and secure data handling.
            </p>
          </div>

          <div className="bg-surface rounded-3xl p-6 border border-brand-200/80 shadow-card space-y-3 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-extrabold text-brand-400 font-mono">10</span>
            </div>
            <h3 className="font-display text-base font-bold text-brand-950">
              Scalable Platform Architecture
            </h3>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              Designed as a modern full-stack platform that can evolve with new features, services, organizations, and adoption communities.
            </p>
          </div>
        </div>
      </div>

      {/* Vision Section */}
      <div className="bg-brand-50 rounded-3xl p-8 sm:p-12 border border-brand-200 shadow-sm text-left space-y-4">
        <div className="flex items-center gap-2 text-brand-700">
          <Sparkles className="w-5 h-5 text-brand-600" />
          <span className="text-xs font-bold uppercase tracking-widest text-brand-700">
            Our Vision
          </span>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-950 tracking-tight">
          Our Vision
        </h2>
        <p className="text-base sm:text-lg text-brand-900 leading-relaxed max-w-3xl font-medium">
          "To create a trusted digital ecosystem where technology makes pet adoption more responsible, transparent, and accessible — helping more pets find safe, caring, and loving forever homes."
        </p>
      </div>
    </div>
  );
};
