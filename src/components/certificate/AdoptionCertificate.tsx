import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Pet } from '../../types/pet';
import { Logo } from '../common/Logo';
import { Button } from '../common/Button';
import { Heart, Printer, Share2, Award, ShieldCheck, Sparkles, CheckCircle, Home, ArrowLeft, Download, Loader2 } from 'lucide-react';
import {
  downloadCertificateAsImage,
  printCertificateIsolated,
} from '../../utils/certificateDownloader';

interface AdoptionCertificateProps {
  pet: Pet;
  adopterName: string;
  providerName: string;
  adoptionDate?: string;
  certificateNumber?: string;
  onPrint?: () => void;
}

export const AdoptionCertificate: React.FC<AdoptionCertificateProps> = ({
  pet,
  adopterName,
  providerName,
  adoptionDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
  certificateNumber,
  onPrint,
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#6B4A3A', '#C8AA83', '#F5EFE6', '#E8E5E1'],
      });
    }
  }, []);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }
    if (certificateRef.current) {
      printCertificateIsolated(
        certificateRef.current,
        `Adoption Certificate - ${pet.name}${certificateNumber ? ` - ${certificateNumber}` : ''}`
      );
    } else {
      window.print();
    }
  };

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    setIsDownloading(true);
    try {
      const cleanPetName = pet.name.trim().replace(/[^a-zA-Z0-9_-]/g, '-');
      const filename = `Adoption-Certificate-${cleanPetName}${certificateNumber ? `-${certificateNumber}` : ''}`;
      const success = await downloadCertificateAsImage(certificateRef.current, filename);
      if (!success) {
        // Fallback to print isolation
        handlePrint();
      }
    } catch (err) {
      console.error('Failed to download certificate image:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto text-center">
      {/* Celebration Header */}
      <div className="space-y-3 animate-fade-in">
        <div className="inline-flex items-center gap-2 bg-brand-100 border border-brand-300 px-4 py-1.5 rounded-full text-xs font-bold text-brand-900 shadow-sm">
          <Sparkles className="w-4 h-4 text-brand-700" />
          <span>OFFICIAL FOSTER-TO-OWN COMPLETION</span>
        </div>

        <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-brand-950 tracking-tight">
          IT'S OFFICIAL ❤️
        </h2>

        <p className="text-base sm:text-lg text-brand-muted max-w-xl mx-auto leading-relaxed">
          Congratulations! You and <strong className="text-brand-950">{pet.name}</strong> are starting a wonderful new chapter together in your forever home.
        </p>
      </div>

      {/* Elegant Certificate Card */}
      <div
        ref={certificateRef}
        id="printable-adoption-certificate"
        className="relative bg-surface rounded-3xl p-8 sm:p-14 border-8 border-double border-brand-300 shadow-soft-lg text-brand-950 text-center space-y-8 print:border-4 print:shadow-none"
      >
        {/* Watermark Paw in background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <img src="/logo-icon.png" alt="" className="w-96 h-96 object-contain" />
        </div>

        {/* Certificate Header */}
        <div className="space-y-2 border-b border-brand-200 pb-6">
          <div className="flex justify-center mb-2">
            <Link to="/" title="Return to Home Page" className="inline-block hover:opacity-85 transition-opacity">
              <Logo size="md" showTagline={false} />
            </Link>
          </div>
          <span className="text-xs font-extrabold tracking-[0.25em] text-brand-600 uppercase">
            Official Document of Care & Sanctuary
          </span>
          <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-brand-900 tracking-tight">
            CERTIFICATE OF ADOPTION
          </h3>
          {certificateNumber && (
            <span className="inline-block px-3 py-0.5 rounded-full bg-brand-100 text-brand-800 text-[10px] font-mono font-bold tracking-wider">
              REGISTRATION NO: {certificateNumber}
            </span>
          )}
        </div>

        {/* Certificate Body */}
        <div className="space-y-4 py-2">
          <p className="text-sm uppercase tracking-widest text-brand-500 font-semibold">
            This certifies that
          </p>

          <div className="py-2">
            <span className="font-display text-3xl sm:text-5xl font-extrabold text-brand-800 tracking-tight block">
              {pet.name.toUpperCase()}
            </span>
            <span className="text-xs font-bold text-brand-600 tracking-wider uppercase mt-1 block">
              {pet.breed} • {pet.gender} • {pet.age}
            </span>
          </div>

          <p className="text-sm uppercase tracking-widest text-brand-500 font-semibold">
            has officially found a loving forever home with
          </p>

          <span className="font-display text-2xl sm:text-3xl font-bold text-brand-950 tracking-tight block">
            {adopterName}
          </span>
        </div>

        {/* Pet Image in Oval Badge */}
        <div className="flex justify-center my-4">
          <div className="relative p-1.5 rounded-full border-2 border-brand-300 bg-brand-50 shadow-sm">
            <img
              src={pet.images[0]}
              alt={pet.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover"
            />
            <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand-700 text-white flex items-center justify-center shadow">
              <Heart className="w-4 h-4 fill-white" />
            </div>
          </div>
        </div>

        {/* Certificate Signatures & Seal */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-brand-200 text-xs">
          <div>
            <span className="text-brand-400 block mb-1 text-[11px] uppercase tracking-wider">Date of Adoption</span>
            <p className="font-bold text-brand-900 text-sm">{adoptionDate}</p>
          </div>

          <div className="flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-brand-400 flex flex-col items-center justify-center text-brand-700">
              <ShieldCheck className="w-5 h-5 text-brand-600" />
              <span className="text-[9px] font-extrabold uppercase mt-0.5">Verified</span>
            </div>
          </div>

          <div>
            <span className="text-brand-400 block mb-1 text-[11px] uppercase tracking-wider">Verified Provider</span>
            <p className="font-bold text-brand-900 text-sm">{providerName}</p>
          </div>
        </div>

        {/* Ethical Pledge */}
        <p className="text-[11px] text-brand-400/90 italic max-w-md mx-auto pt-2">
          "A pet is a lifelong promise of safety, gentleness, nutrition, and companionship."
        </p>
      </div>

      {/* Print / Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3.5 pt-4 print:hidden">
        <Link to="/" className="w-full sm:w-auto">
          <Button
            variant="primary"
            size="lg"
            leftIcon={<Home className="w-5 h-5" />}
            className="w-full sm:w-auto shadow-md"
          >
            Return to Home Page
          </Button>
        </Link>

        <Button
          variant="outline"
          size="lg"
          onClick={handleDownload}
          disabled={isDownloading}
          leftIcon={
            isDownloading ? (
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            ) : (
              <Download className="w-5 h-5 text-emerald-600" />
            )
          }
          className="w-full sm:w-auto font-bold text-brand-900 border-brand-300 hover:bg-brand-50 shadow-sm"
        >
          {isDownloading ? 'Downloading Certificate...' : 'Download Certificate (PNG)'}
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={handlePrint}
          leftIcon={<Printer className="w-5 h-5 text-brand-600" />}
          className="w-full sm:w-auto shadow-sm"
        >
          Print / Save PDF
        </Button>

        <Link to="/adopter/dashboard" className="w-full sm:w-auto">
          <Button
            variant="ghost"
            size="lg"
            className="w-full sm:w-auto text-brand-700 hover:text-brand-950"
          >
            View Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};
