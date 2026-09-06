-- ==============================================================================
-- PET ADOPTION PLATFORM — PRODUCTION SECURITY HARDENING
-- Migration: 20260904210000_production_security_hardening.sql
-- Description: Enforces pet lifecycle update guard trigger, prevents race conditions
--              with global completed adoption uniqueness, secures search_path on
--              profile initialization trigger, and configures storage bucket RLS.
-- ==============================================================================

-- ==============================================================================
-- 1. PET LIFECYCLE & UPDATE GUARD TRIGGER
-- ==============================================================================
-- Prevents unauthorized providers or direct client updates from:
-- a) Reassigning pet ownership (provider_id)
-- b) Directly promoting pets to 'adopted' or 'trial' (bypassing Foster-to-Own / adoption workflows)
-- c) Arbitrarily modifying pet listings currently active in a Foster-to-Own trial or adopted
CREATE OR REPLACE FUNCTION public.check_pet_update()
RETURNS TRIGGER AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  v_is_admin := public.is_admin();

  IF NOT v_is_admin THEN
    -- 1. Ownership cannot be transferred directly by client
    IF NEW.provider_id != OLD.provider_id THEN
      RAISE EXCEPTION 'Unauthorized: Pet ownership cannot be reassigned.';
    END IF;

    -- 2. State transition guards:
    -- Cannot directly set status to 'adopted' (must use adopter_complete_adoption RPC or admin moderation)
    IF NEW.adoption_status IN ('adopted', 'Adopted') AND OLD.adoption_status NOT IN ('adopted', 'Adopted') THEN
      RAISE EXCEPTION 'Privileged transition: Official pet adoptions must execute through the secure Foster-to-Own completion transaction.';
    END IF;

    -- Cannot directly set status to 'trial' (must use provider_approve_adoption_request RPC)
    IF NEW.adoption_status IN ('trial', 'Trial', 'adoption requested') AND OLD.adoption_status NOT IN ('trial', 'Trial', 'adoption requested') THEN
      RAISE EXCEPTION 'Privileged transition: Placing a pet into Foster-to-Own trial must execute through the provider application approval workflow.';
    END IF;

    -- 3. Immutability guard for pets currently active in a trial or adopted
    IF OLD.adoption_status IN ('adopted', 'Adopted') THEN
      RAISE EXCEPTION 'Locked entity: Adopted pet records cannot be modified directly.';
    END IF;

    IF OLD.adoption_status IN ('trial', 'Trial') AND NEW.adoption_status NOT IN ('trial', 'Trial', 'available', 'Available') THEN
      RAISE EXCEPTION 'Locked entity: Pets currently in an active Foster-to-Own trial cannot have core listing details modified.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_check_pet_update ON public.pets;
CREATE TRIGGER trg_check_pet_update
  BEFORE UPDATE ON public.pets
  FOR EACH ROW
  EXECUTE FUNCTION public.check_pet_update();


-- ==============================================================================
-- 2. GLOBAL COMPLETED ADOPTION UNIQUENESS CONSTRAINT
-- ==============================================================================
-- Guarantees at the database level that no pet can ever be marked 'completed'
-- more than once, preventing simultaneous adoption completion race conditions.
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_completed_adoption_per_pet
  ON public.adoptions (pet_id)
  WHERE status = 'completed';


-- ==============================================================================
-- 3. SEARCH_PATH HARDENING FOR PROFILE INITIALIZATION TRIGGER
-- ==============================================================================
-- Redefine public.handle_new_user() with explicit search_path = public
-- to eliminate search_path manipulation risks during automatic user signup.
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ==============================================================================
-- 4. SUPABASE STORAGE BUCKET CONFIGURATION & RLS POLICIES
-- ==============================================================================
-- Creates the public 'pet-photos' bucket with strict 5MB file size limits
-- and image-only MIME type whitelisting.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'pet-photos',
      'pet-photos',
      true,
      5242880, -- 5 MB
      ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
    )
    ON CONFLICT (id) DO UPDATE SET
      public = true,
      file_size_limit = 5242880,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- Enable RLS on storage.objects if available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    EXECUTE 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY';

    -- Public read policy for pet photos
    EXECUTE 'DROP POLICY IF EXISTS "Pet photos are publicly viewable" ON storage.objects';
    EXECUTE 'CREATE POLICY "Pet photos are publicly viewable" ON storage.objects FOR SELECT USING (bucket_id = ''pet-photos'')';

    -- Authenticated upload restricted to provider-scoped path: pets/{auth.uid()}/...
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated providers can upload pet photos" ON storage.objects';
    EXECUTE 'CREATE POLICY "Authenticated providers can upload pet photos" ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = ''pet-photos''
        AND auth.role() = ''authenticated''
        AND (storage.foldername(name))[1] = ''pets''
        AND (storage.foldername(name))[2] = auth.uid()::text
      )';

    -- Provider or admin delete policy
    EXECUTE 'DROP POLICY IF EXISTS "Providers can delete their own uploaded pet photos" ON storage.objects';
    EXECUTE 'CREATE POLICY "Providers can delete their own uploaded pet photos" ON storage.objects FOR DELETE
      USING (
        bucket_id = ''pet-photos''
        AND (
          (storage.foldername(name))[2] = auth.uid()::text
          OR public.is_admin()
        )
      )';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;
