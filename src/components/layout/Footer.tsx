import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { Heart, ShieldCheck, Instagram, Facebook, Twitter, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-brand-950 text-brand-100 border-t border-brand-900 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-brand-800/80">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Logo variant="light" size="lg" />
            <p className="text-brand-300 text-sm max-w-sm leading-relaxed">
              PET ADOPTION is a mission-driven digital foster-and-adoption platform connecting verified rescue providers with responsible adopters.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 bg-brand-900 text-brand-300 px-3 py-1 rounded-full text-xs font-semibold border border-brand-800">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
                Ethical • Foster-to-Own • Zero Breeder Policy
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-bold text-sm text-brand-100 uppercase tracking-wider mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/pets" className="text-brand-300 hover:text-white transition-colors">
                  Find Pets for Adoption
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-brand-300 hover:text-white transition-colors">
                  How Foster-to-Own Works
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-brand-300 hover:text-white transition-colors">
                  Our Welfare Mission
                </Link>
              </li>
              <li>
                <Link to="/for-providers" className="text-brand-300 hover:text-white transition-colors">
                  Shelter & Provider Network
                </Link>
              </li>
            </ul>
          </div>

          {/* Adopters & Community */}
          <div>
            <h4 className="font-display font-bold text-sm text-brand-100 uppercase tracking-wider mb-4">
              Adoption Journey
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/signup" className="text-brand-300 hover:text-white transition-colors">
                  Create Adopter Profile
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-brand-300 hover:text-white transition-colors">
                  Provider Portal Login
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-brand-300 hover:text-white transition-colors">
                  Help & Support Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Hours */}
          <div>
            <h4 className="font-display font-bold text-sm text-brand-100 uppercase tracking-wider mb-4">
              Contact & Safe Space
            </h4>
            <ul className="space-y-3 text-xs text-brand-300">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                <span>Pan-India Pet Welfare Network (Mumbai • Delhi • Bangalore • Pune)</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-400 shrink-0" />
                <span>support@petadoption.org</span>
              </li>
            </ul>
            <div className="flex items-center gap-3 pt-4 text-brand-400">
              <a href="#" className="w-8 h-8 rounded-full bg-brand-900 flex items-center justify-center hover:bg-brand-800 hover:text-white transition-colors" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-brand-900 flex items-center justify-center hover:bg-brand-800 hover:text-white transition-colors" aria-label="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-brand-900 flex items-center justify-center hover:bg-brand-800 hover:text-white transition-colors" aria-label="Twitter">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-brand-400">
          <p className="flex items-center gap-1.5 text-center md:text-left">
            <span>© 2026 PET ADOPTION. Designed with</span>
            <Heart className="w-3.5 h-3.5 text-brand-400 fill-brand-400" />
            <span>for pet welfare and forever homes.</span>
          </p>

          <p className="text-center md:text-right text-[11px] text-brand-400/80">
            A modern connected digital platform for responsible pet adoption & foster care.
          </p>
        </div>
      </div>
    </footer>
  );
};
