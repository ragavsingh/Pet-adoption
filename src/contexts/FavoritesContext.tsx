import React, { createContext, useContext, useState, useEffect } from 'react';
import { favoriteService } from '../services/favoriteService';
import { Pet } from '../types/pet';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { realtimeSync } from '../services/realtimeSync';
import { toPetDatabaseUUID } from '../utils/petIdMapper';

interface FavoritesContextValue {
  favorites: string[];
  isFavorite: (petId: string) => boolean;
  toggleFavorite: (pet: Pet) => Promise<void>;
  removeFavorite: (petId: string) => Promise<void>;
  refreshFavorites: () => Promise<void>;
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

    // Realtime subscription: automatically drop favorite when application is approved, trial starts, or pet is adopted
    const unsubscribe = realtimeSync.subscribe((event) => {
      if (!isMounted || !user) return;
      if (
        event.type === 'favorite_removed' ||
        event.type === 'adoption_request_updated' ||
        event.type === 'foster_trial_updated' ||
        event.type === 'pet_updated' ||
        event.type === 'pet_status_updated'
      ) {
        if (event.type === 'favorite_removed' && event.payload?.petId) {
          const removedId = event.payload.petId;
          const removedUUID = toPetDatabaseUUID(removedId);
          setFavorites((prev) => prev.filter((id) => id !== removedId && id !== removedUUID));
        } else {
          favoriteService
            .getFavorites(user.id)
            .then((fresh) => {
              if (isMounted) setFavorites(fresh);
            })
            .catch(() => {});
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [user?.id, isAuthenticated, authMode]);

  const isFavorite = (petId: string) => {
    if (!petId) return false;
    const targetUUID = toPetDatabaseUUID(petId);
    return favorites.includes(petId) || favorites.includes(targetUUID);
  };

  const removeFavorite = async (petId: string) => {
    if (!user) return;
    const targetUUID = toPetDatabaseUUID(petId);
    setFavorites((prev) => prev.filter((id) => id !== petId && id !== targetUUID));
    try {
      await favoriteService.removeFavorite(petId, user.id);
    } catch (err) {
      console.warn('[FavoritesContext] Error removing favorite:', err);
    }
  };

  const refreshFavorites = async () => {
    if (!user) return;
    try {
      const fresh = await favoriteService.getFavorites(user.id);
      setFavorites(fresh);
    } catch (err) {
      console.warn('[FavoritesContext] Error refreshing favorites:', err);
    }
  };

  const toggleFavorite = async (pet: Pet) => {
    if (!isAuthenticated || !user) {
      showToast('Please sign in to save pets to your favorites ❤️', 'info');
      return;
    }

    const isCurrentlyFavorite = isFavorite(pet.id);

    // Prevent saving if the pet is already in an active trial or adopted by this user
    if (!isCurrentlyFavorite && favoriteService.isPetInTrialOrAdopted(pet.id, user.id)) {
      showToast(`${pet.name} is already in your active trial / adoption journey! ❤️`, 'info');
      return;
    }

    const targetUUID = toPetDatabaseUUID(pet.id);
    const updated = isCurrentlyFavorite
      ? favorites.filter((id) => id !== pet.id && id !== targetUUID)
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
        removeFavorite,
        refreshFavorites,
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
