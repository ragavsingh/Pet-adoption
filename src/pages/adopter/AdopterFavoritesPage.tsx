import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useAuth } from '../../contexts/AuthContext';
import { favoriteService } from '../../services/favoriteService';
import { Pet } from '../../types/pet';
import { PetCard } from '../../components/common/PetCard';
import { Button } from '../../components/common/Button';
import { Heart, Compass, Sparkles } from 'lucide-react';

export const AdopterFavoritesPage: React.FC = () => {
  const { favorites, favoriteCount } = useFavorites();
  const { user } = useAuth();
  const [savedPets, setSavedPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    favoriteService
      .getFavoritePets(user?.id)
      .then((pets) => {
        if (isMounted) setSavedPets(pets);
      })
      .catch((err) => {
        console.warn('[AdopterFavoritesPage] Error loading favorite pets:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [favorites, user?.id]);

  return (
    <div className="space-y-8 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-widest bg-brand-100 px-3.5 py-1 rounded-full">
            Saved Pets
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-brand-950 mt-2">
            My Favorite Companions
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted mt-1">
            Keep track of pets you feel connected with and prepare to apply.
          </p>
        </div>

        {favoriteCount > 0 && (
          <span className="text-xs font-bold text-brand-700 bg-brand-100 px-3 py-1.5 rounded-full border border-brand-200 self-start sm:self-auto">
            {favoriteCount} pet{favoriteCount > 1 ? 's' : ''} saved
          </span>
        )}
      </div>

      {/* Grid or Empty State (Section 15) */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="aspect-[4/3] bg-brand-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : savedPets.length === 0 ? (
        <div className="bg-surface rounded-3xl border border-brand-200 p-12 sm:p-16 text-center max-w-lg mx-auto space-y-5">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
            <Heart className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="font-display text-2xl font-bold text-brand-950">
              No saved pets yet
            </h3>
            <p className="text-xs text-brand-muted max-w-sm mx-auto leading-relaxed">
              Explore dogs and cats looking for loving forever homes and click the heart icon to save them here.
            </p>
          </div>

          <div className="pt-2">
            <Link to="/pets">
              <Button
                variant="primary"
                size="md"
                leftIcon={<Compass className="w-4 h-4" />}
                className="shadow-soft"
              >
                Discover Pets
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedPets.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      )}
    </div>
  );
};
