import React from 'react';
import { PetFilterOptions } from '../../services/petService';
import { X, RotateCcw, Check } from 'lucide-react';
import { Button } from '../common/Button';

interface PetFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: PetFilterOptions;
  onChange: (newFilters: PetFilterOptions) => void;
  resultCount: number;
}

export const PetFilterDrawer: React.FC<PetFilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onChange,
  resultCount,
}) => {
  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden no-scrollbar-mobile" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="relative w-full max-h-[85vh] bg-surface rounded-t-3xl shadow-soft-lg border-t border-brand-200 p-6 overflow-y-auto no-scrollbar-mobile animate-slide-down">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-brand-100 mb-4">
          <div>
            <h3 className="font-display text-lg font-bold text-brand-900">
              Filters & Preferences
            </h3>
            <p className="text-xs text-brand-muted">
              {resultCount} pets match your criteria
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-5 text-left">
          {/* Species */}
          <div>
            <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-2">
              Species
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['All', 'Dog', 'Cat'].map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => handleSelectChange('species', sp)}
                  className={`py-2 px-3 rounded-full text-xs font-bold transition-all border ${
                    (filters.species || 'All') === sp
                      ? 'bg-brand-700 text-white border-brand-700'
                      : 'bg-surface text-brand-800 border-brand-200'
                  }`}
                >
                  {sp === 'All' ? 'All Species' : `${sp}s`}
                </button>
              ))}
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-2">
              Gender
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['All', 'Male', 'Female'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleSelectChange('gender', g)}
                  className={`py-2 px-3 rounded-full text-xs font-bold transition-all border ${
                    (filters.gender || 'All') === g
                      ? 'bg-brand-700 text-white border-brand-700'
                      : 'bg-surface text-brand-800 border-brand-200'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-2">
              Size
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'All Sizes', value: 'All' },
                { label: 'Small (<10kg)', value: 'Small' },
                { label: 'Medium (10-25kg)', value: 'Medium' },
                { label: 'Large (>25kg)', value: 'Large' },
              ].map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => handleSelectChange('size', s.value)}
                  className={`py-2 px-3 rounded-full text-xs font-bold transition-all border ${
                    (filters.size || 'All') === s.value
                      ? 'bg-brand-700 text-white border-brand-700'
                      : 'bg-surface text-brand-800 border-brand-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-2">
              City / Location
            </label>
            <select
              value={filters.location || 'All'}
              onChange={(e) => handleSelectChange('location', e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-brand-200 bg-surface text-sm font-semibold text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="All">All Locations</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Pune">Pune</option>
            </select>
          </div>

          {/* Adoption Status */}
          <div>
            <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-2">
              Adoption Availability
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: '🟢 Ready to Adopt', value: 'Available' },
                { label: 'All Companions', value: 'All' },
                { label: '⏳ In Foster Trial', value: 'Adoption Pending' },
                { label: '❤️ Already Adopted', value: 'Adopted' },
              ].map((st) => (
                <button
                  key={st.value}
                  type="button"
                  onClick={() => handleSelectChange('status', st.value)}
                  className={`py-2 px-3 rounded-full text-xs font-bold transition-all border text-center ${
                    (filters.status || 'Available') === st.value
                      ? 'bg-brand-700 text-white border-brand-700'
                      : 'bg-surface text-brand-800 border-brand-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Compatibility Flags */}
          <div>
            <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-2">
              Lifestyle & Compatibility
            </label>
            <div className="space-y-2">
              {[
                { key: 'apartmentFriendly', label: 'Apartment Friendly' },
                { key: 'goodWithChildren', label: 'Good with Children' },
                { key: 'goodWithDogs', label: 'Good with other Dogs' },
                { key: 'goodWithCats', label: 'Good with Cats' },
              ].map((item) => {
                const isChecked = !!filters[item.key as keyof PetFilterOptions];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleToggle(item.key as keyof PetFilterOptions)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border text-xs font-bold transition-all ${
                      isChecked
                        ? 'bg-brand-100/90 text-brand-900 border-brand-300'
                        : 'bg-surface text-brand-700 border-brand-200'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                        isChecked
                          ? 'bg-brand-700 border-brand-700 text-white'
                          : 'border-brand-300 bg-surface'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="pt-6 border-t border-brand-100 flex items-center gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleReset}
            className="flex-1"
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Reset
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onClose}
            className="flex-1"
          >
            View {resultCount} Pets
          </Button>
        </div>
      </div>
    </div>
  );
};
