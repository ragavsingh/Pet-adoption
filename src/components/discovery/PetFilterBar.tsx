import React from 'react';
import { PetFilterOptions } from '../../services/petService';
import { Search, SlidersHorizontal, RotateCcw, Check } from 'lucide-react';

interface PetFilterBarProps {
  filters: PetFilterOptions;
  onChange: (newFilters: PetFilterOptions) => void;
  onOpenMobileDrawer: () => void;
  resultCount: number;
}

export const PetFilterBar: React.FC<PetFilterBarProps> = ({
  filters,
  onChange,
  onOpenMobileDrawer,
  resultCount,
}) => {
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: e.target.value });
  };

  const handleSelectChange = (key: keyof PetFilterOptions, val: string) => {
    onChange({ ...filters, [key]: val });
  };

  const handleToggle = (key: keyof PetFilterOptions) => {
    onChange({ ...filters, [key]: !filters[key] });
  };

  const handleReset = () => {
    onChange({
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

  const activeFilterCount = [
    filters.species && filters.species !== 'All',
    filters.gender && filters.gender !== 'All',
    filters.size && filters.size !== 'All',
    filters.location && filters.location !== 'All',
    filters.goodWithChildren,
    filters.goodWithDogs,
    filters.goodWithCats,
    filters.apartmentFriendly,
  ].filter(Boolean).length;

  return (
    <div className="bg-surface rounded-3xl border border-brand-200/80 shadow-card p-4 sm:p-6 mb-8 transition-all">
      {/* Search and Quick Filters Row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400 pointer-events-none" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={handleTextChange}
            placeholder="Search by pet name, breed or location..."
            className="w-full pl-12 pr-4 py-3 rounded-full border border-brand-200 bg-surface-soft/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm text-brand-950 font-medium placeholder:text-brand-muted transition-all"
          />
        </div>

        {/* Action buttons on right */}
        <div className="flex items-center gap-2">
          {/* Mobile Filter Drawer Trigger */}
          <button
            type="button"
            onClick={onOpenMobileDrawer}
            className="lg:hidden flex items-center gap-2 px-4 py-3 rounded-full bg-brand-100 text-brand-900 text-xs font-bold border border-brand-200 shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4 text-brand-700" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-brand-700 text-white text-[10px] flex items-center justify-center font-extrabold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="hidden sm:inline text-xs font-bold text-brand-600 uppercase tracking-wider">
              Sort:
            </span>
            <select
              value={filters.sortBy || 'newest'}
              onChange={(e) => handleSelectChange('sortBy', e.target.value)}
              className="px-3.5 py-2.5 rounded-full border border-brand-200 bg-surface text-xs font-bold text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="newest">Recently Added</option>
              <option value="name">Pet Name (A-Z)</option>
            </select>
          </div>

          {/* Reset Filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-900 px-3 py-2 rounded-full hover:bg-brand-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Desktop Filter Row */}
      <div className="hidden lg:flex items-center justify-between gap-4 pt-5 mt-4 border-t border-brand-100 flex-wrap">
        {/* Dropdown filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Species */}
          <select
            value={filters.species || 'All'}
            onChange={(e) => handleSelectChange('species', e.target.value)}
            className="px-3.5 py-2 rounded-full border border-brand-200 bg-surface-soft text-xs font-bold text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="All">All Species</option>
            <option value="Dog">Dogs</option>
            <option value="Cat">Cats</option>
          </select>

          {/* Gender */}
          <select
            value={filters.gender || 'All'}
            onChange={(e) => handleSelectChange('gender', e.target.value)}
            className="px-3.5 py-2 rounded-full border border-brand-200 bg-surface-soft text-xs font-bold text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="All">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          {/* Size */}
          <select
            value={filters.size || 'All'}
            onChange={(e) => handleSelectChange('size', e.target.value)}
            className="px-3.5 py-2 rounded-full border border-brand-200 bg-surface-soft text-xs font-bold text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="All">All Sizes</option>
            <option value="Small">Small (&lt;10kg)</option>
            <option value="Medium">Medium (10-25kg)</option>
            <option value="Large">Large (&gt;25kg)</option>
          </select>

          {/* Location */}
          <select
            value={filters.location || 'All'}
            onChange={(e) => handleSelectChange('location', e.target.value)}
            className="px-3.5 py-2 rounded-full border border-brand-200 bg-surface-soft text-xs font-bold text-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="All">All Locations</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Delhi">Delhi</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Pune">Pune</option>
          </select>

          {/* Status */}
          <select
            value={filters.status || 'Available'}
            onChange={(e) => handleSelectChange('status', e.target.value)}
            className="px-3.5 py-2 rounded-full border border-brand-300 bg-brand-50 text-xs font-bold text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="Available">🟢 Ready for Adoption</option>
            <option value="All">All Companions</option>
            <option value="Adoption Pending">⏳ In Foster Trial</option>
            <option value="Adopted">❤️ Already Adopted</option>
          </select>
        </div>

        {/* Compatibility Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleToggle('apartmentFriendly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              filters.apartmentFriendly
                ? 'bg-brand-700 text-white border-brand-700'
                : 'bg-surface text-brand-800 border-brand-200 hover:border-brand-300'
            }`}
          >
            {filters.apartmentFriendly && <Check className="w-3 h-3" />}
            Apartment Friendly
          </button>

          <button
            type="button"
            onClick={() => handleToggle('goodWithChildren')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              filters.goodWithChildren
                ? 'bg-brand-700 text-white border-brand-700'
                : 'bg-surface text-brand-800 border-brand-200 hover:border-brand-300'
            }`}
          >
            {filters.goodWithChildren && <Check className="w-3 h-3" />}
            Good with Children
          </button>

          <button
            type="button"
            onClick={() => handleToggle('goodWithDogs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              filters.goodWithDogs
                ? 'bg-brand-700 text-white border-brand-700'
                : 'bg-surface text-brand-800 border-brand-200 hover:border-brand-300'
            }`}
          >
            {filters.goodWithDogs && <Check className="w-3 h-3" />}
            Good with Dogs
          </button>

          <button
            type="button"
            onClick={() => handleToggle('goodWithCats')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              filters.goodWithCats
                ? 'bg-brand-700 text-white border-brand-700'
                : 'bg-surface text-brand-800 border-brand-200 hover:border-brand-300'
            }`}
          >
            {filters.goodWithCats && <Check className="w-3 h-3" />}
            Good with Cats
          </button>
        </div>
      </div>

      {/* Results Count Line */}
      <div className="pt-3 mt-3 flex items-center justify-between text-xs text-brand-muted border-t border-brand-100/60">
        <span>
          Showing <strong className="text-brand-900 font-bold">{resultCount}</strong> companions available for adoption
        </span>
        {activeFilterCount > 0 && (
          <span className="text-brand-600 font-medium">
            {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
          </span>
        )}
      </div>
    </div>
  );
};
