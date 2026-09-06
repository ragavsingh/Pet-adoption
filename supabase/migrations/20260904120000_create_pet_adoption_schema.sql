-- ==============================================================================
-- PET ADOPTION PLATFORM — POSTGRESQL DATABASE SCHEMA
-- Migration: 20260904120000_create_pet_adoption_schema.sql
-- Description: Production-ready relational schema for profiles, pets, requests,
--              trials, adoptions, notifications, reports, and verifications.
-- ==============================================================================

-- 0. EXTENSIONS & UTILITIES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 1. PROFILES (Linked to Supabase auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'adopter' CHECK (role IN ('adopter', 'provider', 'admin')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  profile_image_url TEXT,
  city TEXT,
  locality TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles (city);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 2. ADOPTER PROFILES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.adopter_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  occupation TEXT,
  housing_type TEXT CHECK (housing_type IS NULL OR housing_type IN ('Apartment', 'Independent House', 'Villa', 'Other', 'apartment', 'independent_house', 'villa', 'other')),
  work_type TEXT CHECK (work_type IS NULL OR work_type IN ('Remote', 'Hybrid', 'On-site', 'remote', 'hybrid', 'onsite')),
  time_away TEXT CHECK (time_away IS NULL OR time_away IN ('Under 4 hours', '4-8 hours', '8+ hours', 'under_4_hours', '4_to_8_hours', 'over_8_hours')),
  activity_level TEXT CHECK (activity_level IS NULL OR activity_level IN ('Active', 'Moderate', 'Relaxed', 'active', 'moderate', 'relaxed')),
  children TEXT CHECK (children IS NULL OR children IN ('None', 'Young children (< 6)', 'Older children (6+)', 'Teens', 'none', 'young', 'older', 'teens')),
  existing_pets TEXT CHECK (existing_pets IS NULL OR existing_pets IN ('None', 'Dogs', 'Cats', 'Dogs & Cats', 'Other', 'none', 'dogs', 'cats', 'both', 'other')),
  has_other_pets BOOLEAN NOT NULL DEFAULT false,
  other_pets_details TEXT,
  experience_with_pets TEXT CHECK (experience_with_pets IS NULL OR experience_with_pets IN ('First-time pet parent', 'Moderate experience', 'Lifelong pet owner', 'first_time', 'moderate', 'experienced')),
  household_members INTEGER DEFAULT 1 CHECK (household_members IS NULL OR household_members >= 1),
  preferred_pet_types TEXT[] DEFAULT '{}',
  preferred_size TEXT[] DEFAULT '{}',
  preferred_energy_level TEXT[] DEFAULT '{}',
  why_they_want_to_adopt TEXT,
  profile_completion INTEGER NOT NULL DEFAULT 0 CHECK (profile_completion BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_adopter_profiles_housing ON public.adopter_profiles (housing_type);
CREATE INDEX IF NOT EXISTS idx_adopter_profiles_exp ON public.adopter_profiles (experience_with_pets);

CREATE TRIGGER set_adopter_profiles_updated_at
  BEFORE UPDATE ON public.adopter_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 3. PROVIDER PROFILES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.provider_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_name TEXT,
  provider_type TEXT NOT NULL DEFAULT 'Individual Pet Owner' CHECK (provider_type IN (
    'Individual Pet Owner', 'Shelter', 'NGO', 'Rescue Organization', 'Foster Organization', 'Pet Welfare Organization',
    'individual_owner', 'shelter', 'ngo', 'rescue_org', 'foster_org', 'pet_welfare_org'
  )),
  description TEXT,
  city TEXT,
  locality TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_notes TEXT,
  profile_image_url TEXT,
  website_url TEXT,
  active_listings_count INTEGER NOT NULL DEFAULT 0 CHECK (active_listings_count >= 0),
  successful_adoptions_count INTEGER NOT NULL DEFAULT 0 CHECK (successful_adoptions_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_profiles_status ON public.provider_profiles (verification_status);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_type ON public.provider_profiles (provider_type);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_city ON public.provider_profiles (city);

CREATE TRIGGER set_provider_profiles_updated_at
  BEFORE UPDATE ON public.provider_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 4. PETS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT NOT NULL CHECK (species IN ('Dog', 'Cat', 'Bird', 'Rabbit', 'Other', 'dog', 'cat', 'bird', 'rabbit', 'other')),
  breed TEXT NOT NULL,
  breed_type TEXT DEFAULT 'Purebred',
  age TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female', 'Unknown', 'male', 'female', 'unknown')),
  size TEXT NOT NULL CHECK (size IN ('Small', 'Medium', 'Large', 'Extra Large', 'small', 'medium', 'large', 'extra_large')),
  city TEXT NOT NULL,
  locality TEXT,
  description TEXT NOT NULL,
  temperament TEXT[] DEFAULT '{}',
  personality TEXT[] DEFAULT '{}',
  energy_level TEXT NOT NULL DEFAULT 'Medium' CHECK (energy_level IN ('Low', 'Medium', 'High', 'Very High', 'low', 'medium', 'high', 'very_high')),
  good_with_children BOOLEAN NOT NULL DEFAULT false,
  good_with_dogs BOOLEAN NOT NULL DEFAULT false,
  good_with_cats BOOLEAN NOT NULL DEFAULT false,
  apartment_friendly BOOLEAN NOT NULL DEFAULT true,
  training_information TEXT,
  health_information TEXT,
  vaccination_status TEXT NOT NULL DEFAULT 'Fully Vaccinated' CHECK (vaccination_status IN ('Fully Vaccinated', 'Partially Vaccinated', 'Pending', 'up_to_date', 'not_vaccinated')),
  sterilization_status TEXT NOT NULL DEFAULT 'Sterilized' CHECK (sterilization_status IN ('Sterilized', 'Not Sterilized', 'true', 'false')),
  special_needs TEXT,
  adoption_status TEXT NOT NULL DEFAULT 'available' CHECK (adoption_status IN (
    'available', 'pending', 'trial', 'adopted', 'paused', 'archived',
    'Draft', 'Available', 'Adoption Requested', 'Adoption Pending', 'Adopted', 'Paused', 'Unavailable'
  )),
  stats JSONB DEFAULT '{"energy": 50, "friendliness": 50, "trainability": 50, "independence": 50}'::jsonb,
  provider_insight JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pets_provider_id ON public.pets (provider_id);
CREATE INDEX IF NOT EXISTS idx_pets_status ON public.pets (adoption_status);
CREATE INDEX IF NOT EXISTS idx_pets_species ON public.pets (species);
CREATE INDEX IF NOT EXISTS idx_pets_breed ON public.pets (breed);
CREATE INDEX IF NOT EXISTS idx_pets_city ON public.pets (city);
CREATE INDEX IF NOT EXISTS idx_pets_gender ON public.pets (gender);
CREATE INDEX IF NOT EXISTS idx_pets_size ON public.pets (size);
CREATE INDEX IF NOT EXISTS idx_pets_created_at ON public.pets (created_at DESC);

CREATE TRIGGER set_pets_updated_at
  BEFORE UPDATE ON public.pets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 5. PET IMAGES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.pet_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pet_images_pet_id ON public.pet_images (pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_images_primary ON public.pet_images (pet_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_pet_images_order ON public.pet_images (pet_id, display_order ASC);

-- ==============================================================================
-- 6. FAVORITES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adopter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_favorites_adopter_pet UNIQUE (adopter_id, pet_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_adopter_id ON public.favorites (adopter_id);
CREATE INDEX IF NOT EXISTS idx_favorites_pet_id ON public.favorites (pet_id);

-- ==============================================================================
-- 7. ADOPTION REQUESTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.adoption_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  adopter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'under_review', 'approved', 'rejected', 'more_information_required', 'withdrawn', 'cancelled', 'completed',
    'Pending', 'Under Review', 'Approved', 'Rejected', 'Cancelled', 'Completed'
  )),
  message TEXT NOT NULL,
  home_type TEXT,
  existing_pets TEXT,
  children TEXT,
  pet_experience TEXT,
  time_available TEXT,
  why_they_want_to_adopt TEXT,
  confirmed_accurate BOOLEAN NOT NULL DEFAULT true,
  provider_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  timeline JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_adoption_requests_pet_id ON public.adoption_requests (pet_id);
CREATE INDEX IF NOT EXISTS idx_adoption_requests_adopter_id ON public.adoption_requests (adopter_id);
CREATE INDEX IF NOT EXISTS idx_adoption_requests_provider_id ON public.adoption_requests (provider_id);
CREATE INDEX IF NOT EXISTS idx_adoption_requests_status ON public.adoption_requests (status);
CREATE INDEX IF NOT EXISTS idx_adoption_requests_created_at ON public.adoption_requests (created_at DESC);

-- Unique index ensuring no duplicate active requests for the same pet & adopter
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_adoption_request 
  ON public.adoption_requests (adopter_id, pet_id) 
  WHERE status IN ('pending', 'under_review', 'approved', 'more_information_required', 'Pending', 'Under Review', 'Approved');

CREATE TRIGGER set_adoption_requests_updated_at
  BEFORE UPDATE ON public.adoption_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 8. ADOPTIONS (Completed & Official Adoptions)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.adoptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE RESTRICT,
  adopter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  adoption_request_id UUID REFERENCES public.adoption_requests(id) ON DELETE SET NULL,
  adoption_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('trial', 'completed', 'returned', 'cancelled')),
  certificate_number TEXT UNIQUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_adoptions_pet_id ON public.adoptions (pet_id);
CREATE INDEX IF NOT EXISTS idx_adoptions_adopter_id ON public.adoptions (adopter_id);
CREATE INDEX IF NOT EXISTS idx_adoptions_provider_id ON public.adoptions (provider_id);
CREATE INDEX IF NOT EXISTS idx_adoptions_request_id ON public.adoptions (adoption_request_id);
CREATE INDEX IF NOT EXISTS idx_adoptions_date ON public.adoptions (adoption_date DESC);

CREATE TRIGGER set_adoptions_updated_at
  BEFORE UPDATE ON public.adoptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 9. FOSTER-TO-OWN / TRIAL PERIODS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.foster_trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE RESTRICT,
  adopter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  adoption_request_id UUID REFERENCES public.adoption_requests(id) ON DELETE SET NULL,
  adoption_id UUID REFERENCES public.adoptions(id) ON DELETE SET NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN (
    'upcoming', 'active', 'ending_soon', 'extension_requested', 'trial_extended', 'ready_for_official', 'expired', 'completed', 'cancelled',
    'Trial Starting', 'Trial Active', 'Ending Soon', 'Extension Requested', 'Trial Extended', 'Ready to Make Official', 'Trial Expired', 'Adoption Completed'
  )),
  journal_entries JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_foster_trials_valid_dates CHECK (end_date > start_date)
);

CREATE INDEX IF NOT EXISTS idx_foster_trials_pet_id ON public.foster_trials (pet_id);
CREATE INDEX IF NOT EXISTS idx_foster_trials_adopter_id ON public.foster_trials (adopter_id);
CREATE INDEX IF NOT EXISTS idx_foster_trials_provider_id ON public.foster_trials (provider_id);
CREATE INDEX IF NOT EXISTS idx_foster_trials_status ON public.foster_trials (status);
CREATE INDEX IF NOT EXISTS idx_foster_trials_dates ON public.foster_trials (start_date, end_date);

CREATE TRIGGER set_foster_trials_updated_at
  BEFORE UPDATE ON public.foster_trials
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 10. TRIAL EXTENSION REQUESTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.trial_extension_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_id UUID NOT NULL REFERENCES public.foster_trials(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_days INTEGER NOT NULL CHECK (requested_days IN (3, 7, 14)),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'declined', 'cancelled')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  provider_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trial_extension_trial_id ON public.trial_extension_requests (trial_id);
CREATE INDEX IF NOT EXISTS idx_trial_extension_status ON public.trial_extension_requests (status);
CREATE INDEX IF NOT EXISTS idx_trial_extension_requested_by ON public.trial_extension_requests (requested_by);

CREATE TRIGGER set_trial_extension_updated_at
  BEFORE UPDATE ON public.trial_extension_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 11. NOTIFICATIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'request_received', 'request_reviewing', 'request_approved', 'request_rejected',
    'more_info_requested', 'trial_started', 'trial_update', 'trial_extension_requested',
    'trial_extension_approved', 'trial_extension_rejected', 'adoption_completed',
    'provider_verified', 'report_created', 'system'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_entity_type TEXT,
  related_entity_id UUID,
  action_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications (created_at DESC);

-- ==============================================================================
-- 12. REPORTS (Moderation & Safety)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN (
    'Pet Listing', 'Provider', 'Adopter', 'Suspicious Activity', 'Inappropriate Content',
    'pet', 'provider', 'adopter', 'adoption_request', 'other'
  )),
  target_id TEXT NOT NULL,
  target_name TEXT,
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'reviewing', 'resolved', 'dismissed', 'Pending', 'Resolved', 'Dismissed'
  )),
  admin_notes TEXT,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports (reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_target ON public.reports (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports (created_at DESC);

CREATE TRIGGER set_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 13. PROVIDER VERIFICATIONS (Official Onboarding & Credential Review)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.provider_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  document_type TEXT,
  document_url TEXT,
  submitted_data JSONB DEFAULT '{}'::jsonb,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_verifications_provider_id ON public.provider_verifications (provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_verifications_status ON public.provider_verifications (status);

CREATE TRIGGER set_provider_verifications_updated_at
  BEFORE UPDATE ON public.provider_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 14. AUDIT LOGS (History & State Change Traceability)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  previous_state JSONB,
  new_state JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

-- ==============================================================================
-- 15. AUTOMATIC PROFILE INITIALIZATION TRIGGER (auth.users -> public.profiles)
-- ==============================================================================
-- Public signup allows ONLY 'adopter' or 'provider'.
-- If someone attempts to submit 'admin' via raw_user_meta_data, it defaults safely to 'adopter'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role TEXT;
  full_name_val TEXT;
BEGIN
  -- Restrict public signup to adopter or provider only
  assigned_role := COALESCE(NEW.raw_user_meta_data->>'role', 'adopter');
  IF assigned_role NOT IN ('adopter', 'provider') THEN
    assigned_role := 'adopter';
  END IF;

  full_name_val := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    'New User'
  );

  -- 1. Create base profile
  INSERT INTO public.profiles (
    id,
    role,
    full_name,
    email,
    phone,
    profile_image_url,
    city,
    locality
  ) VALUES (
    NEW.id,
    assigned_role,
    full_name_val,
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'locality'
  );

  -- 2. Create specialized profile role row
  IF assigned_role = 'adopter' THEN
    INSERT INTO public.adopter_profiles (id, profile_completion)
    VALUES (NEW.id, 20);
  ELSIF assigned_role = 'provider' THEN
    INSERT INTO public.provider_profiles (
      id,
      organization_name,
      provider_type,
      verification_status
    ) VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'organization_name',
      COALESCE(NEW.raw_user_meta_data->>'provider_type', 'Individual Pet Owner'),
      'pending'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger hook on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
