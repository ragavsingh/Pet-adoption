import React from 'react';
import { Link } from 'react-router-dom';
import { Pet } from '../../types/pet';
import { useFavorites } from '../../contexts/FavoritesContext';
import { StatusBadge } from './StatusBadge';
import { Heart, MapPin, Sparkles, ArrowRight } from 'lucide-react';

interface PetCardProps {
  pet: Pet;
  className?: string;
}

export const PetCard: React.FC<PetCardProps> = ({ pet, className = '' }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(pet.id);

  const primaryImage = pet.images[0] || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800';

  return (
    <div
      className={`group relative bg-surface rounded-3xl border border-brand-200/80 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1.5 flex flex-col overflow-hidden ${className}`}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-brand-100">
        <Link
          to={`/pets/${pet.id}`}
          className="block w-full h-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          aria-label={`View details for ${pet.name}`}
        >
          <img
            src={primaryImage}
            alt={`${pet.name}, a ${pet.age} old ${pet.breed}`}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
            onError={(e) => {
              const target = e.currentTarget;
              if (pet.species === 'Cat') {
                target.src = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800';
              } else {
                target.src = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800';
              }
            }}
          />

          {/* Gradient overlay on bottom of image */}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-950/40 via-transparent to-transparent opacity-80 pointer-events-none" />
        </Link>

        {/* Status Badge */}
        <div className="absolute top-3.5 left-3.5 z-10 pointer-events-none">
          <StatusBadge status={pet.status} size="sm" />
        </div>

        {/* Favorite Heart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(pet);
          }}
          className={`absolute top-3.5 right-3.5 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm backdrop-blur-md ${
            favorite
              ? 'bg-white text-rose-600 scale-110 shadow-md'
              : 'bg-white/80 hover:bg-white text-brand-800 hover:text-rose-600'
          }`}
          aria-label={favorite ? `Remove ${pet.name} from saved favorites` : `Save ${pet.name} to favorites`}
        >
          <Heart
            className={`w-5 h-5 transition-transform duration-200 ${
              favorite ? 'fill-rose-600 scale-110 animate-heart-pulse' : 'hover:scale-110'
            }`}
          />
        </button>

        {/* Location pill on image */}
        <div className="absolute bottom-3 left-3.5 z-10 flex items-center gap-1.5 text-xs text-white font-medium drop-shadow pointer-events-none">
          <MapPin className="w-3.5 h-3.5 text-brand-300 shrink-0" />
          <span>{pet.location}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Pet Name & Gender / Age */}
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <h3 className="font-display text-xl font-bold text-brand-900 group-hover:text-brand-700 transition-colors">
              {pet.name}
            </h3>
            <span className="text-xs font-semibold text-brand-600/90 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200/60">
              {pet.gender} • {pet.age}
            </span>
          </div>

          {/* Breed */}
          <p className="text-xs font-medium text-brand-muted uppercase tracking-wider mb-3">
            {pet.breed}
          </p>

          {/* Personality Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {pet.personalityTags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-medium text-brand-800 bg-brand-100/70 border border-brand-200/60 px-2.5 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
            {pet.personalityTags.length > 3 && (
              <span className="text-[11px] font-medium text-brand-500 bg-brand-50 px-1.5 py-0.5 rounded-full">
                +{pet.personalityTags.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Card Footer with Provider Info and CTA */}
        <div className="pt-3 border-t border-brand-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={pet.provider.avatar}
              alt={pet.provider.name}
              className="w-6 h-6 rounded-full object-cover border border-brand-200 shrink-0"
            />
            <span className="text-xs text-brand-muted truncate font-medium">
              {pet.provider.name}
            </span>
          </div>

          <Link
            to={`/pets/${pet.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-900 hover:gap-1.5 transition-all shrink-0 py-1"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
