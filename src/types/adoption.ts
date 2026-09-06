export interface AdoptionRecord {
  id: string;
  petId: string;
  adopterId: string;
  providerId: string;
  adoptionRequestId?: string;
  adoptionDate: string;
  status: 'trial' | 'completed' | 'returned' | 'cancelled';
  certificateNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;

  // Joined presentation attributes
  petName?: string;
  petBreed?: string;
  petImage?: string;
  adopterName?: string;
  providerName?: string;
  providerLocation?: string;
}

export interface AdoptionCompletionResult {
  success: boolean;
  alreadyCompleted?: boolean;
  adoptionId: string;
  petId: string;
  certificateNumber: string;
  adoptionDate: string;
  status: string;
}
