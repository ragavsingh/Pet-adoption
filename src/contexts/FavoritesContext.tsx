import React, { createContext, useContext, useState, useEffect } from 'react';
import { favoriteService } from '../services/favoriteService';
import { Pet } from '../types/pet';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

interface FavoritesContextValue {
  favorites: string[];
  isFavorite: (petId: string) => boolean;
  toggleFavorite: (pet: Pet) => Promise<void>;
  favoriteCount: number;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, authMode, isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    let isMounted = true;

    // Strict privacy guarantee: unauthenticated visitors NEVER have favorites
    if (!isAuthenticated || !user) {
      setFavorites([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    favoriteService
      .getFavorites(user.id)
      .then((favs) => {
        if (isMounted) setFavorites(favs);
      })
      .catch((err) => {
        console.warn('[FavoritesContext] Error loading favorites:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id, isAuthenticated, authMode]);

  const isFavorite = (petId: string) => favorites.includes(petId);

  const toggleFavorite = async (pet: Pet) => {
    if (!isAuthenticated || !user) {
      showToast('Please sign in to save pets to your favorites ❤️', 'info');
      return;
    }

    const isCurrentlyFavorite = favorites.includes(pet.id);
    const updated = isCurrentlyFavorite
      ? favorites.filter((id) => id !== pet.id)
      : [...favorites, pet.id];

    // Optimistic UI update for instant feedback
    setFavorites(updated);

    if (!isCurrentlyFavorite) {
      showToast(`${pet.name} added to your favorites ❤️`, 'heart');
    } else {
      showToast(`${pet.name} removed from favorites`, 'info');
    }

    try {
      await favoriteService.toggleFavorite(pet.id, isCurrentlyFavorite, user.id);
    } catch (err: any) {
      // Rollback on network or RLS failure
      setFavorites(favorites);
      showToast(err.message || 'Failed to update favorite', 'error');
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        isFavorite,
        toggleFavorite,
        favoriteCount: favorites.length,
        isLoading,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
};
