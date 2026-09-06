import React, { useState, useEffect } from 'react';
import { Pet } from '../../types/pet';
import { petService, PetFilterOptions } from '../../services/petService';
import { PetCard } from '../../components/common/PetCard';
import { PetFilterBar } from '../../components/discovery/PetFilterBar';
import { PetFilterDrawer } from '../../components/discovery/PetFilterDrawer';
import { Button } from '../../components/common/Button';
import { SearchX, RotateCcw, Sparkles } from 'lucide-react';
import { realtimeSync } from '../../services/realtimeSync';

export const PetsPage: React.FC = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [filters, setFilters] = useState<PetFilterOptions>({
    search: '',
    species: 'All',
    gender: 'All',
    size: 'All',
    location: 'All',
    goodWithChildren: false,
    goodWithDogs: false,
    goodWithCats: false,
    apartmentFriendly: false,
    status: 'Available', // Section 9: Only pets marked Available appear in normal discovery
    sortBy: 'newest',
  });

  const loadPets = async () => {
    setLoading(true);
    try {
      const result = await petService.getAllPets(filters);
      setPets(result);
    } catch (err) {
      console.warn('[PetsPage] Error loading pets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPets();

    const unsubscribe = realtimeSync.subscribe((event) => {
      if (
        event.type === 'adoption_request_updated' ||
        event.type === 'adoption_request_created' ||
        event.type === 'foster_trial_updated' ||
        event.type === 'pet_updated' ||
        event.type === 'pet_status_updated' ||
        event.type === 'all'
      ) {
        loadPets();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [filters]);

  const handleResetFilters = () => {
    setFilters({
      search: '',
      species: 'All',
      gender: 'All',
      size: 'All',
      location: 'All',
      goodWithChildren: false,
      goodWithDogs: false,
      goodWithCats: false,
      apartmentFriendly: false,
      status: 'Available',
      sortBy: 'newest',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-left space-y-2">
        <span className="text-xs font-bold text-brand-600 uppercase tracking-widest bg-brand-100 px-3.5 py-1 rounded-full">
          Ethical Pet Discovery
        </span>
        <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-brand-950 tracking-tight">
          Find Your Companion
        </h1>
        <p className="text-sm sm:text-base text-brand-muted max-w-2xl leading-relaxed">
          Search verified dogs and cats ready for Foster-to-Own bonding and loving forever homes.
        </p>
      </div>

      {/* Desktop Filter Bar */}
      <PetFilterBar
        filters={filters}
        onChange={setFilters}
        onOpenMobileDrawer={() => setDrawerOpen(true)}
        resultCount={pets.length}
      />

      {/* Mobile Filter Drawer */}
      <PetFilterDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        onChange={setFilters}
        resultCount={pets.length}
      />

      {/* Pet Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-surface rounded-3xl border border-brand-200/80 p-5 space-y-4 animate-pulse"
            >
              <div className="aspect-[4/3] bg-brand-100 rounded-2xl w-full" />
              <div className="h-5 bg-brand-100 rounded w-2/3" />
              <div className="h-3 bg-brand-100 rounded w-1/3" />
              <div className="h-8 bg-brand-100 rounded-full w-full" />
            </div>
          ))}
        </div>
      ) : pets.length === 0 ? (
        /* Empty State */
        <div className="bg-surface rounded-3xl border border-brand-200 p-12 text-center max-w-lg mx-auto space-y-5">
          <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center mx-auto shadow-sm">
            <SearchX className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-xl font-bold text-brand-900">
              No pets found matching your filters
            </h3>
            <p className="text-xs text-brand-muted max-w-sm mx-auto leading-relaxed">
              Try adjusting your search criteria, clearing compatibility filters, or browsing other locations.
            </p>
          </div>
          <Button
            variant="secondary"
            size="md"
            onClick={handleResetFilters}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Clear All Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pets.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      )}
    </div>
  );
};
