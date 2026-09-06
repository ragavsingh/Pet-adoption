export type AdoptionRequestStatus = 
  | 'Pending' 
  | 'Under Review' 
  | 'More Information Required'
  | 'Approved' 
  | 'Rejected' 
  | 'Cancelled' 
  | 'Completed';

export type TrialStatus =
  | 'Trial Starting'
  | 'Trial Active'
  | 'Ending Soon'
  | 'Extension Requested'
  | 'Trial Extended'
  | 'Ready to Make Official'
  | 'Trial Expired'
  | 'Adoption Completed';

export interface TrialExtensionRequest {
  id?: string;
  trialId?: string;
  requestedDays: 3 | 7 | 14;
  reason?: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'declined';
  reviewedBy?: string;
  reviewedAt?: string;
  providerResponse?: string;
}

export interface Trial {
  id?: string;
  petId?: string;
  adopterId?: string;
  providerId?: string;
  adoptionRequestId?: string;
  startDate: string; // ISO or YYYY-MM-DD
  endDate: string;   // ISO or YYYY-MM-DD
  totalDays: number;
  currentDay?: number;
  extensionRequested?: boolean;
  officialAdoptionRequested?: boolean;
  status?: TrialStatus;
  notes?: string[];
  extension?: TrialExtensionRequest;
}

export interface TimelineEvent {
  step: number;
  status: AdoptionRequestStatus | 'Adoption Completed';
  title: string;
  date: string;
  description: string;
  completed: boolean;
  current: boolean;
}

export interface AdoptionCertificateSummary {
  id?: string;
  certificateNumber?: string;
  adoptionDate?: string;
  status?: string;
  notes?: string;
}

export interface AdoptionRequest {
  id: string;
  petId: string;
  petName: string;
  petBreed: string;
  petImage: string;
  providerId: string;
  providerName: string;
  providerLocation: string;
  adopterId: string;
  adopterName: string;
  adopterEmail: string;
  adopterPhone: string;
  adopterLocation: string;
  adopterAvatar: string;
  message: string;
  homeType: string;
  existingPets: string;
  children: string;
  petExperience: string;
  timeAvailable: string;
  whyTheyWantToAdopt: string;
  confirmedAccurate: boolean;
  status: AdoptionRequestStatus;
  createdAt: string;
  updatedAt: string;
  reviewNotes?: string;
  trial?: Trial;
  timeline: TimelineEvent[];
  verification?: AdoptionVerification;
  adoption?: AdoptionCertificateSummary;
}

export interface VerificationCheckItem {
  id: string;
  label: string;
  checked: boolean;
  description?: string;
}

export interface VerificationStep {
  id: string;
  level: number; // 1, 2, 3, 4
  title: string;
  subtitle: string;
  description: string;
  completed: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  checks: VerificationCheckItem[];
}

export interface AdoptionVerification {
  level: number; // 1 to 4
  percentage: number; // 0, 25, 50, 75, 100
  statusTitle: string;
  steps: VerificationStep[];
  adminNotes?: string;
  lastUpdated?: string;
}

export function getDefaultVerification(
  req?: Partial<AdoptionRequest>
): AdoptionVerification {
  const isApproved = req?.status === 'Approved' || req?.status === 'Completed';
  const isUnderReview = req?.status === 'Under Review' || req?.status === 'More Information Required';

  const step1Checks: VerificationCheckItem[] = [
    { id: 'c1_1', label: 'Identity & Contact Information Validated', checked: true, description: `${req?.adopterName || 'Adopter'} (${req?.adopterEmail || 'Verified Email'})` },
    { id: 'c1_2', label: 'Adoption Questionnaire & Motivation Complete', checked: true, description: req?.whyTheyWantToAdopt || 'Applicant statement reviewed' },
    { id: 'c1_3', label: 'Declaration of Accuracy & Terms Acknowledged', checked: Boolean(req?.confirmedAccurate ?? true) },
  ];

  const step2Checks: VerificationCheckItem[] = [
    { id: 'c2_1', label: `Housing Suitability Confirmed (${req?.homeType || 'Apartment / House'})`, checked: isApproved || isUnderReview, description: 'Living space meets companionship requirements' },
    { id: 'c2_2', label: 'Landlord / Household Permission Verified', checked: isApproved || isUnderReview, description: 'No restrictions on pet custody' },
    { id: 'c2_3', label: 'Space & Safety Standards Checked', checked: isApproved, description: 'Safe indoor and outdoor environment' },
  ];

  const step3Checks: VerificationCheckItem[] = [
    { id: 'c3_1', label: `Household Dynamics Checked (Children: ${req?.children || 'None'}, Other Pets: ${req?.existingPets || 'None'})`, checked: isApproved, description: 'Compatibility with existing family members' },
    { id: 'c3_2', label: `Daily Time & Care Commitment (${req?.timeAvailable || 'Home daily'})`, checked: isApproved, description: 'Adequate daily exercise and companionship' },
    { id: 'c3_3', label: `Pet Care Experience Evaluated (${req?.petExperience || 'Experienced'})`, checked: isApproved, description: 'Familiarity with breed temperament and nutrition' },
  ];

  const step4Checks: VerificationCheckItem[] = [
    { id: 'c4_1', label: 'Provider & Platform Admin Consensus Reached', checked: isApproved, description: 'Application approved for official handover' },
    { id: 'c4_2', label: 'Foster-to-Own Bonding Agreement Signed', checked: isApproved, description: '14-Day trial protection terms active' },
    { id: 'c4_3', label: 'Pet Handover & Trial Activation Scheduled', checked: isApproved, description: 'Trial countdown and welfare tracking active' },
  ];

  let level = 1;
  let percentage = 25;
  let statusTitle = 'Level 1: Applicant Screening & Details Verified';

  if (isApproved) {
    level = 4;
    percentage = 100;
    statusTitle = 'Level 4: Fully Approved & Foster-to-Own Trial Active';
  } else if (isUnderReview) {
    level = 2;
    percentage = 50;
    statusTitle = 'Level 2: Housing & Living Environment Cleared';
  }

  return {
    level,
    percentage,
    statusTitle,
    lastUpdated: req?.updatedAt || new Date().toISOString(),
    steps: [
      {
        id: 'step_1',
        level: 1,
        title: 'Level 1: Applicant Details & Screening',
        subtitle: 'Applicant verification and eligibility screening',
        description: 'Verify applicant identity, phone, address, and adoption questionnaire.',
        completed: true,
        checks: step1Checks,
      },
      {
        id: 'step_2',
        level: 2,
        title: 'Level 2: Housing & Living Environment',
        subtitle: 'Home suitability and safety check',
        description: 'Review home type, space, landlord authorization, and exercise area.',
        completed: isApproved || isUnderReview,
        checks: step2Checks,
      },
      {
        id: 'step_3',
        level: 3,
        title: 'Level 3: Care Readiness & Compatibility',
        subtitle: 'Lifestyle and household dynamic match',
        description: 'Evaluate family members, existing pets, daily routine, and breed experience.',
        completed: isApproved,
        checks: step3Checks,
      },
      {
        id: 'step_4',
        level: 4,
        title: 'Level 4: Platform Approval & Trial Kickoff',
        subtitle: 'Final authorization and Foster-to-Own trial',
        description: 'Finalize adoption agreement, initiate 14-day bonding trial, and coordinate handover.',
        completed: isApproved,
        checks: step4Checks,
      },
    ],
  };
}
