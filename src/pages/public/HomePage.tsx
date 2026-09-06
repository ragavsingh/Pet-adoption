import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { PetCard } from '../../components/common/PetCard';
import { petService } from '../../services/petService';
import { Pet } from '../../types/pet';
import { realtimeSync } from '../../services/realtimeSync';
import {
  Heart,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Compass,
  CheckCircle2,
  Calendar,
  Home,
  Users,
  Award,
  Clock,
  ChevronRight,
  Star,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [featuredPets, setFeaturedPets] = useState<Pet[]>([]);

  const loadFeatured = () => {
    petService.getFeaturedPets().then(setFeaturedPets);
  };

  useEffect(() => {
    loadFeatured();

    const unsubscribe = realtimeSync.subscribe((event) => {
      if (
        event.type === 'adoption_request_updated' ||
        event.type === 'foster_trial_updated' ||
        event.type === 'pet_updated' ||
        event.type === 'pet_status_updated' ||
        event.type === 'all'
      ) {
        loadFeatured();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);


  return (
    <div className="space-y-20 sm:space-y-28 pb-16">
      {/* 1. HERO SECTION (Section 7) */}
      <section className="relative pt-6 sm:pt-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 border border-brand-200/80 text-brand-800 text-xs font-bold tracking-wide shadow-sm">
                <span className="w-2 h-2 rounded-full bg-brand-700 animate-pulse" />
                <span>Ethical Foster-to-Own Platform</span>
              </div>

              {/* Headline */}
              <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold text-brand-950 tracking-tight leading-[1.05]">
                Every pet deserves a <span className="text-brand-700 underline decoration-brand-300 decoration-wavy decoration-2">loving home.</span>
              </h1>

              {/* Supporting text */}
              <p className="text-base sm:text-xl text-brand-muted max-w-xl leading-relaxed">
                Discover pets looking for a loving family, learn their story, and take the first step toward giving them a forever home.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Link to="/pets">
                  <Button
                    variant="primary"
                    size="lg"
                    leftIcon={<Compass className="w-5 h-5" />}
                    className="w-full sm:w-auto shadow-soft-lg"
                  >
                    Find Your Companion
                  </Button>
                </Link>

                <Link to="/provider/pets/new">
                  <Button
                    variant="cream"
                    size="lg"
                    leftIcon={<Home className="w-5 h-5" />}
                    className="w-full sm:w-auto"
                  >
                    List a Pet
                  </Button>
                </Link>
              </div>

              {/* Trust highlights */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-brand-200/70 text-brand-800">
                <div>
                  <span className="font-display text-2xl sm:text-3xl font-extrabold block text-brand-950">
                    350+
                  </span>
                  <span className="text-xs text-brand-muted font-medium">
                    Forever Homes Found
                  </span>
                </div>
                <div>
                  <span className="font-display text-2xl sm:text-3xl font-extrabold block text-brand-950">
                    100%
                  </span>
                  <span className="text-xs text-brand-muted font-medium">
                    Health Verified Pets
                  </span>
                </div>
                <div>
                  <span className="font-display text-2xl sm:text-3xl font-extrabold block text-brand-950">
                    14 Days
                  </span>
                  <span className="text-xs text-brand-muted font-medium">
                    Foster-to-Own Trial
                  </span>
                </div>
              </div>
            </div>

            {/* Right Hero Image with Floating Cards */}
            <div className="lg:col-span-5 relative">
              {/* Main Realistic Pet Image */}
              <div className="relative rounded-3xl sm:rounded-[36px] overflow-hidden aspect-[4/5] border-4 border-white shadow-soft-lg bg-brand-100">
                <img
                  src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=1200"
                  alt="Bruno, a happy Labrador Retriever"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-950/40 via-transparent to-transparent" />
              </div>

              {/* Floating Card 1: Verified Provider */}
              <div className="absolute -top-4 -left-4 sm:-left-8 bg-surface/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-soft-lg border border-brand-200/80 flex items-center gap-3 animate-fade-in">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700">
                  <ShieldCheck className="w-5 h-5 text-brand-700" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-brand-950 leading-none">Verified Provider</p>
                  <p className="text-[10px] text-brand-muted mt-0.5">Shelter & Rescues Checked</p>
                </div>
              </div>

              {/* Floating Card 2: Available for Adoption */}
              <div className="absolute top-1/2 -right-4 sm:-right-8 bg-surface/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-soft-lg border border-brand-200/80 flex items-center gap-3 animate-fade-in">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-brand-950 leading-none">Available for Adoption</p>
                  <p className="text-[10px] text-brand-muted mt-0.5">Fully Vaccinated & Health Checked</p>
                </div>
              </div>

              {/* Floating Card 3: New Friend Waiting */}
              <div className="absolute -bottom-5 left-6 right-6 sm:left-10 sm:right-10 bg-surface/95 backdrop-blur-md p-4 rounded-2xl shadow-soft-lg border border-brand-200/80 flex items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                    <Heart className="w-5 h-5 fill-rose-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-brand-950">New Friend Waiting</p>
                    <p className="text-[10px] text-brand-muted">Bruno is looking for daily jogs & cuddles</p>
                  </div>
                </div>
                <Link to="/pets/pet_bruno" className="text-xs font-bold text-brand-700 hover:text-brand-900 shrink-0">
                  Meet Bruno →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUST SECTION */}
      <section className="bg-surface py-12 border-y border-brand-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-bold text-base text-brand-950">Zero Breeder Policy</h4>
                <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                  Pets are not products. We exclusively support genuine rescue shelters, strays, and family re-homing.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-bold text-base text-brand-950">Foster-to-Own Model</h4>
                <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                  A 14-day trial period ensures real lifestyle and temperament compatibility before permanent commitment.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-bold text-base text-brand-950">Medical Transparency</h4>
                <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                  Every listed pet undergoes complete veterinary vaccination, deworming, and sterilization verification.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-display font-bold text-base text-brand-950">Post-Adoption Support</h4>
                <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                  Direct connection with experienced foster caregivers and guidance resources for a smooth transition.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS (Section 8) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span className="text-xs font-bold text-brand-600 uppercase tracking-widest bg-brand-100 px-3.5 py-1 rounded-full">
          Simple & Responsible Process
        </span>
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-brand-950 mt-3 mb-4">
          How PET ADOPTION Works
        </h2>
        <p className="text-sm sm:text-base text-brand-muted max-w-xl mx-auto mb-14">
          Our four-step journey is built to safeguard pet welfare and make your adoption experience joyful and transparent.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {[
            {
              step: '01',
              title: 'Create Your Profile',
              desc: 'Share your living space, schedule, and experience to help providers understand your home environment.',
              icon: Users,
            },
            {
              step: '02',
              title: 'Discover a Pet',
              desc: 'Browse verified listings with deep insights into daily routines, quirks, and personality metrics.',
              icon: Compass,
            },
            {
              step: '03',
              title: 'Send an Adoption Request',
              desc: 'Submit a structured request. Verified providers review applications and initiate the Foster-to-Own trial.',
              icon: Heart,
            },
            {
              step: '04',
              title: 'Welcome Them Home',
              desc: 'Complete the bonding trial period, finalize the adoption pledge, and receive your official Certificate of Adoption.',
              icon: Home,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="relative bg-surface rounded-3xl p-7 border border-brand-200/80 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <span className="font-display text-3xl font-extrabold text-brand-300 group-hover:text-brand-700 transition-colors block mb-4">
                    {item.step}
                  </span>
                  <h3 className="font-display text-lg font-bold text-brand-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-brand-muted leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="pt-6 mt-4 border-t border-brand-100 flex items-center justify-between text-brand-700">
                  <Icon className="w-5 h-5 text-brand-600" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-500">
                    Step {item.step}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. FEATURED PETS (Section 7) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="text-left">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest bg-brand-100 px-3.5 py-1 rounded-full">
              Waiting for You
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-brand-950 mt-2">
              Featured Companions
            </h2>
            <p className="text-sm text-brand-muted mt-1">
              Meet wonderful souls ready to welcome you with unconditional love.
            </p>
          </div>

          <Link to="/pets">
            <Button variant="outline" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              View All Available Pets
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredPets.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      </section>

      {/* 5. WHY PET ADOPTION */}
      <section className="bg-brand-950 text-white py-20 rounded-3xl sm:rounded-[40px] max-w-7xl mx-auto px-6 sm:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-left">
            <span className="text-xs font-bold text-brand-300 uppercase tracking-widest bg-brand-900 px-3.5 py-1 rounded-full border border-brand-800">
              Why PET ADOPTION?
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              A humane approach to finding family.
            </h2>
            <p className="text-brand-300 text-sm sm:text-base leading-relaxed">
              Traditional classifieds treat pets like merchandise. PET ADOPTION transforms this with a thoughtful Foster-to-Own model that prioritizes the animal’s emotional health and the adopter's lifestyle.
            </p>

            <div className="space-y-4 pt-2">
              {[
                { title: 'Foster-to-Own Trial', desc: 'Spend 14 days bonding in your home before making the official adoption decision.' },
                { title: 'Provider Insights', desc: 'Learn exact dietary habits, favorite treats, quirks, and daily routines from the foster parent.' },
                { title: 'Zero Commercial Fees', desc: 'No transaction markups or commercial breeders. Pure ethical rehoming.' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-800 text-brand-300 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-brand-300" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                    <p className="text-xs text-brand-300/80 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Link to="/how-it-works">
                <Button variant="secondary" size="lg">
                  Learn How Foster-to-Own Works
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl overflow-hidden aspect-[4/3] border-4 border-brand-800/80 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&q=80&w=1000"
                alt="Luna enjoying peaceful family time"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-brand-900 border border-brand-800 p-5 rounded-3xl max-w-xs text-left shadow-xl hidden sm:block">
              <div className="flex items-center gap-1 text-amber-400 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <p className="text-xs text-brand-100 font-medium">
                "The 14-day foster trial gave us the confidence that Bruno was the perfect fit for our apartment."
              </p>
              <span className="text-[10px] text-brand-400 mt-2 block">— Raghav & Bruno (Adopted 2026)</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PET STORIES / FOSTER JOURNEY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span className="text-xs font-bold text-brand-600 uppercase tracking-widest bg-brand-100 px-3.5 py-1 rounded-full">
          Forever Happy Stories
        </span>
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-brand-950 mt-3 mb-10">
          Transforming Lives, One Home at a Time
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {[
            {
              pet: 'Bella',
              breed: 'Cocker Spaniel',
              adopter: 'Pooja & Vikram Mehta',
              img: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=800',
              story: 'Bella was surrendered after a family relocated abroad. Through Sarah’s foster guidance and our 14-day trial, she quickly felt at home. She now rules our sofa!',
            },
            {
              pet: 'Rocky',
              breed: 'Indie Puppy',
              adopter: 'Ananya Deshmukh',
              img: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800',
              story: 'Found abandoned on a rainy highway near Pune, Rocky was nursed back to full health. He completed his trial with Ananya and is now her marathon training buddy.',
            },
            {
              pet: 'Oliver',
              breed: 'British Shorthair Mix',
              adopter: 'Karan Sen',
              img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800',
              story: 'Oliver was a quiet shelter cat who blossomed during foster care. His daily routine matches Karan’s remote work life perfectly.',
            },
          ].map((story, i) => (
            <div key={i} className="bg-surface rounded-3xl overflow-hidden border border-brand-200/80 shadow-card flex flex-col justify-between">
              <div className="aspect-[16/10] overflow-hidden bg-brand-100">
                <img src={story.img} alt={story.pet} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-display font-bold text-lg text-brand-950">{story.pet}</h4>
                    <span className="text-[11px] font-bold text-brand-700 bg-brand-100 px-2 py-0.5 rounded-full">
                      Official Adoption
                    </span>
                  </div>
                  <p className="text-xs text-brand-500 font-semibold mb-3">Adopted by {story.adopter}</p>
                  <p className="text-xs text-brand-muted leading-relaxed italic">
                    "{story.story}"
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. FINAL CTA BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-brand-100 via-surface to-brand-50 rounded-3xl sm:rounded-[36px] p-8 sm:p-14 border border-brand-300 shadow-soft text-center space-y-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-700 text-white text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ready to Make a Difference?</span>
          </span>

          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-brand-950 tracking-tight max-w-2xl mx-auto">
            Find your companion and give them a forever home.
          </h2>

          <p className="text-sm sm:text-base text-brand-muted max-w-xl mx-auto leading-relaxed">
            Join hundreds of families who have experienced the joy of responsible, foster-based pet adoption.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link to="/pets">
              <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-soft">
                Find Your Companion Today
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Explore How It Works
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
