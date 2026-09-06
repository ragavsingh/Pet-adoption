import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { petService } from '../../services/petService';
import { Pet } from '../../types/pet';
import { Button } from '../../components/common/Button';
import { useToast } from '../../contexts/ToastContext';
import { ArrowLeft, Save } from 'lucide-react';

export const EditPetPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [pet, setPet] = useState<Pet | null>(null);
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      petService.getPetById(id).then((p) => {
        if (p) {
          setPet(p);
          setName(p.name);
          setBreed(p.breed);
          setAge(p.age);
          setDescription(p.description);
        }
        setLoading(false);
      });
    }
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsSaving(true);
    try {
      await petService.updatePet(id, {
        name,
        breed,
        age,
        description,
      });

      showToast(`Updated details for ${name}.`, 'success');
      navigate('/provider/pets');
    } catch (err: any) {
      showToast(err.message || 'Failed to update pet listing. You may not own this listing.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="py-20 text-center text-xs font-bold text-brand-600 animate-pulse">Loading pet...</div>;
  if (!pet) return <div className="py-20 text-center">Pet not found</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-left">
      <Link
        to="/provider/pets"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-950"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Provider Pets</span>
      </Link>

      <div className="bg-surface rounded-3xl p-8 border border-brand-200/80 shadow-card space-y-6">
        <h2 className="font-display text-2xl font-bold text-brand-950">
          Edit Listing: {pet.name}
        </h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1">
              Pet Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-brand-200 text-sm font-semibold text-brand-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1">
                Breed
              </label>
              <input
                type="text"
                required
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-brand-200 text-sm font-semibold text-brand-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1">
                Age
              </label>
              <input
                type="text"
                required
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-brand-200 text-sm font-semibold text-brand-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-brand-200 text-xs font-medium text-brand-900 leading-relaxed"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Link to="/provider/pets">
              <Button type="button" variant="outline" size="sm">
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
