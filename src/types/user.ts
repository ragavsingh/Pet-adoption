export type UserRole = 'adopter' | 'provider' | 'admin';

export interface AdopterProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  avatar: string;
  homeType: 'Apartment' | 'Independent House' | 'Villa';
  workType: 'Remote' | 'Hybrid' | 'On-site';
  timeAway: 'Under 4 hours' | '4-8 hours' | '8+ hours';
  activityLevel: 'Active' | 'Moderate' | 'Relaxed';
  children: 'None' | 'Young children (< 6)' | 'Older children (6+)' | 'Teens';
  existingPets: 'None' | 'Dogs' | 'Cats' | 'Dogs & Cats' | 'Other';
  petExperience: 'First-time pet parent' | 'Moderate experience' | 'Lifelong pet owner';
  preferredPetType: string;
  preferredSize: string;
  preferredAge: string;
  whyTheyWantToAdopt: string;
  profileCompletion: number; // e.g. 80
}

export interface ProviderProfile {
  id: string;
  name: string;
  organizationName?: string;
  email: string;
  phone: string;
  location: string;
  avatar: string;
  verified: boolean;
  about: string;
  activeListingsCount: number;
  successfulAdoptionsCount: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  adopterProfile?: AdopterProfile;
  providerProfile?: ProviderProfile;
}
