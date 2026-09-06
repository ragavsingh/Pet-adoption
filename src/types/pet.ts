export type PetSpecies = 'Dog' | 'Cat' | 'Other';
export type PetGender = 'Male' | 'Female';
export type PetSize = 'Small' | 'Medium' | 'Large';
export type VaccinationStatus = 'Fully Vaccinated' | 'Partially Vaccinated' | 'Pending';
export type SterilizationStatus = 'Sterilized' | 'Not Sterilized';

export type PetStatus = 
  | 'Draft' 
  | 'Available' 
  | 'Adoption Requested' 
  | 'Adoption Pending' 
  | 'Adopted' 
  | 'Paused' 
  | 'Unavailable';

export interface ProviderInsight {
  personality: string;
  habits: string;
  likes: string;
  dislikes: string;
  behavior: string;
  specialCare: string;
  dailyRoutine: string;
}

export interface PetStats {
  energy: number;          // 0-100
  friendliness: number;    // 0-100
  trainability: number;    // 0-100
  independence: number;    // 0-100
}

export interface Pet {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string;
  age: string;
  gender: PetGender;
  size: PetSize;
  location: string;
  images: string[];
  personalityTags: string[];
  stats: PetStats;
  goodWithChildren: boolean;
  goodWithDogs: boolean;
  goodWithCats: boolean;
  apartmentFriendly: boolean;
  vaccination: VaccinationStatus;
  sterilization: SterilizationStatus;
  healthInfo: string;
  specialNeeds?: string;
  description: string;
  providerInsight: ProviderInsight;
  provider: {
    id: string;
    name: string;
    title: string;
    location: string;
    verified: boolean;
    avatar: string;
    about: string;
    phone?: string;
  };
  status: PetStatus;
  createdAt: string;
  adoptionDate?: string;
}
